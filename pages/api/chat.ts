/**
 * Chat assistant — server-side orchestrator.
 *
 * Replaces the client-side Puter.js integration. Talks to AWS Bedrock through
 * Cloudflare AI Gateway, with five gating layers in front of every Opus call:
 *
 *   1. Method, content-type, body-size sanity checks
 *   2. Turnstile verification (first request per session) → signed cookie
 *   3. KV-backed rate limits: per-IP daily msgs, per-session daily msgs,
 *      per-IP daily token budget
 *   4. Haiku topic classifier (one-token YES/NO) — refuses off-topic before
 *      Opus runs, for ~$0.0001 per check
 *   5. Opus 4.7 generation (capped max_tokens, no tool use)
 *
 * The wire format is Server-Sent Events: each line of meaningful response
 * arrives as `data: {"type":"text","content":"..."}\n\n`. A terminal
 * `data: {"type":"done"}` marks completion. Errors send `data:
 * {"type":"error","content":"..."}` and end the stream.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextApiRequest, NextApiResponse } from 'next'

import { invokeBedrock, type BedrockEnv } from '@/lib/chat-server/bedrock'
import { classifyMessage } from '@/lib/chat-server/classify'
import {
  type ChatKv,
  checkRateLimit,
  incrementMessageCounters,
  incrementTokenSpend
} from '@/lib/chat-server/rate-limit'
import { issueSession, verifySession } from '@/lib/chat-server/session'
import { verifyTurnstile } from '@/lib/chat-server/turnstile'

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const OPUS_MODEL = 'us.anthropic.claude-opus-4-7'
const MAX_USER_MESSAGE_CHARS = 4000
const MAX_HISTORY_CHARS = 32_000
const MAX_HISTORY_TURNS = 20
const OPUS_MAX_TOKENS = 800

const SYSTEM_PROMPT = `You are TechEmpower's friendly assistant. TechEmpower is a nonprofit that helps people with low income find free technology resources and programs in Nevada County, California.

IMPORTANT RULES:
- Use simple, plain language a 5th-grader could understand. Many people you help may not be comfortable with technology.
- Be warm and encouraging. Never talk down to anyone.
- Keep your answers short — two to three short paragraphs at most.
- Use markdown formatting: **bold** for emphasis, [link text](/path) for links to guides and resources, and bullet lists when listing multiple items.
- Always format guide links as clickable markdown links, e.g. [Free Internet Options](/guides/free-internet).
- If someone asks about something outside of TechEmpower's services, politely let them know you can only help with free resources and programs, and suggest they call 2-1-1 for other local help.

GUIDES YOU KNOW ABOUT (always link using these exact paths):
- /guides/how-to-use-techempower — How to Use TechEmpower.org (start here for new visitors)
- /guides/free-internet — Free Internet Options (low-cost and no-cost internet programs)
- /guides/ev-incentives — EV & Plug-in Hybrid Incentives (money-saving programs for electric vehicles)
- /guides/ebt-balance — Check Your EBT Balance (how to see how much is on your EBT card)
- /guides/ebt-spending — Best Places to Spend EBT (where and what you can buy with EBT / SNAP)
- /guides/findhelp — findhelp.org (search engine for free and reduced-cost services near you)
- /guides/password-manager — Password Manager Guide (keep your accounts safe with a free tool)
- /guides/free-cell-service — Free Cell Service & Smartphone (get a free government phone and plan)

OTHER RESOURCES:
- /resources — the full searchable database of free resources

TIPS:
- When a guide matches someone's question, include the link so they can read more.
- Mention that anyone can call 2-1-1 for free, personalized help finding local services.
- For the full list of resources, point people to /resources.`

const OFF_TOPIC_REPLY = `I can only help with TechEmpower's free programs and technology resources for Nevada County, California. For other kinds of help, please call **2-1-1** — it's free, confidential, and available in many languages, 24 hours a day. You can also explore our [full resource list](/resources) anytime.`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatRequestBody {
  message?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  turnstileToken?: string
  pagePath?: string
  pageTitle?: string
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // ---- Body parsing + validation -----------------------------------------

  const body = (req.body || {}) as ChatRequestBody
  const message = (body.message ?? '').toString()
  const history = Array.isArray(body.history) ? body.history : []
  const turnstileToken = (body.turnstileToken ?? '').toString()
  const pagePath = (body.pagePath ?? '').toString().slice(0, 200)
  const pageTitle = (body.pageTitle ?? '').toString().slice(0, 200)

  if (!message.trim()) {
    return res.status(400).json({ error: 'empty_message' })
  }
  if (message.length > MAX_USER_MESSAGE_CHARS) {
    return res.status(400).json({ error: 'message_too_long' })
  }
  if (history.length > MAX_HISTORY_TURNS) {
    return res.status(400).json({ error: 'history_too_long' })
  }
  const historyChars = history.reduce(
    (n, m) => n + (typeof m.content === 'string' ? m.content.length : 0),
    0
  )
  if (historyChars > MAX_HISTORY_CHARS) {
    return res.status(400).json({ error: 'history_too_large' })
  }

  // ---- Environment + bindings --------------------------------------------

  const cf = getCloudflareContext()
  const env = (cf.env ?? {}) as {
    CHAT_KV?: ChatKv
    AWS_ACCESS_KEY_ID?: string
    AWS_SECRET_ACCESS_KEY?: string
    AWS_REGION?: string
    AI_GATEWAY_BASE?: string
    TURNSTILE_SECRET_KEY?: string
    SESSION_SIGN_SECRET?: string
  }

  const sessionSecret = env.SESSION_SIGN_SECRET ?? ''
  const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? ''
  const awsAccessKeyId = env.AWS_ACCESS_KEY_ID ?? ''
  const awsSecretAccessKey = env.AWS_SECRET_ACCESS_KEY ?? ''
  const awsRegion = env.AWS_REGION ?? 'us-west-2'
  const aiGatewayBase = env.AI_GATEWAY_BASE ?? ''
  const chatKv = env.CHAT_KV

  // AWS keys + session secret are required. Turnstile + AI Gateway are
  // optional — see GitHub issues for the follow-up provisioning work. Without
  // Turnstile we lose bot defense; without AI Gateway we lose observability.
  // Rate limits + topic classifier still gate every call.
  if (!sessionSecret || !awsAccessKeyId || !awsSecretAccessKey) {
    console.error('[chat] missing required env', {
      hasSessionSecret: !!sessionSecret,
      hasAwsKeys: !!awsAccessKeyId && !!awsSecretAccessKey,
      hasGateway: !!aiGatewayBase,
      hasTurnstile: !!turnstileSecret
    })
    return res.status(500).json({ error: 'misconfigured' })
  }

  const bedrockEnv: BedrockEnv = {
    AWS_ACCESS_KEY_ID: awsAccessKeyId,
    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
    AWS_REGION: awsRegion,
    AI_GATEWAY_BASE: aiGatewayBase
  }

  // ---- Session + Turnstile -----------------------------------------------

  const cookieHeader = req.headers.cookie ?? null
  let session = await verifySession(cookieHeader, sessionSecret)
  let newCookie: string | null = null

  if (!session) {
    // When Turnstile isn't provisioned yet, fall back to issuing a session
    // cookie unconditionally. Bot defense still relies on KV rate limits +
    // the Haiku topic classifier; Turnstile would just front-load the cheap
    // rejection. See: deferred GH issue "Provision Cloudflare Turnstile".
    if (turnstileSecret) {
      const verdict = await verifyTurnstile(
        turnstileToken,
        turnstileSecret,
        clientIp(req)
      )
      if (!verdict.ok) {
        return res.status(403).json({
          error: 'turnstile_failed',
          codes: verdict.errorCodes
        })
      }
    }
    const issued = await issueSession(sessionSecret)
    session = issued.payload
    newCookie = issued.cookie
  }

  // ---- Rate limit --------------------------------------------------------

  const ip = clientIp(req)
  if (chatKv) {
    const rl = await checkRateLimit({ CHAT_KV: chatKv }, ip, session.sessionId)
    if (!rl.ok) {
      return res.status(429).json({
        error: 'rate_limited',
        reason: rl.reason,
        retryAfterSeconds: rl.retryAfterSeconds
      })
    }
  }

  // ---- Topic classifier --------------------------------------------------

  const classification = await classifyMessage(bedrockEnv, message)

  // Stream begins. Once we set SSE headers, all errors flow through SSE.
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Connection', 'keep-alive')
  if (newCookie) res.setHeader('Set-Cookie', newCookie)
  res.status(200)

  const writeEvent = (obj: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`)
  }

  if (chatKv) {
    await incrementMessageCounters({ CHAT_KV: chatKv }, ip, session.sessionId)
    await incrementTokenSpend(
      { CHAT_KV: chatKv },
      ip,
      classification.inputTokens + classification.outputTokens
    )
  }

  if (!classification.allowed) {
    writeEvent({ type: 'text', content: OFF_TOPIC_REPLY })
    writeEvent({ type: 'done', reason: 'off_topic' })
    return res.end()
  }

  // ---- Opus call ---------------------------------------------------------

  const fullSystem = SYSTEM_PROMPT + buildPageContext(pagePath, pageTitle)

  try {
    const result = await invokeBedrock(bedrockEnv, {
      modelId: OPUS_MODEL,
      system: fullSystem,
      messages: [
        ...history.map((h) => ({
          role: h.role,
          content: (h.content ?? '').toString().slice(0, 4000)
        })),
        { role: 'user' as const, content: message }
      ],
      maxTokens: OPUS_MAX_TOKENS,
      temperature: 0.5
    })

    writeEvent({ type: 'text', content: result.text })
    writeEvent({
      type: 'done',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      stopReason: result.stopReason
    })

    if (chatKv) {
      await incrementTokenSpend(
        { CHAT_KV: chatKv },
        ip,
        result.inputTokens + result.outputTokens
      )
    }
  } catch (err) {
    console.error('[chat] opus invoke failed', err)
    writeEvent({
      type: 'error',
      content:
        'Something went wrong while talking to the assistant. Please try again in a moment.'
    })
  } finally {
    res.end()
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clientIp(req: NextApiRequest): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string') return xff.split(',')[0]!.trim()
  if (Array.isArray(xff) && xff.length > 0) return xff[0]!.split(',')[0]!.trim()
  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string') return realIp
  return 'unknown'
}

function buildPageContext(path: string, title: string): string {
  if (!path) return ''
  if (path === '/') return '\n\nThe visitor is currently on the homepage.'
  if (title) {
    return `\n\nThe visitor is currently viewing: "${title}" (${path})`
  }
  return `\n\nThe visitor is currently viewing the page: ${path}`
}

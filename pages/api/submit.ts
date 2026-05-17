import { type NextApiRequest, type NextApiResponse } from 'next'

import { submissionsQueueDatabaseId } from '@/lib/config'

// ---------------------------------------------------------------------------
// /api/submit — visitor "Submit a Resource" intake
//
// Validates the form payload, verifies the Cloudflare Turnstile challenge,
// enforces a per-IP daily rate limit via Workers KV (binding `SUBMIT_KV`),
// hashes the submitter IP, and creates a row in the Notion "Resources
// Submissions Queue" database for JP to moderate.
//
// Never leaks internal errors — every server-side failure surfaces as a
// generic 500 with a stable user-facing message. Validation problems are
// 400/422; auth/captcha failures are 401/403; rate-limit is 429.
// ---------------------------------------------------------------------------

const ALLOWED_CATEGORIES = [
  'Internet & Phone',
  'Food Benefits',
  'Utilities',
  'Healthcare',
  'Housing',
  'Transportation',
  'Education',
  'Employment',
  'Childcare',
  'Legal',
  'Mental Health',
  'Other'
] as const

type Category = (typeof ALLOWED_CATEGORIES)[number]

interface ValidatedSubmission {
  name: string
  url: string
  category: Category
  description: string
  whoItHelps: string
  submitterName: string
  submitterEmail: string
  turnstileToken: string
}

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 * 24 // 1 day

// Simple, predictable RFC-5322-ish email check. Intentionally loose — we
// don't want to reject legitimate emails (e.g. tagged addresses). The Notion
// field is `email`-typed, so Notion will reject malformed values too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function badRequest(res: NextApiResponse, error: string, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(
  body: unknown
): { ok: true; data: ValidatedSubmission } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body.' }
  }
  const b = body as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (name.length < 5 || name.length > 200) {
    return {
      ok: false,
      error: 'Name must be between 5 and 200 characters.'
    }
  }

  const url = typeof b.url === 'string' ? b.url.trim() : ''
  if (!url || url.length > 500 || !isHttpUrl(url)) {
    return {
      ok: false,
      error: 'Please enter a valid http(s) URL (max 500 characters).'
    }
  }

  const category = typeof b.category === 'string' ? b.category : ''
  if (!ALLOWED_CATEGORIES.includes(category as Category)) {
    return { ok: false, error: 'Please choose a category from the list.' }
  }

  const description =
    typeof b.description === 'string' ? b.description.trim() : ''
  if (description.length < 10 || description.length > 2000) {
    return {
      ok: false,
      error: 'Description must be between 10 and 2000 characters.'
    }
  }

  const whoItHelps = typeof b.whoItHelps === 'string' ? b.whoItHelps.trim() : ''
  if (whoItHelps.length > 1000) {
    return { ok: false, error: 'Who-it-helps must be 1000 characters or less.' }
  }

  const submitterName =
    typeof b.submitterName === 'string' ? b.submitterName.trim() : ''
  if (submitterName.length > 100) {
    return {
      ok: false,
      error: 'Your name must be 100 characters or less.'
    }
  }

  const submitterEmail =
    typeof b.submitterEmail === 'string' ? b.submitterEmail.trim() : ''
  if (submitterEmail.length > 200) {
    return { ok: false, error: 'Email must be 200 characters or less.' }
  }
  if (submitterEmail && !EMAIL_RE.test(submitterEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const turnstileToken =
    typeof b.turnstileToken === 'string' ? b.turnstileToken : ''
  // Captcha is opt-in — only enforced when both client site key and server
  // secret are configured. See deferred GH issue "Provision Cloudflare
  // Turnstile". Without it we rely on KV rate limits for abuse defense.
  const turnstileConfigured = !!process.env.TURNSTILE_SECRET_KEY
  if (turnstileConfigured && !turnstileToken) {
    return {
      ok: false,
      error: 'Captcha verification missing — please refresh and try again.'
    }
  }

  return {
    ok: true,
    data: {
      name,
      url,
      category: category as Category,
      description,
      whoItHelps,
      submitterName,
      submitterEmail,
      turnstileToken
    }
  }
}

// ---------------------------------------------------------------------------
// Turnstile verification — re-implemented inline because there's no shared
// chat-server/turnstile.ts in this repo. Uses the standard server-side
// siteverify endpoint.
// ---------------------------------------------------------------------------
async function verifyTurnstile(
  token: string,
  remoteIp: string | undefined
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Turnstile isn't provisioned — allow the submission. Defense-in-depth
    // is provided by KV rate limits and Notion-side moderation.
    console.warn(
      '[submit] TURNSTILE_SECRET_KEY not set — skipping captcha verification.'
    )
    return true
  }

  const params = new URLSearchParams()
  params.set('secret', secret)
  params.set('response', token)
  if (remoteIp) params.set('remoteip', remoteIp)

  try {
    const resp = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )
    if (!resp.ok) return false
    const data = (await resp.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('[submit] turnstile siteverify error', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Workers KV rate limit — soft-fails (allows the request) when the binding
// isn't available (e.g., local `next dev` without `wrangler dev`).
// ---------------------------------------------------------------------------
interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>
}

async function getSubmitKv(): Promise<KVNamespaceLike | null> {
  try {
    const mod = await import('@opennextjs/cloudflare')
    const { env } = mod.getCloudflareContext()
    const kv = (env as unknown as { SUBMIT_KV?: KVNamespaceLike }).SUBMIT_KV
    return kv ?? null
  } catch {
    return null
  }
}

async function checkAndIncrementRateLimit(
  ipHash: string
): Promise<{ ok: true } | { ok: false; remainingSeconds: number }> {
  const kv = await getSubmitKv()
  if (!kv) {
    console.warn(
      '[submit] SUBMIT_KV binding unavailable — skipping rate limit (dev only).'
    )
    return { ok: true }
  }
  const key = `rl:${ipHash}:${new Date().toISOString().slice(0, 10)}`
  const current = await kv.get(key)
  const count = current ? Number.parseInt(current, 10) || 0 : 0
  if (count >= RATE_LIMIT_MAX) {
    return { ok: false, remainingSeconds: RATE_LIMIT_WINDOW_SECONDS }
  }
  await kv.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS
  })
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  // Web Crypto is available in both Node 20+ and Workers.
  const enc = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

function getClientIp(req: NextApiRequest): string {
  // Cloudflare sets cf-connecting-ip; behind any proxy chain the first
  // x-forwarded-for entry is the original client.
  const cfIp = req.headers['cf-connecting-ip']
  if (typeof cfIp === 'string' && cfIp) return cfIp
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff) {
    return xff.split(',')[0]!.trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

function richText(value: string) {
  // Notion requires rich_text values to be split into chunks of ≤2000 chars
  // each. Our description max is 2000 so the single-chunk form is fine, but
  // we still guard in case validation limits ever grow.
  if (!value) return [] as Array<{ type: 'text'; text: { content: string } }>
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += 2000) {
    chunks.push(value.slice(i, i + 2000))
  }
  return chunks.map((c) => ({
    type: 'text' as const,
    text: { content: c }
  }))
}

// ---------------------------------------------------------------------------
// Notion page creation. Calls the REST API directly with the existing
// NOTION_TOKEN secret that powers the rest of the site, so no new dep.
// ---------------------------------------------------------------------------
async function createSubmissionPage(
  data: ValidatedSubmission,
  ipHash: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    console.error('[submit] NOTION_TOKEN env var is not configured')
    return { ok: false, error: 'Server configuration error.' }
  }

  const properties: Record<string, unknown> = {
    Name: { title: richText(data.name) },
    URL: { url: data.url },
    Category: { multi_select: [{ name: data.category }] },
    Description: { rich_text: richText(data.description) },
    Status: { select: { name: 'New' } },
    'Submitter IP': { rich_text: richText(`sha256:${ipHash}`) }
  }
  if (data.whoItHelps) {
    properties['Who it helps'] = { rich_text: richText(data.whoItHelps) }
  }
  if (data.submitterName) {
    properties['Submitter name'] = {
      rich_text: richText(data.submitterName)
    }
  }
  if (data.submitterEmail) {
    properties['Submitter email'] = { email: data.submitterEmail }
  }

  try {
    const resp = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: submissionsQueueDatabaseId },
        properties
      })
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error(
        '[submit] notion create page failed',
        resp.status,
        text.slice(0, 500)
      )
      return { ok: false, error: 'Could not save submission.' }
    }
    const body = (await resp.json()) as { id?: string }
    if (!body.id) {
      console.error('[submit] notion response missing id')
      return { ok: false, error: 'Could not save submission.' }
    }
    return { ok: true, id: body.id }
  } catch (err) {
    console.error('[submit] notion create page exception', err)
    return { ok: false, error: 'Could not save submission.' }
  }
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
    return badRequest(res, 'Method not allowed.', 405)
  }

  // Next.js parses JSON automatically when Content-Type is application/json.
  // Reject anything else early so we can keep error paths short.
  const ct = req.headers['content-type'] || ''
  if (!ct.includes('application/json')) {
    return badRequest(res, 'Expected application/json.', 415)
  }

  const validation = validate(req.body)
  if (!validation.ok) {
    return badRequest(res, validation.error, 422)
  }
  const data = validation.data

  const ip = getClientIp(req)
  const ipHash = await sha256Hex(ip)

  const turnstileOk = await verifyTurnstile(data.turnstileToken, ip)
  if (!turnstileOk) {
    return badRequest(
      res,
      'Captcha check failed — please refresh and try again.',
      403
    )
  }

  const rl = await checkAndIncrementRateLimit(ipHash)
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.remainingSeconds))
    return badRequest(
      res,
      'You have reached the daily submission limit. Please try again tomorrow.',
      429
    )
  }

  const created = await createSubmissionPage(data, ipHash)
  if (!created.ok) {
    return res.status(500).json({ ok: false, error: created.error })
  }

  return res.status(200).json({ ok: true, id: created.id })
}

/**
 * Chat client — talks to our /api/chat Server-Sent-Events endpoint.
 *
 * Replaced the previous Puter.js SDK integration. The server (running on
 * Cloudflare Workers) now owns auth, rate limiting, topic gating, and the
 * Bedrock Opus call. This module:
 *
 *   1. Loads Cloudflare Turnstile invisibly on first chat (if no session
 *      cookie already exists).
 *   2. Posts the message + history to /api/chat with the Turnstile token.
 *   3. Parses the SSE response stream and yields text chunks back to
 *      ChatAgent.tsx.
 *
 * Public API (`streamChat`, `ChatMessage`, `ensurePuterAuth`) preserved so
 * components/ChatAgent.tsx and components/Layout.tsx don't need to change.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const CHAT_ENDPOINT = '/api/chat'
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SESSION_COOKIE = 'te_chat_sid'

// ---------------------------------------------------------------------------
// Turnstile (Cloudflare invisible captcha)
// ---------------------------------------------------------------------------

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      el: HTMLElement,
      opts: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        size?: 'invisible' | 'flexible' | 'normal'
        execution?: 'render' | 'execute'
      }
    ) => string
    execute: (widgetId: string) => void
    reset: (widgetId: string) => void
  }
}

let turnstileLoaderPromise: Promise<void> | null = null
let turnstileWidgetId: string | null = null

function getSiteKey(): string {
  return (
    (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? ''
  )
}

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))
}

function loadTurnstile(): Promise<void> {
  if (turnstileLoaderPromise) return turnstileLoaderPromise

  turnstileLoaderPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Turnstile can only load in the browser.'))
      return
    }

    if ((window as TurnstileWindow).turnstile) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT
    script.async = true
    script.defer = true
    script.addEventListener('load', () => {
      // Turnstile attaches its global synchronously on script load
      if ((window as TurnstileWindow).turnstile) resolve()
      else reject(new Error('Turnstile script loaded but global missing.'))
    })
    script.addEventListener('error', () => {
      turnstileLoaderPromise = null
      reject(
        new Error(
          'Failed to load Cloudflare Turnstile. The script may be blocked by an ad-blocker or network filter.'
        )
      )
    })
    document.head.append(script)
  })

  return turnstileLoaderPromise
}

/**
 * Renders an invisible Turnstile widget once, then executes it on demand
 * to produce a fresh token. Returns null if Turnstile isn't configured —
 * the server will reject in that case, which is appropriate.
 */
async function getTurnstileToken(): Promise<string | null> {
  const sitekey = getSiteKey()
  if (!sitekey) {
    console.warn('[chat] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set')
    return null
  }

  await loadTurnstile()
  const ts = (window as TurnstileWindow).turnstile
  if (!ts) return null

  return new Promise<string | null>((resolve) => {
    // Create a host element for the invisible widget if we don't have one yet
    let host = document.querySelector<HTMLElement>('#te-turnstile-host')
    if (!host) {
      host = document.createElement('div')
      host.id = 'te-turnstile-host'
      host.style.position = 'fixed'
      host.style.bottom = '0'
      host.style.left = '0'
      host.style.visibility = 'hidden'
      host.style.zIndex = '-1'
      document.body.append(host)
    }

    let settled = false
    const finish = (token: string | null) => {
      if (settled) return
      settled = true
      resolve(token)
    }

    if (!turnstileWidgetId) {
      turnstileWidgetId = ts.render(host, {
        sitekey,
        size: 'invisible',
        execution: 'execute',
        callback: (token) => finish(token),
        'error-callback': () => finish(null)
      })
    }

    // Trigger a token fetch on the (possibly pre-rendered) widget
    try {
      ts.execute(turnstileWidgetId)
    } catch {
      finish(null)
    }

    // Hard timeout — if Turnstile never resolves, don't hang the chat
    setTimeout(() => finish(null), 8000)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compat shim — the old Puter integration had a sign-in step. Nothing to
 * do now; the server issues a session cookie automatically after Turnstile.
 */
export async function ensurePuterAuth(): Promise<boolean> {
  return true
}

/**
 * Streams an assistant response. Yields text fragments as they arrive,
 * yields error strings on failure, never throws.
 */
export async function* streamChat(
  message: string,
  history: ChatMessage[]
): AsyncGenerator<string> {
  if (typeof window === 'undefined') {
    yield 'Sorry, the chat assistant is only available in your browser.'
    return
  }

  // Turnstile is opt-in — only invoke when a site key has been provisioned.
  // Without it the server issues a session cookie unconditionally; rate
  // limits + topic classifier still gate every call.
  let turnstileToken: string | null = null
  if (!hasSessionCookie() && getSiteKey()) {
    try {
      turnstileToken = await getTurnstileToken()
    } catch (err) {
      console.warn('[chat] turnstile failed', err)
    }
    if (!turnstileToken) {
      yield "I'm having trouble verifying you're human. If you have an ad-blocker, please allow `challenges.cloudflare.com` and try again."
      return
    }
  }

  const payload = {
    message,
    history,
    turnstileToken: turnstileToken ?? undefined,
    pagePath: window.location.pathname,
    pageTitle: document.title
  }

  let response: Response
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    })
  } catch {
    yield 'I lost the connection to the assistant. Please check your internet and try again.'
    return
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let parsed: { error?: string } | null = null
    try {
      parsed = JSON.parse(errText) as { error?: string }
    } catch {
      /* not JSON */
    }

    if (response.status === 429) {
      yield "You've reached today's chat limit. Please try again tomorrow, or call **2-1-1** for free, personalized help."
      return
    }
    if (response.status === 403) {
      yield "I couldn't verify you're human. Please refresh the page and try again."
      return
    }
    if (response.status === 400 && parsed?.error === 'message_too_long') {
      yield 'That message is a bit long for me. Could you shorten it and try again?'
      return
    }
    yield 'Something went wrong while reaching the assistant. Please try again in a moment.'
    return
  }

  // ---- SSE parser ------------------------------------------------------

  const body = response.body
  if (!body) {
    yield 'The assistant returned an empty response. Please try again.'
    return
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are delimited by a blank line
    let sep = buffer.indexOf('\n\n')
    while (sep !== -1) {
      const event = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      sep = buffer.indexOf('\n\n')

      const dataLines = event
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart())
      if (dataLines.length === 0) continue

      const raw = dataLines.join('\n')
      let parsed: { type?: string; content?: string } | null = null
      try {
        parsed = JSON.parse(raw) as { type?: string; content?: string }
      } catch {
        continue
      }

      if (parsed?.type === 'text' && typeof parsed.content === 'string') {
        yield parsed.content
      } else if (parsed?.type === 'error') {
        yield parsed.content ??
          'Something went wrong while reaching the assistant. Please try again.'
        return
      } else if (parsed?.type === 'done') {
        return
      }
    }
  }
}

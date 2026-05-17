/**
 * HMAC-signed session cookies.
 *
 * Issued once Turnstile passes. Cookie body is `<sessionId>.<issuedAtMs>`
 * and the signature is HMAC-SHA256(body, SESSION_SIGN_SECRET) hex-encoded.
 * Sessions are valid for 24 hours; clients re-solve Turnstile after expiry.
 *
 * No PII in the cookie. The sessionId is a random 128-bit identifier used
 * as a KV rate-limit bucket key.
 */

const COOKIE_NAME = 'te_chat_sid'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export interface SessionPayload {
  sessionId: string
  issuedAt: number
}

export interface IssuedSession {
  payload: SessionPayload
  cookie: string
}

export async function issueSession(secret: string): Promise<IssuedSession> {
  const sessionId = randomId()
  const issuedAt = Date.now()
  const body = `${sessionId}.${issuedAt}`
  const sig = await hmacHex(secret, body)
  const value = `${body}.${sig}`

  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const cookie = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ].join('; ')

  return { payload: { sessionId, issuedAt }, cookie }
}

export async function verifySession(
  cookieHeader: string | null,
  secret: string
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null

  const raw = match.slice(COOKIE_NAME.length + 1)
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const sessionId = parts[0]!
  const issuedAtStr = parts[1]!
  const sig = parts[2]!
  const issuedAt = Number(issuedAtStr)
  if (!Number.isFinite(issuedAt)) return null
  if (Date.now() - issuedAt > SESSION_TTL_MS) return null

  const expected = await hmacHex(secret, `${sessionId}.${issuedAtStr}`)
  if (!constantTimeEqual(sig, expected)) return null

  return { sessionId, issuedAt }
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

function randomId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  )
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

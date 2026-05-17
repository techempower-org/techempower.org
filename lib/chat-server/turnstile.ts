/**
 * Cloudflare Turnstile (invisible captcha) verification.
 *
 * Called once per session — the client widget gets a token; we POST it to
 * Cloudflare's siteverify endpoint with our secret key. On success we issue
 * a signed session cookie so the user doesn't see Turnstile again until the
 * session expires.
 */

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  ok: boolean
  errorCodes?: string[]
}

/**
 * Verifies a Turnstile token against Cloudflare's siteverify endpoint.
 *
 * @param token   the client-side widget's `cf-turnstile-response` value
 * @param secret  the Turnstile secret key (kept server-side)
 * @param remoteIp optional client IP for additional verification
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string
): Promise<TurnstileResult> {
  if (!token || token.length > 2048)
    return { ok: false, errorCodes: ['bad-token'] }

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (remoteIp) form.append('remoteip', remoteIp)

  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form })
    if (!res.ok) return { ok: false, errorCodes: ['siteverify-http-error'] }
    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }
    return { ok: !!data.success, errorCodes: data['error-codes'] }
  } catch {
    return { ok: false, errorCodes: ['siteverify-network-error'] }
  }
}

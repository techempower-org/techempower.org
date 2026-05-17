/**
 * Cloudflare Workers KV-backed rate limiter.
 *
 * Three independent buckets, all must pass for a request to proceed:
 *
 * 1. Per-IP daily count (default 60 msgs/IP/day) — coarse anti-abuse.
 * 2. Per-session daily count (default 30 msgs/session/day) — fine-grained;
 *    librarians or kiosks behind one IP each have their own bucket.
 * 3. Per-IP daily token budget (default 100k tokens/IP/day) — $ cap. Updated
 *    AFTER each model call lands so it reflects real spend.
 *
 * Counters expire at next UTC midnight via KV TTL so we don't accumulate
 * forever-dead keys.
 */

/**
 * Minimal KV interface — we only use `get` and `put`. Avoids depending on
 * @cloudflare/workers-types for one symbol.
 */
export interface ChatKv {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number }
  ): Promise<void>
}

export interface RateLimitEnv {
  CHAT_KV: ChatKv
}

export interface RateLimitConfig {
  perIpDaily: number
  perSessionDaily: number
  perIpDailyTokens: number
}

const DEFAULTS: RateLimitConfig = {
  perIpDaily: 60,
  perSessionDaily: 30,
  perIpDailyTokens: 100_000
}

export interface CheckResult {
  ok: boolean
  reason?: 'ip-daily' | 'session-daily' | 'ip-tokens'
  retryAfterSeconds?: number
}

/** UTC midnight + 1 day — KV TTL boundary. */
function ttlSecondsUntilNextMidnightUTC(): number {
  const now = Date.now()
  const nextMidnight = Math.floor(now / 86_400_000) * 86_400_000 + 86_400_000
  return Math.max(60, Math.ceil((nextMidnight - now) / 1000))
}

function dayStampUTC(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

/**
 * Cheap "do we have budget?" check. Reads only — does NOT increment.
 * Call this *before* invoking the model; call incrementOnSuccess after.
 */
export async function checkRateLimit(
  env: RateLimitEnv,
  ip: string,
  sessionId: string,
  config: Partial<RateLimitConfig> = {}
): Promise<CheckResult> {
  const c = { ...DEFAULTS, ...config }
  const day = dayStampUTC()
  const kv = env.CHAT_KV

  const [ipCountStr, sessionCountStr, ipTokensStr] = await Promise.all([
    kv.get(`ip:${ip}:msgs:${day}`),
    kv.get(`sess:${sessionId}:msgs:${day}`),
    kv.get(`ip:${ip}:tokens:${day}`)
  ])

  const ipCount = Number(ipCountStr) || 0
  const sessionCount = Number(sessionCountStr) || 0
  const ipTokens = Number(ipTokensStr) || 0
  const retryAfter = ttlSecondsUntilNextMidnightUTC()

  if (ipCount >= c.perIpDaily) {
    return { ok: false, reason: 'ip-daily', retryAfterSeconds: retryAfter }
  }
  if (sessionCount >= c.perSessionDaily) {
    return { ok: false, reason: 'session-daily', retryAfterSeconds: retryAfter }
  }
  if (ipTokens >= c.perIpDailyTokens) {
    return { ok: false, reason: 'ip-tokens', retryAfterSeconds: retryAfter }
  }

  return { ok: true }
}

/**
 * Increments the message counters (pre-LLM) — fire before the long-running
 * model call so a hung request still counts.
 */
export async function incrementMessageCounters(
  env: RateLimitEnv,
  ip: string,
  sessionId: string
): Promise<void> {
  const day = dayStampUTC()
  const ttl = ttlSecondsUntilNextMidnightUTC()
  const kv = env.CHAT_KV

  // KV doesn't have atomic increment; read-modify-write is racy but tolerable
  // for soft quotas (off-by-one matters less than wall-clock recovery).
  const [ipStr, sessStr] = await Promise.all([
    kv.get(`ip:${ip}:msgs:${day}`),
    kv.get(`sess:${sessionId}:msgs:${day}`)
  ])
  const ip2 = (Number(ipStr) || 0) + 1
  const sess2 = (Number(sessStr) || 0) + 1

  await Promise.all([
    kv.put(`ip:${ip}:msgs:${day}`, String(ip2), { expirationTtl: ttl }),
    kv.put(`sess:${sessionId}:msgs:${day}`, String(sess2), {
      expirationTtl: ttl
    })
  ])
}

/**
 * Increments the per-IP token budget after a successful model call.
 */
export async function incrementTokenSpend(
  env: RateLimitEnv,
  ip: string,
  tokens: number
): Promise<void> {
  if (tokens <= 0) return
  const day = dayStampUTC()
  const ttl = ttlSecondsUntilNextMidnightUTC()
  const cur = Number(await env.CHAT_KV.get(`ip:${ip}:tokens:${day}`)) || 0
  await env.CHAT_KV.put(`ip:${ip}:tokens:${day}`, String(cur + tokens), {
    expirationTtl: ttl
  })
}

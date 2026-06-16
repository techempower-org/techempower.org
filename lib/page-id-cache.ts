/**
 * URI → Notion-pageId resolution cache for the dynamic route
 * (`pages/[...pageId].tsx` → `resolveNotionPage`).
 *
 * Why this exists (issue #15): when a slug is NOT in the build-time
 * `pageUrlOverrides` index (which already covers every guide + all 253
 * resource entries via the lockfile spread), `resolveNotionPage` falls through
 * to `getSiteMap()` (a full Notion space crawl — ~10-15 `notion.getPage()`
 * calls, each fanning out to several sub-requests) AND `resolveCollectionSlug()`
 * (another full `RESOURCES_PAGE` fetch). That is the worst case for a *404*:
 * bogus/scanner URLs and accidental crawlers pay the entire fan-out on every
 * hit. The in-memory `db` (Keyv, `isRedisEnabled=false`) does not survive a
 * cold Worker invocation, so the crawl repeats across isolates.
 *
 * Two-tier cache, storing BOTH positive (slug→pageId) and negative (404)
 * results so repeat traffic short-circuits the fan-out:
 *
 *   1. Workers KV (binding `SITEMAP_KV`) when present — survives Worker
 *      invocation boundaries, so the very next request for the same slug skips
 *      the crawl even on a fresh cold isolate. This is the full fix.
 *   2. In-memory Keyv (`db`) fallback — used in dev, at build time, and on
 *      Workers until the `SITEMAP_KV` namespace is created + bound. Still kills
 *      repeat crawls within a single warm isolate (e.g. a bot hammering bogus
 *      URLs), so the optimization is never a no-op even before KV is wired.
 *
 * Negative entries carry a short TTL so a slug that becomes valid after a
 * Notion edit (a brand-new resource not yet in the lockfile) resolves within
 * the TTL window without waiting on a lockfile refresh + redeploy.
 */
import { db } from './db'

// Sentinel stored for slugs that resolved to a 404. A real Notion pageId is a
// 32-char hex string (no underscores), so this can never collide with one.
const NOT_FOUND = '__NOT_FOUND__'

// Positive: a slug→pageId mapping is effectively permanent (it only changes if
// the page is deleted, which a redeploy handles). A day-long TTL keeps KV from
// holding forever-dead keys without meaningfully re-running the (cheap, cached)
// resolution.
const POSITIVE_TTL_S = 86_400 // 24h
// Negative: short, so a freshly-added Notion page that was 404-cached during
// the gap before a lockfile refresh self-heals within the hour.
const NEGATIVE_TTL_S = 3600 // 1h

/**
 * Minimal Workers KV surface — only `get`/`put` are used. Mirrors the
 * `ChatKv` interface in `lib/chat-server/rate-limit.ts` to avoid a dependency
 * on `@cloudflare/workers-types` for one symbol.
 */
interface PageIdKv {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number }
  ): Promise<void>
}

/**
 * Resolve the optional `SITEMAP_KV` binding. OpenNext's Pages-Router runtime
 * exposes KV bindings on `globalThis` under their binding name (NOT
 * `process.env`, and NOT `getCloudflareContext`, which is App-Router/middleware
 * only) — same access path as `CHAT_KV` in `pages/api/chat.ts`. Returns
 * `undefined` until the namespace is created + bound, at which point callers
 * transparently fall back to the in-memory `db`.
 */
function getKv(): PageIdKv | undefined {
  return (globalThis as unknown as { SITEMAP_KV?: PageIdKv }).SITEMAP_KV
}

export type PageIdCacheResult =
  | { hit: true; notFound: true }
  | { hit: true; notFound: false; pageId: string }
  | { hit: false }

/**
 * Look up a previously-resolved slug. A `{ hit: true }` result (positive OR
 * negative) lets the caller skip `getSiteMap()` + `resolveCollectionSlug()`.
 * Cache backend errors degrade to a miss so resolution still proceeds.
 */
export async function readCachedPageId(
  key: string
): Promise<PageIdCacheResult> {
  const kv = getKv()
  try {
    const value = kv ? await kv.get(key) : await db.get(key)
    if (value === NOT_FOUND) {
      return { hit: true, notFound: true }
    }
    if (value) {
      return { hit: true, notFound: false, pageId: value }
    }
    return { hit: false }
  } catch (err: any) {
    console.warn(`page-id-cache get error "${key}"`, err?.message)
    return { hit: false }
  }
}

/** Cache a successful slug→pageId resolution. */
export async function writeCachedPageId(
  key: string,
  pageId: string
): Promise<void> {
  const kv = getKv()
  try {
    if (kv) {
      await kv.put(key, pageId, { expirationTtl: POSITIVE_TTL_S })
    } else {
      await db.set(key, pageId, POSITIVE_TTL_S * 1000)
    }
  } catch (err: any) {
    console.warn(`page-id-cache set error "${key}"`, err?.message)
  }
}

/**
 * Cache a 404 so the next identical request short-circuits the Notion crawl.
 * Only call this for a *genuine* miss (slug did not resolve) — never for a
 * transient upstream failure, or a real page would be masked for the TTL.
 */
export async function writeCachedNotFound(key: string): Promise<void> {
  const kv = getKv()
  try {
    if (kv) {
      await kv.put(key, NOT_FOUND, { expirationTtl: NEGATIVE_TTL_S })
    } else {
      await db.set(key, NOT_FOUND, NEGATIVE_TTL_S * 1000)
    }
  } catch (err: any) {
    console.warn(`page-id-cache set-404 error "${key}"`, err?.message)
  }
}

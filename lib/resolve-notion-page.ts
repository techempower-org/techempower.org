import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId, uuidToId } from 'notion-utils'

import type { PageProps } from './types'
import * as acl from './acl'
import {
  environment,
  includeNotionIdInUrls,
  pageUrlAdditions,
  pageUrlOverrides,
  site
} from './config'
import resourceSlugLockfile from './data/resource-slug-lockfile.json'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getSiteMap } from './get-site-map'
import { getPage, type GetPageOptions } from './notion'
import { notion } from './notion-api'
import {
  readCachedPageId,
  writeCachedNotFound,
  writeCachedPageId
} from './page-id-cache'
import { RESOURCES_PAGE } from './page-ids'

// Build-time slug→pageId index. The lockfile JSON keys have a leading `/`
// (e.g. `/caleitc-...`); `pageUrlOverrides` in config strips it, but we
// receive the slug from Next.js without the leading slash, so build a
// matching index here. Used as a fast-path inside resolveCollectionSlug
// to avoid the heavy `notion.getPage(RESOURCES_PAGE)` call when the slug
// is already known at build time.
const resourceSlugIndex: Record<string, string> = Object.fromEntries(
  Object.entries(resourceSlugLockfile as Record<string, string>).map(
    ([slug, pageId]) => [slug.replace(/^\//, ''), pageId]
  )
)

// Strict slug shape — Notion canonical slugs are kebab-case ASCII. Anything
// containing path separators, dots, or non-printable chars is a scanner
// probe or a broken link and should NOT trigger an expensive Notion fetch.
const VALID_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,200}$/

export async function resolveNotionPage(
  domain: string,
  rawPageId?: string,
  pageOptions?: GetPageOptions
): Promise<PageProps> {
  let pageId: string | undefined
  let recordMap: ExtendedRecordMap

  if (rawPageId && rawPageId !== 'index') {
    pageId = parsePageId(rawPageId)!

    if (!pageId) {
      // check if the site configuration provides an override or a fallback for
      // the page's URI
      const override =
        pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]

      if (override) {
        pageId = parsePageId(override)!
      }
    }

    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`

    // Resolution cache (issue #15), checked BEFORE the expensive fan-out below.
    // A cached *negative* (404) result lets us skip getSiteMap() +
    // resolveCollectionSlug() entirely for repeat bogus/scanner traffic; a
    // cached *positive* result skips them for repeat legit traffic. Backed by
    // Workers KV when bound (survives cold workers), else the in-memory db.
    if (!pageId) {
      const cached = await readCachedPageId(cacheKey)
      if (cached.hit && cached.notFound) {
        return {
          error: {
            message: `Not found "${rawPageId}"`,
            statusCode: 404
          }
        }
      }
      if (cached.hit) {
        pageId = cached.pageId
      }
    }

    if (!pageId) {
      // handle mapping of user-friendly canonical page paths to Notion page IDs
      // e.g., /developer-x-entrepreneur versus /71201624b204481f862630ea25ce62fe
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]
    }

    if (!pageId) {
      // Fallback: resolve slugs for collection items (e.g. resources database
      // entries) by fetching the collection page and matching slugs against
      // the block data it already contains — avoids crawling every item.
      pageId = await resolveCollectionSlug(rawPageId)
    }

    if (pageId) {
      recordMap = await getPage(pageId, pageOptions)

      // Cache the successful mapping so repeat traffic skips the fan-out.
      await writeCachedPageId(cacheKey, pageId)
    } else {
      // Negative-cache the miss so the next identical request short-circuits
      // getSiteMap()/Notion instead of re-crawling. Both getSiteMap() AND
      // resolveCollectionSlug() THROW on a transient upstream failure (handled
      // by the caller — cache untouched), so reaching here means a genuine
      // not-found: the slug isn't a page id, isn't in the sitemap, and isn't a
      // resolvable collection slug. Safe to cache as a real 404.
      await writeCachedNotFound(cacheKey)
      return {
        error: {
          message: `Not found "${rawPageId}"`,
          statusCode: 404
        }
      }
    }
  } else {
    pageId = site.rootNotionPageId

    recordMap = await getPage(pageId, pageOptions)
  }

  const props: PageProps = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}

/**
 * Resolve a clean URL slug to a Notion page ID by searching through
 * collection items. Tries (in order):
 *   1. Build-time slug lockfile (`lib/data/resource-slug-lockfile.json`) —
 *      a 253-entry map covering the entire resources DB. ~0ms.
 *   2. Slug-shape validation — reject scanner probes and obviously bad
 *      paths BEFORE calling Notion's API.
 *   3. Full collection fetch (the original slow path) — only if the slug
 *      passes validation but isn't in the lockfile (e.g. a brand-new
 *      Notion entry added after the last lockfile refresh).
 *
 * The full fetch is the known CPU-exhaustion hotspot (Worker error 1102):
 * it pulls the entire resources record map (~3MB) and scans every block.
 * Most cold loads will now exit at step 1.
 */
async function resolveCollectionSlug(
  slug: string
): Promise<string | undefined> {
  // 1. Build-time lockfile fast path. Covers all 253 current resources.
  const locked = resourceSlugIndex[slug]
  if (locked) {
    return locked
  }

  // 2. Reject obviously-malformed slugs to avoid blowing the CPU budget on
  //    scanner traffic (`.env`, `wp-admin`, etc.). The dynamic route
  //    handler already filters known scanner patterns; this is the
  //    belt-and-suspenders fallback for anything else that isn't a
  //    realistic resource slug.
  if (!VALID_SLUG_PATTERN.test(slug)) {
    return undefined
  }

  // 3. Slow path — only reached for brand-new Notion entries not yet in
  //    the lockfile. Run `scripts/build-slug-lockfile.mjs` against a
  //    fresh /resources fetch to refresh it.
  //
  // The fetch and the scan are split deliberately. The fetch is the ONLY
  // operation here that can fail transiently (network / 5xx / 429 — and
  // notion-client has already exhausted its internal `got` retries by the
  // time it throws). A throw means we DON'T KNOW whether the slug exists, so
  // it must NOT be reported as a not-found. We rethrow: the caller
  // (resolveNotionPage) leaves the negative cache untouched on a throw — the
  // same contract getSiteMap() relies on — so a brand-new slug that merely hit
  // a Notion blip is never poisoned into a 404 for the whole NEGATIVE_TTL_S
  // window (the #36 follow-up bug this fixes).
  let collectionRecordMap
  try {
    collectionRecordMap = await notion.getPage(RESOURCES_PAGE)
  } catch (err) {
    console.warn('resolveCollectionSlug: transient Notion fetch failed', err)
    throw err
  }

  // The scan runs entirely on data already in memory (pure CPU, no I/O), so it
  // cannot fail transiently. Completing it without a match is a GENUINE
  // not-found: returning undefined lets the caller negative-cache a real 404,
  // which is the optimization we want to keep.
  const uuid = !!includeNotionIdInUrls
  for (const [blockId, blockData] of Object.entries(
    collectionRecordMap.block
  )) {
    const block = (blockData as any)?.value
    if (!block || block.type !== 'page') continue

    const canonicalId = getCanonicalPageId(blockId, collectionRecordMap, {
      uuid
    })
    if (canonicalId === slug) {
      return uuidToId(blockId)
    }
  }

  return undefined
}

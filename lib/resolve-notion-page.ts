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
import { db } from './db'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getSiteMap } from './get-site-map'
import { getPage, type GetPageOptions } from './notion'
import { notion } from './notion-api'
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

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    // TODO: should we use a TTL for these mappings or make them permanent?
    // const cacheTTL = 8.64e7 // one day in milliseconds
    const cacheTTL = undefined // disable cache TTL

    if (!pageId && useUriToPageIdCache) {
      try {
        // check if the database has a cached mapping of this URI to page ID
        pageId = await db.get(cacheKey)

        // console.log(`redis get "${cacheKey}"`, pageId)
      } catch (err: any) {
        // ignore redis errors
        console.warn(`redis error get "${cacheKey}"`, err.message)
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

      if (useUriToPageIdCache) {
        try {
          await db.set(cacheKey, pageId, cacheTTL)
        } catch (err: any) {
          console.warn(`redis error set "${cacheKey}"`, err.message)
        }
      }
    } else {
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
  try {
    const collectionRecordMap = await notion.getPage(RESOURCES_PAGE)
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
  } catch (err) {
    console.warn('resolveCollectionSlug failed', err)
  }

  return undefined
}

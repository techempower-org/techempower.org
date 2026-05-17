import { type ExtendedRecordMap } from 'notion-types'
import {
  getAllPagesInSpace,
  getBlockValue,
  getPageProperty,
  uuidToId
} from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { notion } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId ?? undefined
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

// Pages we need to individually fetch for the sitemap.
// Collection items are resolved from parent recordMaps instead.
const sitemapPageIds = new Set([
  config.rootNotionPageId,
  ...Object.values(config.pageUrlOverrides),
  ...Object.values(config.pageUrlAdditions)
])

const getPage = async (pageId: string, opts?: any) => {
  const cleanId = uuidToId(pageId)
  if (!sitemapPageIds.has(cleanId)) {
    // Skip individual fetches for collection items — their data is
    // already embedded in the parent collection page's recordMap.
    return null as any
  }

  return notion.getPage(pageId, {
    kyOptions: {
      timeout: 30_000
    },
    ...opts
  })
}

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId?: string,
  {
    maxDepth = 1
  }: {
    maxDepth?: number
  } = {}
): Promise<Partial<types.SiteMap>> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    {
      maxDepth,
      // Don't individually fetch every collection item — the parent
      // collection page's recordMap already contains their block data.
      // This avoids 60+ API calls that exhaust Notion's rate limit.
      traverseCollections: false
    }
  )

  // Collect all page block IDs to index, including collection items
  // discovered from parent recordMaps (not individually fetched).
  const allRecordMaps: ExtendedRecordMap[] = Object.values(pageMap).filter(
    (rm): rm is ExtendedRecordMap => !!rm
  )

  // Discover all page-type blocks across all loaded recordMaps.
  // This picks up collection items from parent pages without needing
  // individual fetches.
  const allPageIds = new Set<string>(Object.keys(pageMap))
  for (const rm of allRecordMaps) {
    for (const blockId of Object.keys(rm.block)) {
      const block = getBlockValue(rm.block[blockId])
      if (block?.type === 'page' && block?.alive !== false) {
        allPageIds.add(blockId)
      }
    }
  }

  function findRecordMapForBlock(blockId: string): ExtendedRecordMap | null {
    const own = pageMap[blockId]
    if (own) return own
    for (const rm of allRecordMaps) {
      if (rm.block[blockId]) return rm
    }
    return null
  }

  const canonicalPageMap = [...allPageIds].reduce(
    (map: Record<string, string>, pageId: string) => {
      const recordMap = findRecordMapForBlock(pageId)
      if (!recordMap) {
        return map
      }

      const block = getBlockValue(recordMap.block[pageId])
      if (!block) return map

      if (
        !(getPageProperty<boolean | null>('Public', block, recordMap) ?? true)
      ) {
        return map
      }

      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })!

      if (map[canonicalPageId]) {
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}

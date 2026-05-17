import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'

/** Parse category values from a Notion block's properties */
const getBlockCategories = (
  allBlocks: Record<string, any>,
  categoryPropId: string,
  blockId: string
): string[] => {
  const block = allBlocks[blockId]
  if (!block?.properties?.[categoryPropId]) return []
  const raw = block.properties[categoryPropId]
  // Format: [["Food,Senior"]] — comma-separated multi_select
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    Array.isArray(raw[0]) &&
    raw[0].length > 0
  ) {
    return (raw[0][0] as string).split(',').map((s: string) => s.trim())
  }
  return []
}

/** Evaluate whether a block matches the collection view filter */
const blockMatchesFilter = (
  allBlocks: Record<string, any>,
  categoryPropId: string,
  topFilter: any,
  outerFilters: any[],
  blockId: string
): boolean => {
  const categories = getBlockCategories(allBlocks, categoryPropId, blockId)
  const outerOp = topFilter.operator || 'or'

  const groupResults = outerFilters.map((group: any) => {
    const inner: any[] = group.filters || []
    const innerOp = group.operator || 'and'

    const innerResults = inner.map((f: any) => {
      if (f.property !== categoryPropId) return true // ignore non-category filters
      const op = f.filter?.operator
      if (op === 'enum_contains') {
        const target = f.filter?.value?.value
        return categories.includes(target)
      }
      if (op === 'is_not_empty') {
        return categories.length > 0
      }
      return true // unknown operator — don't exclude
    })

    return innerOp === 'and'
      ? innerResults.every(Boolean)
      : innerResults.some(Boolean)
  })

  return outerOp === 'and'
    ? groupResults.every(Boolean)
    : groupResults.some(Boolean)
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export interface GetPageOptions {
  collectionReducerLimit?: number
  /** Inject a client-side load-more limit into every collection view. */
  collectionLoadLimit?: number
  /** Force gallery views to show page covers (or empty placeholders). */
  enableGalleryCovers?: boolean
}

export async function getPage(
  pageId: string,
  options?: GetPageOptions
): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId, {
    ...(options?.collectionReducerLimit && {
      collectionReducerLimit: options.collectionReducerLimit
    })
  })

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    // Lazy import so `lqip-modern` / `sharp` are only loaded when the feature is enabled.
    // Cloudflare Workers can't run sharp (native binding), so the flag stays false there.
    const { getPreviewImageMap } = await import('./preview-images')
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  // Inject client-side load-more limit into collection views so
  // react-notion-x renders a "Load More" button instead of all rows.
  if (options?.collectionLoadLimit || options?.enableGalleryCovers) {
    for (const viewData of Object.values(recordMap.collection_view)) {
      const view = (viewData as any)?.value
      if (!view) continue

      if (!view.format) view.format = {}

      if (options.collectionLoadLimit) {
        view.format.inline_collection_first_load_limit = {
          limit: options.collectionLoadLimit
        }
      }

      // Force gallery covers to use page_cover so every card shows
      // an image or the styled empty placeholder.
      if (options.enableGalleryCovers && view.type === 'gallery') {
        view.format.gallery_cover = { type: 'page_cover' }
        view.format.gallery_cover_size = 'medium'
        view.format.gallery_cover_aspect = 'cover'
      }
    }
  }

  // --- Fix stale collection view filters for Category (enum_contains) ---
  // Notion's collection query index can be stale, so we re-run filters
  // client-side against the actual block data and patch collection_query.
  if (options?.enableGalleryCovers) {
    const collectionQuery = (recordMap as any).collection_query
    if (collectionQuery) {
      // Build the allBlocks map ONCE for the whole record map, not per
      // collection × per view (was O(V × N), now O(N)). On /resources with
      // 6 views × 1500+ blocks that's ~9000 fewer object accesses.
      const allBlocks: Record<string, any> = {}
      for (const [blockId, blockData] of Object.entries(
        recordMap.block as Record<string, any>
      )) {
        const block =
          (blockData as any)?.value?.value ?? (blockData as any)?.value
        if (block) allBlocks[blockId] = block
      }

      for (const [collectionId, collectionData] of Object.entries(
        recordMap.collection as Record<string, any>
      )) {
        const schema =
          collectionData?.value?.value?.schema ?? collectionData?.value?.schema
        if (!schema) continue

        // Find the Category property ID from the schema
        let categoryPropId: string | null = null
        for (const [propId, propDef] of Object.entries(
          schema as Record<string, any>
        )) {
          if (
            propDef?.name === 'Category' &&
            propDef?.type === 'multi_select'
          ) {
            categoryPropId = propId
            break
          }
        }
        if (!categoryPropId) continue

        for (const [viewId, viewData] of Object.entries(
          recordMap.collection_view as Record<string, any>
        )) {
          const view =
            (viewData as any)?.value?.value ?? (viewData as any)?.value
          if (!view) continue

          const query2 = view.query2
          if (!query2?.filter) continue

          const topFilter = query2.filter
          const outerFilters: any[] = topFilter.filters
          if (!outerFilters?.length) continue

          // Check if this view has enum_contains or is_not_empty filters on Category
          const hasCategoryFilter = outerFilters.some((group: any) => {
            const inner: any[] = group.filters
            if (!inner) return false
            return inner.some(
              (f: any) =>
                f.property === categoryPropId &&
                (f.filter?.operator === 'enum_contains' ||
                  f.filter?.operator === 'is_not_empty')
            )
          })
          if (!hasCategoryFilter) continue

          // Get the block IDs that were in the original query result for this view
          const queryResult = collectionQuery?.[collectionId]?.[viewId]
          if (!queryResult) continue

          // Collect all known block IDs from the collection query
          // (from the top-level blockIds plus all group blockIds)
          const candidateIds = new Set<string>()
          const groupResults =
            queryResult.collection_group_results ?? queryResult
          if (groupResults?.blockIds) {
            for (const id of groupResults.blockIds) candidateIds.add(id)
          }
          // Also gather from any group results
          if (groupResults?.groupResults) {
            for (const group of groupResults.groupResults) {
              if (group?.blockIds) {
                for (const id of group.blockIds) candidateIds.add(id)
              }
            }
          }
          // Also include all blocks from recordMap.block as candidates
          // since stale filters may have excluded valid blocks
          for (const blockId of Object.keys(allBlocks)) {
            candidateIds.add(blockId)
          }

          // Filter candidate blocks
          const matchedIds = [...candidateIds].filter((id) => {
            // Only consider blocks that are actual page entries (have a parent)
            const block = allBlocks[id]
            if (!block) return false
            // Must be a page block that belongs to this collection
            if (
              block.parent_id !== collectionId &&
              block.parent_table !== 'collection'
            )
              return false
            return blockMatchesFilter(
              allBlocks,
              categoryPropId!,
              topFilter,
              outerFilters,
              id
            )
          })

          // Apply sort if defined
          const sorts: any[] = query2.sort || []
          if (sorts.length > 0) {
            matchedIds.sort((a, b) => {
              for (const sortDef of sorts) {
                const prop = sortDef.property
                const direction = sortDef.direction === 'descending' ? -1 : 1
                const aBlock = allBlocks[a]
                const bBlock = allBlocks[b]

                let aVal = ''
                let bVal = ''

                if (prop === 'title' || schema[prop]?.type === 'title') {
                  aVal = aBlock?.properties?.title?.[0]?.[0] ?? ''
                  bVal = bBlock?.properties?.title?.[0]?.[0] ?? ''
                } else {
                  aVal = aBlock?.properties?.[prop]?.[0]?.[0] ?? ''
                  bVal = bBlock?.properties?.[prop]?.[0]?.[0] ?? ''
                }

                const cmp = aVal.localeCompare(bVal)
                if (cmp !== 0) return cmp * direction
              }
              return 0
            })
          }

          // Patch the collection_query results
          if (collectionQuery[collectionId]?.[viewId]) {
            const target = collectionQuery[collectionId][viewId]
            if (target.collection_group_results) {
              target.collection_group_results.blockIds = matchedIds
            } else {
              target.blockIds = matchedIds
            }
          }
        }
      }
    }
  }

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}

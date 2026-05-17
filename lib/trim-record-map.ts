/**
 * Strip Notion metadata fields the renderer doesn't read.
 *
 * react-notion-x renders blocks from `recordMap.block[<id>].value` using a
 * small subset of fields (`id`, `type`, `properties`, `content`, `format`,
 * `parent_id`, `parent_table`, `created_time`, `last_edited_time`). Notion's
 * raw API response ships ~150 bytes per block of internal metadata
 * (`space_id`, `version`, `alive`, `created_by_id`, etc.) that bloats the
 * inlined `__NEXT_DATA__` JSON.
 *
 * For the `/resources` page that's 253 cards × multiple blocks each =
 * hundreds of KB of redundant metadata, which pushed the SSR response past
 * Cloudflare Workers' 6 MB body cap. Same trim applied to every Notion page
 * reduces the inlined payload everywhere.
 *
 * We mutate in place to avoid copying the (large) tree. Callers pass the
 * recordMap before serialization in `getStaticProps`, after Notion has
 * returned it.
 */

import type { ExtendedRecordMap } from 'notion-types'

const BLOCK_FIELDS_TO_DROP = [
  'space_id',
  'version',
  'alive',
  'created_by_id',
  'created_by_table',
  'last_edited_by_id',
  'last_edited_by_table',
  'permissions',
  'created_by'
]

export function trimRecordMap(recordMap: ExtendedRecordMap): void {
  // 1. Trim every block's metadata
  const blocks = recordMap.block as Record<string, { value?: unknown }>
  if (blocks) {
    for (const wrapper of Object.values(blocks)) {
      const value = wrapper?.value as Record<string, unknown> | undefined
      if (!value) continue
      for (const field of BLOCK_FIELDS_TO_DROP) {
        if (field in value) delete value[field]
      }
    }
  }

  // 2. Drop tables the renderer doesn't read — PII + bloat.
  //    `notion_user` carries names/emails of workspace members; we don't
  //    show them. `space` carries workspace settings; renderer ignores it.
  //    `signed_urls` is the big one: pre-signed S3 URLs for images that
  //    react-notion-x re-derives from block.format.display_source anyway.
  const rm = recordMap as unknown as Record<string, unknown>
  delete rm.notion_user
  delete rm.space
  delete rm.signed_urls
}

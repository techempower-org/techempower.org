/**
 * Strip Notion metadata fields the renderer doesn't read.
 *
 * react-notion-x renders blocks from the *resolved* block value (`id`, `type`,
 * `properties`, `content`, `format`, `parent_id`, `parent_table`,
 * `created_time`, `last_edited_time`, plus `collection_id` / `view_ids` on
 * collection_view blocks). Notion's API ships a large amount of internal
 * bookkeeping alongside that — most notably `crdt_data`, the conflict-free
 * replicated data type payload used for live collaboration, which on the
 * `/resources` page is ~3.8 MB (≈67% of the whole record map) and is never
 * read by any consumer.
 *
 * ## Block wrapper shape (important)
 *
 * The newer Notion API nests each block as:
 *
 *   recordMap.block[id] = { spaceId, value: { value: <block>, role } }
 *
 * i.e. the *real* block lives at `wrapper.value.value`, not `wrapper.value`.
 * react-notion-x, notion-client, and notion-utils all reach it via
 * `getBlockValue()`, which recurses through `.value` until it finds the object
 * that actually has an `id`. We use the same accessor here so we mutate exactly
 * the object the renderer reads — regardless of nesting depth (older payloads
 * use the flat `{ role, value }` shape; `getBlockValue` handles both).
 *
 * (A previous version of this trim deleted fields straight off `wrapper.value`.
 * On the nested shape that's the `{ value, role }` envelope, so the metadata —
 * which lives one level deeper — was never actually removed. The block trim was
 * a no-op; see git history.)
 *
 * ## What we drop vs. keep
 *
 * Every field below was verified against react-notion-x 7.10, notion-client,
 * notion-utils, and this repo's own readers (`lib/notion.ts`,
 * `lib/resolve-notion-page.ts`, `pages/[...pageId].tsx`,
 * `components/ResourcesToolbar.tsx`) to have zero reads in the render path.
 *
 * Fields deliberately KEPT because the render path *does* read them:
 *   - `space_id`        → `defaultMapImageUrl` signs cover/icon image URLs with
 *                         a `?spaceId=` query param; `/resources` shows gallery
 *                         covers, so dropping this would break card images.
 *   - `created_by_id` / `last_edited_by_id` / `alive` → react-notion-x builds an
 *                         official-API-style page object (`archived: !alive`,
 *                         `created_by: { id: created_by_id }`).
 *   - `parent_id` / `parent_table` → our client-side collection filter re-run in
 *                         `lib/notion.ts` matches blocks to the collection.
 *
 * We mutate in place to avoid copying the (large) tree. Callers pass the
 * recordMap before serialization in `getStaticProps`, after Notion has returned
 * it.
 */

import type { ExtendedRecordMap } from 'notion-types'
import { getBlockValue } from 'notion-utils'

// Fields on the resolved block value that no consumer in the render path reads.
const BLOCK_FIELDS_TO_DROP = [
  // CRDT collaboration payload — by far the largest field (~3.8 MB on
  // /resources). Only used by Notion's live editor for conflict resolution.
  'crdt_data',
  'crdt_format_version',
  // Sync / bookkeeping metadata.
  'version',
  'permissions',
  'created_by_table',
  'last_edited_by_table',
  'created_by', // legacy combined field; not present on current blocks but harmless
  'file_ids',
  'ignore_block_count',
  'copied_from',
  'content_classification'
]

export function trimRecordMap(recordMap: ExtendedRecordMap): void {
  // 1. Trim every block's resolved value of metadata the renderer ignores.
  const blocks = recordMap.block as Record<string, unknown>
  if (blocks) {
    for (const wrapper of Object.values(blocks)) {
      const block = getBlockValue(wrapper as any) as
        | Record<string, unknown>
        | undefined
      if (block) {
        for (const field of BLOCK_FIELDS_TO_DROP) {
          if (field in block) delete block[field]
        }
      }

      // `wrapper.spaceId` duplicates the (kept) inner `block.space_id` and is
      // never read once the record map is fetched — getBlockValue resolves the
      // block via `.value` and ignores it. Drop the duplicate.
      if (wrapper && typeof wrapper === 'object') {
        delete (wrapper as Record<string, unknown>).spaceId
      }
    }
  }

  // 2. Drop tables the renderer doesn't read — PII + bloat.
  //    `notion_user` carries names/emails of workspace members; we don't
  //    show them. `space` carries workspace settings; renderer ignores it.
  //    `signed_urls` is pre-signed S3 URLs for images that react-notion-x
  //    re-derives from block.format.display_source anyway.
  const rm = recordMap as unknown as Record<string, unknown>
  delete rm.notion_user
  delete rm.space
  delete rm.signed_urls
}

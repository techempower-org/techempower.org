#!/usr/bin/env node
/**
 * Build a slug→pageId lockfile using notion-utils' real getCanonicalPageId.
 * Reads __NEXT_DATA__ from a saved /resources HTML and emits a JSON map.
 *
 * Usage:
 *   node scripts/build-slug-lockfile.mjs <path-to-resources.html> <out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { getCanonicalPageId } from 'notion-utils'

const [htmlPath, outPath] = process.argv.slice(2)
if (!htmlPath || !outPath) {
  console.error(
    'usage: build-slug-lockfile.mjs <resources.html> <out.json>'
  )
  process.exit(2)
}

const html = readFileSync(htmlPath, 'utf8')
const match = html.match(
  /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/s
)
if (!match) {
  console.error('No __NEXT_DATA__ found')
  process.exit(1)
}
const data = JSON.parse(match[1])
const recordMap = data?.props?.pageProps?.recordMap
if (!recordMap?.block) {
  console.error('No recordMap.block found')
  process.exit(1)
}

const lockfile = {}
let count = 0
for (const [bid, wrap] of Object.entries(recordMap.block)) {
  const v = wrap?.value?.value
  if (!v || v.type !== 'page') continue
  // notion-utils helper. Pass uuid:false so we get the friendly slug.
  const slug = getCanonicalPageId(bid, recordMap, { uuid: false })
  if (!slug) continue
  lockfile['/' + slug] = bid.replace(/-/g, '')
  count++
}

writeFileSync(outPath, JSON.stringify(lockfile, null, 2))
console.log(`wrote ${count} entries → ${outPath}`)

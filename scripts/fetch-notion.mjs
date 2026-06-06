// Throwaway: pull a Notion page via the unofficial notion-client and print readable text.
import { NotionAPI } from 'notion-client'
import { getTextContent } from 'notion-utils'

const notion = new NotionAPI()
const pageId = process.argv[2] || '370a4ee6-9520-8077-93fe-e1cdda74d673'

const recordMap = await notion.getPage(pageId)
const blocks = recordMap.block

const textOf = (b) => {
  const t = b?.properties?.title
  return t ? getTextContent(t) : ''
}

console.log('=== BLOCK COUNT:', Object.keys(blocks).length, '===\n')

for (const [id, entry] of Object.entries(blocks)) {
  const b = entry.value
  if (!b) continue
  const type = b.type
  const text = textOf(b)
  if (type === 'collection_view' || type === 'collection_view_page') {
    console.log(`\n[${type}] collection_id=${b.collection_id} view_ids=${JSON.stringify(b.view_ids)}`)
    continue
  }
  if (!text && !['page'].includes(type)) continue
  const prefix = {
    header: '# ', sub_header: '## ', sub_sub_header: '### ',
    bulleted_list: '• ', numbered_list: '1. ', to_do: '[ ] ',
    quote: '> ', callout: '💡 ', toggle: '▸ ', page: '📄 '
  }[type] || ''
  console.log(prefix + text)
}

// Dump collection schema + rows if this is a database
console.log('\n=== COLLECTIONS ===')
for (const [cid, entry] of Object.entries(recordMap.collection || {})) {
  const c = entry.value
  if (!c) continue
  const title = c.name ? getTextContent(c.name) : '(untitled)'
  console.log(`\nCollection "${title}" (${cid})`)
  const schema = c.schema || {}
  console.log('  Columns:', Object.values(schema).map((s) => `${s.name}[${s.type}]`).join(', '))
}

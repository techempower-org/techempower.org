import { type GetStaticPaths, type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { isResourcesPage } from '@/lib/page-ids'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { trimRecordMap } from '@/lib/trim-record-map'
import { type PageProps, type Params } from '@/lib/types'

// Resources page is heavy — revalidate every 12 hours.
// Other pages revalidate every hour.
const RESOURCES_REVALIDATE = 43_200
const DEFAULT_REVALIDATE = 3600

// Hard cap on Notion resolution time. notion-client retries 429/5xx internally
// via `got`, which can blow the Worker CPU budget on a single slow upstream.
const NOTION_TIMEOUT_MS = 8000

// Cache 4xx/timeout failures for an hour instead of retrying every minute,
// to avoid hammering Notion on permanently broken pages.
const ERROR_REVALIDATE = 3600

// Vulnerability scanner targets observed in production logs (env files,
// VCS metadata, common CMS attack surfaces). Matched paths short-circuit
// to a 404 here, before Notion is touched and the renderer is invoked.
const SCANNER_PATTERN =
  /(?:^|\/)(?:\.env[a-z.-]*|\.git|\.aws|\.ssh|\.svn|\.hg|\.htaccess|\.htpasswd|\.DS_Store|wp-admin|wp-includes|wp-content|wp-login|phpmyadmin|administrator|cgi-bin|vendor|laravel|symfony)(?:\/|$)|\.(?:php|asp|aspx|jsp|cgi|sh|bak|sql|env)$/i

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const segments = context.params?.pageId as string[] | undefined
  const rawPageId = segments ? segments.join('/') : undefined

  if (rawPageId && SCANNER_PATTERN.test(`/${rawPageId}`)) {
    return { notFound: true, revalidate: ERROR_REVALIDATE }
  }

  try {
    const isResources = rawPageId === 'resources'
    const props = await Promise.race([
      resolveNotionPage(
        domain,
        rawPageId,
        isResources
          ? { collectionLoadLimit: 20, enableGalleryCovers: true }
          : undefined
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`notion timeout after ${NOTION_TIMEOUT_MS}ms`)),
          NOTION_TIMEOUT_MS
        )
      )
    ])

    const revalidate = isResourcesPage(props.pageId)
      ? RESOURCES_REVALIDATE
      : DEFAULT_REVALIDATE

    // Sanitize block properties to prevent react-notion-x SSR crashes
    // from malformed URLs in Notion data (e.g. URLs wrapped in quotes).
    if (props.recordMap?.block) {
      for (const blockData of Object.values(props.recordMap.block)) {
        const block = (blockData as any)?.value
        if (!block?.properties) continue
        for (const [key, val] of Object.entries(block.properties)) {
          if (Array.isArray(val) && Array.isArray(val[0])) {
            const str = val[0][0]
            if (typeof str === 'string') {
              // Strip wrapping single or double quotes (e.g. "'https://...'" stored in Notion)
              if (
                (str.startsWith("'") && str.endsWith("'")) ||
                (str.startsWith('"') && str.endsWith('"'))
              ) {
                block.properties[key] = [[str.slice(1, -1)]]
              }
            }
          }
        }
      }
    }

    // Strip Notion metadata fields the renderer doesn't read. On /resources
    // (253 cards × multiple blocks) this drops the SSR body by ~30-50%,
    // pulling us back under the Workers Free plan's 6 MB response cap.
    if (props.recordMap) {
      trimRecordMap(props.recordMap)
    }

    return { props, revalidate }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    return { notFound: true, revalidate: ERROR_REVALIDATE }
  }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}

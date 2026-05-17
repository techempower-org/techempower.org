import type { GetServerSideProps } from 'next'

import { host, pageUrlOverrides } from '@/lib/config'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return {
      props: {}
    }
  }

  const paths = Object.keys(pageUrlOverrides)

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')

  // HEAD: send headers only, no body.
  if (req.method === 'HEAD') {
    res.end()
    return { props: {} }
  }

  res.write(createSitemap(paths))
  res.end()

  return {
    props: {}
  }
}

const createSitemap = (paths: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}</loc>
  </url>
${paths.map((p) => `  <url>\n    <loc>${host}/${p}</loc>\n  </url>`).join('\n')}
</urlset>`

export default function noop() {
  return null
}

import Head from 'next/head'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

export function PageHead({
  site,
  title,
  description,
  pageId,
  image,
  url,
  isBlogPost
}: types.PageProps & {
  title?: string
  description?: string
  image?: string
  url?: string
  isBlogPost?: boolean
}) {
  const rssFeedUrl = `${config.host}/feed`

  const rawTitle = title ?? site?.name
  const isHomePage = pageId === site?.rootNotionPageId
  const formattedTitle =
    isHomePage || !rawTitle || rawTitle === site?.name
      ? `${site?.name ?? 'TechEMPOWER.org'}`
      : `${rawTitle} | ${site?.name ?? 'TechEMPOWER.org'}`

  description = description ?? site?.description

  // Pass the page title (not the "<title> | <site>" composite) so the dynamic
  // OG card shows the page title with the site name as the wordmark.
  const socialImageTitle =
    rawTitle && rawTitle !== site?.name ? rawTitle : undefined
  const socialImageUrl = getSocialImageUrl(pageId, socialImageTitle) || image
  const isDynamicSocialImage = socialImageUrl?.includes('/api/social-image')

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta name='robots' content='index,follow' />
      <meta property='og:type' content={isBlogPost ? 'article' : 'website'} />

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta property='twitter:domain' content={site.domain} />
        </>
      )}

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {description && (
        <>
          <meta name='description' content={description} />
          <meta property='og:description' content={description} />
          <meta name='twitter:description' content={description} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
          {isDynamicSocialImage && (
            <>
              <meta property='og:image:type' content='image/png' />
              <meta property='og:image:width' content='1200' />
              <meta property='og:image:height' content='630' />
              <meta
                property='og:image:alt'
                content={rawTitle ?? site?.name ?? 'TechEMPOWER.org'}
              />
            </>
          )}
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {url && (
        <>
          <link rel='canonical' href={url} />
          <meta property='og:url' content={url} />
          <meta property='twitter:url' content={url} />
        </>
      )}

      <link
        rel='alternate'
        type='application/rss+xml'
        href={rssFeedUrl}
        title={site?.name}
      />

      <meta property='og:title' content={formattedTitle} />
      <meta name='twitter:title' content={formattedTitle} />
      <title>{formattedTitle}</title>

      {/* Better SEO for the blog posts */}
      {isBlogPost && (
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            '@id': `${url}#BlogPosting`,
            mainEntityOfPage: url,
            url,
            headline: rawTitle,
            name: rawTitle,
            description,
            author: {
              '@type': 'Person',
              name: config.author
            },
            image: socialImageUrl
          })}
        </script>
      )}
    </Head>
  )
}

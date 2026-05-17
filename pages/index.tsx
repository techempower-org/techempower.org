import Head from 'next/head'

import { AboutDonate } from '@/components/homepage/AboutDonate'
import { GuideGrid } from '@/components/homepage/GuideGrid'
import { Hero } from '@/components/homepage/Hero'
import { NewsletterSignup } from '@/components/homepage/NewsletterSignup'
import { ResourcesPreview } from '@/components/homepage/ResourcesPreview'
import { SupportChannels } from '@/components/homepage/SupportChannels'
import * as config from '@/lib/config'

export default function HomePage() {
  const title = `${config.name} — Technology for All: Access Made Easy`
  const description = config.description

  return (
    <>
      <Head>
        <meta charSet='utf-8' />
        <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
        />

        <meta name='robots' content='index,follow' />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content={config.name} />
        <meta property='twitter:domain' content={config.domain} />

        {description && (
          <>
            <meta name='description' content={description} />
            <meta property='og:description' content={description} />
            <meta name='twitter:description' content={description} />
          </>
        )}

        <meta name='twitter:card' content='summary' />
        <meta property='og:title' content={title} />
        <meta name='twitter:title' content={title} />
        <title>{title}</title>
      </Head>

      <main id='main-content'>
        <Hero />
        <GuideGrid />
        <ResourcesPreview />
        <SupportChannels />
        <AboutDonate />
        <NewsletterSignup />
      </main>
    </>
  )
}

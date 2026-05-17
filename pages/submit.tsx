import Head from 'next/head'

import { SubmitResourceForm } from '@/components/SubmitResourceForm'
import * as config from '@/lib/config'

export default function SubmitPage() {
  const title = `Submit a resource — ${config.name}`
  const description =
    'Know a free program or service that helps low-income individuals or families? Suggest it for our resources directory.'

  return (
    <>
      <Head>
        <meta charSet='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
        />
        {/* This is an intake form, not editorial content — no need for
            search engines to index a submission page. */}
        <meta name='robots' content='noindex, nofollow' />
        <meta name='description' content={description} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:site_name' content={config.name} />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        <title>{title}</title>
      </Head>

      <SubmitResourceForm />
    </>
  )
}

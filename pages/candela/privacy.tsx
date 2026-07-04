import Head from 'next/head'
import html from '../../lib/data/privacy-candela'

export default function CandelaPrivacy() {
  return (
    <>
      <Head>
        <title>Candela · Privacy Policy · TechEmpower</title>
        <meta
          name='description'
          content={
            "Candela's privacy policy: no analytics, no ads, no tracking \u2014 nothing leaves your device without your explicit action."
          }
        />
        <link rel='canonical' href='https://techempower.org/candela/privacy' />
      </Head>
      <main
        style={{
          maxWidth: '46rem',
          margin: '0 auto',
          padding: '3rem 1.25rem 5rem',
          lineHeight: 1.65,
          color: 'var(--te-bark-800, #2a2018)'
        }}
      >
        <p style={{ marginBottom: '2rem' }}>
          <a
            href='https://techempower.org'
            style={{ color: 'var(--te-teal-600, #0f766e)' }}
          >
            ← TechEmpower
          </a>
        </p>
        <article
          className='privacy-policy'
          // Trusted build-time content: generated from the app repo's privacy.md
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  )
}

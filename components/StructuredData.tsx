import Head from 'next/head'

import * as config from '@/lib/config'

export function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NonprofitOrganization',
    '@id': `${config.host}/#organization`,
    name: config.name,
    legalName: 'Techempower',
    alternateName: 'Techempower.org',
    url: config.host,
    logo: `${config.host}/favicon.png`,
    description: config.description,
    slogan: 'Technology for All: Access Made Easy',
    foundingDate: '2023-01',
    founder: {
      '@type': 'Person',
      name: 'Jeffrey Hein'
    },
    nonprofitStatus: 'Nonprofit501c3',
    taxID: '92-2581940',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Grass Valley',
      addressRegion: 'CA',
      addressCountry: 'US'
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Nevada County, California'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'California'
      },
      {
        '@type': 'Country',
        name: 'United States'
      }
    ],
    knowsAbout: [
      'Digital equity',
      'Digital inclusion',
      'Accessibility',
      'Low-income technology assistance',
      'Free internet programs',
      'CalFresh and EBT',
      'Electric vehicle incentives',
      'Lifeline phone service',
      'Nonprofit technology resources'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general inquiries',
      url: `${config.host}/about`,
      availableLanguage: ['English', 'Spanish']
    },
    sameAs: [
      config.twitter ? `https://twitter.com/${config.twitter}` : null,
      config.github ? `https://github.com/${config.github}` : null,
      config.linkedin
        ? `https://www.linkedin.com/company/${config.linkedin}`
        : null,
      config.youtube ? `https://www.youtube.com/@${config.youtube}` : null
    ].filter(Boolean)
  }

  return (
    <Head>
      <script type='application/ld+json'>{JSON.stringify(jsonLd)}</script>
    </Head>
  )
}

import Link from 'next/link'

import styles from './GuideGrid.module.css'

const guides = [
  {
    slug: 'how-to-use-techempower',
    emoji: '\u2600\uFE0F',
    title: 'How to use TechEmpower.org',
    summary: 'A step-by-step walkthrough'
  },
  {
    slug: 'free-internet',
    emoji: '\uD83C\uDF10',
    title: 'Free Internet Options',
    summary: 'Get free or low-cost internet'
  },
  {
    slug: 'ev-incentives',
    emoji: '\uD83D\uDE97',
    title: 'EV & Plug-in Hybrid Incentives',
    summary: 'Save thousands on an EV'
  },
  {
    slug: 'ebt-balance',
    emoji: '\uD83D\uDCB3',
    title: 'Check Your EBT Balance',
    summary: 'Manage benefits with Propel app'
  },
  {
    slug: 'ebt-spending',
    emoji: '\uD83E\uDD55',
    title: 'Best Places to Spend EBT',
    summary: 'Farms, stores, delivery with EBT'
  },
  {
    slug: 'findhelp',
    emoji: '\uD83D\uDD0D',
    title: 'findhelp.org',
    summary: 'Connect to social services near you'
  },
  {
    slug: 'password-manager',
    emoji: '\u2764\uFE0F',
    title: 'Password Manager Guide',
    summary: 'Secure your accounts easily'
  },
  {
    slug: 'free-cell-service',
    emoji: '\uD83D\uDCF1',
    title: 'Free Cell Service & Smartphone',
    summary: 'Get a free phone via Lifeline'
  }
] as const

export function GuideGrid() {
  return (
    <section
      id='guides'
      className={styles.section}
      aria-labelledby='guides-heading'
    >
      <div className={styles.inner}>
        <h2 id='guides-heading' className={styles.heading}>
          Step-by-step guides
        </h2>
        <p className={styles.subtitle}>
          Pick a topic to get started. Each guide is free, plain-language, and
          walks you through what to do.
        </p>

        <ul className={styles.grid}>
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className={styles.card}
                aria-label={`${guide.title} — ${guide.summary}`}
              >
                <span className={styles.cardEmoji} aria-hidden='true'>
                  {guide.emoji}
                </span>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{guide.title}</h3>
                  <p className={styles.cardSummary}>{guide.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

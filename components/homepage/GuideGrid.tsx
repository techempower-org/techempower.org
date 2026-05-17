import Link from 'next/link'

import styles from './GuideGrid.module.css'

const guides = [
  {
    slug: 'how-to-use-techempower',
    emoji: '\u2600\uFE0F',
    title: 'Start here',
    summary: 'A short tour of the site so you can find what you need'
  },
  {
    slug: 'free-internet',
    emoji: '\uD83C\uDF10',
    title: 'Free & low-cost internet',
    summary: 'Home internet for $0\u201315 a month if you qualify'
  },
  {
    slug: 'free-cell-service',
    emoji: '\uD83D\uDCF1',
    title: 'Free smartphone & cell service',
    summary: 'A free phone and free monthly service through Lifeline'
  },
  {
    slug: 'ebt-balance',
    emoji: '\uD83D\uDCB3',
    title: 'Check your EBT balance',
    summary: 'See your balance and recent purchases with the free Propel app'
  },
  {
    slug: 'ebt-spending',
    emoji: '\uD83E\uDD55',
    title: 'Best places to spend EBT',
    summary:
      'Local farms, grocery stores, and delivery services that accept CalFresh'
  },
  {
    slug: 'ev-incentives',
    emoji: '\uD83D\uDE97',
    title: 'EV & hybrid car rebates',
    summary: 'Stack up to $14,000 in rebates on a new or used electric car'
  },
  {
    slug: 'password-manager',
    emoji: '\u2764\uFE0F',
    title: 'A safer way to handle passwords',
    summary: 'Remember one password instead of thirty \u2014 free and easy'
  },
  {
    slug: 'findhelp',
    emoji: '\uD83D\uDD0D',
    title: 'findhelp.org',
    summary:
      'A national tool to find food, housing, and other services by ZIP code'
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
          Pick a topic. Each guide is written in plain English, walks you
          through what to do, and tells you exactly who to call if you get
          stuck.
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

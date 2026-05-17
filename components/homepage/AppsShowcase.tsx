import Link from 'next/link'

import styles from './AppsShowcase.module.css'

export function AppsShowcase() {
  return (
    <section className={styles.section} aria-labelledby='apps-heading'>
      <div className={styles.inner}>
        <h2 id='apps-heading' className={styles.heading}>
          Free apps we make
        </h2>
        <p className={styles.subtitle}>
          Open-source, no ads, no tracking — built to be useful right out of the
          box.
        </p>

        <div className={styles.cards}>
          {/* Storyvox card */}
          <Link href='/storyvox' className={styles.card}>
            <span className={styles.cardIcon} aria-hidden='true'>
              🔊
            </span>
            <h3 className={styles.cardTitle}>Storyvox</h3>
            <p className={styles.cardText}>
              An Android audiobook app that reads every TechEmpower guide aloud
              with offline neural text-to-speech. Built for visual access,
              limited literacy, or listening while driving.
            </p>
            <span className={styles.cardCta}>
              Learn more
              <span className={styles.arrow} aria-hidden='true'>
                {' '}
                →
              </span>
            </span>
          </Link>

          {/* ForageForAll card */}
          <a
            href='https://techempower-org.github.io/forageforall/'
            className={styles.card}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Open Forage for All (opens in a new tab)'
          >
            <span className={styles.cardIcon} aria-hidden='true'>
              🌿
            </span>
            <h3 className={styles.cardTitle}>Forage for All</h3>
            <p className={styles.cardText}>
              A community-run map of fruit trees and edible plants on public
              land. Drop a pin, share what&rsquo;s ripe, eat from your own
              neighborhood. Web, iOS, and Android.
            </p>
            <span className={styles.cardCta}>
              Open the map
              <span className={styles.arrow} aria-hidden='true'>
                {' '}
                &#8599;
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

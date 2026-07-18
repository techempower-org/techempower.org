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
          Open-source, no ads, no tracking. Built right here in Nevada County to
          fill gaps we kept seeing.
        </p>

        <div className={styles.cards}>
          {/* Candela card (formerly Storyvox) */}
          <Link href='/candela' className={styles.card}>
            <img
              src='/candela-mark.svg'
              alt=''
              className={styles.cardIconImg}
              aria-hidden='true'
              width={28}
              height={28}
            />
            <h3 className={styles.cardTitle}>Candela</h3>
            <p className={styles.cardText}>
              An Android app that reads every TechEMPOWER.org guide out loud,
              even with no internet. Built for low vision, limited literacy, or
              listening while you drive.
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
              A community map of fruit trees, berries, and edible plants on
              public land. Drop a pin, share what&rsquo;s ripe, eat free from
              your own neighborhood. Web, iOS, and Android.
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

import Link from 'next/link'

import { trackEvent } from '@/components/GoogleAnalytics'

import styles from './AboutDonate.module.css'

export function AboutDonate() {
  return (
    <section className={styles.section} aria-labelledby='about-heading'>
      <div className={styles.inner}>
        <h2 id='about-heading' className={styles.heading}>
          About TechEmpower
        </h2>

        <p className={styles.text}>
          TechEmpower is a nonprofit that helps people with low income use
          technology to improve their lives. We create free, easy-to-read guides
          so everyone can access the programs and tools they deserve. Your
          support keeps these resources free for the people who need them most.
        </p>

        <div className={styles.actions}>
          <Link href='/about' className={styles.btnLearn}>
            Learn More
          </Link>
          <Link
            href='/donate'
            className={styles.btnDonate}
            onClick={() =>
              trackEvent('donate_intent', {
                location: 'homepage_about_section'
              })
            }
          >
            Donate
          </Link>
        </div>
      </div>
    </section>
  )
}

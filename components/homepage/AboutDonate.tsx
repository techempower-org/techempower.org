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
          TechEmpower is a 501(c)(3) nonprofit based in Grass Valley,
          California. We write free, plain-language guides that explain how to
          use programs like Lifeline, CalFresh, and EV rebates &mdash; help
          that&rsquo;s already out there, just hard to find. We don&rsquo;t take
          a cent from the programs we list. Your tax-deductible donation keeps
          every guide free for everyone.
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

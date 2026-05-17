import Link from 'next/link'

import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby='hero-heading'>
      <div className={styles.inner}>
        <div className={styles.badge}>
          Free for everyone &middot; No sign-up needed
        </div>

        <h1 id='hero-heading' className={styles.heading}>
          Free help with{' '}
          <span className={styles.accent}>internet, phones,</span> food, and
          more
        </h1>

        <p className={styles.subtext}>
          We explain real programs in plain words &mdash; like $9.25/month off
          your phone bill, free smartphones through Lifeline, and EBT food
          benefits. No sign-up. No catch.
        </p>

        <Link href='#guides' className={styles.cta}>
          See the guides
          <span className={styles.ctaArrow} aria-hidden='true'>
            &darr;
          </span>
        </Link>
      </div>
    </section>
  )
}

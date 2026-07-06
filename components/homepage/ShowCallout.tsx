import Link from 'next/link'

import styles from './ShowCallout.module.css'

export function ShowCallout() {
  return (
    <section className={styles.section} aria-labelledby='show-callout-heading'>
      <div className={styles.inner}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>New &mdash; Episode 1 is live</p>
          <h2 id='show-callout-heading' className={styles.heading}>
            Wait, I Qualify?! &mdash; the show
          </h2>
          <p className={styles.subtitle}>
            A short video series about the help you probably already qualify for
            &mdash; and how to actually get it. Episode 1 busts the four myths
            that stop people from applying.
          </p>
          <Link href='/show' className={styles.cta}>
            Watch the show
            <span aria-hidden='true'> &rarr;</span>
          </Link>
          <p className={styles.meta}>
            Free on YouTube &middot; made with Nevada County Media
          </p>
        </div>
      </div>
    </section>
  )
}

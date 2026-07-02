import Link from 'next/link'

import styles from './QualifyCallout.module.css'

export function QualifyCallout() {
  return (
    <section
      className={styles.section}
      aria-labelledby='qualify-callout-heading'
    >
      <div className={styles.inner}>
        <div className={styles.card}>
          <h2 id='qualify-callout-heading' className={styles.heading}>
            Wait, do I qualify?
          </h2>
          <p className={styles.subtitle}>
            Most people qualify for more than they think. Take the anonymous
            2-minute check.
          </p>
          <Link href='/qualify' className={styles.cta}>
            Take the 2-minute check
            <span aria-hidden='true'> →</span>
          </Link>
          <p className={styles.privacy}>
            <span aria-hidden='true'>🔒</span> Runs entirely on your device
            &mdash; your answers never leave it.
          </p>
        </div>
      </div>
    </section>
  )
}

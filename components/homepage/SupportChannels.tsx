import styles from './SupportChannels.module.css'

export function SupportChannels() {
  return (
    <section className={styles.section} aria-labelledby='support-heading'>
      <div className={styles.inner}>
        <h2 id='support-heading' className={styles.heading}>
          Stuck? Talk to a real person.
        </h2>
        <p className={styles.subtitle}>
          Two free ways to get help — chat with our community online, or call
          2-1-1 from any phone.
        </p>

        <div className={styles.cards}>
          {/* Discord card */}
          <div className={styles.card}>
            <span className={styles.cardIcon} aria-hidden='true'>
              💬
            </span>
            <h3 className={styles.cardTitle}>Join Our Discord</h3>
            <p className={styles.cardText}>
              Ask questions, share tips, and connect with others in our friendly
              community chat.
            </p>
            <a
              href='https://discord.gg/7wDhAG3vYS'
              className={styles.cardLink}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Open Discord (opens in a new tab)'
            >
              Open Discord
              <span className={styles.externalIcon} aria-hidden='true'>
                {' '}
                &#8599;
              </span>
            </a>
          </div>

          {/* 211 card */}
          <div className={styles.card}>
            <span className={styles.cardIcon} aria-hidden='true'>
              📞
            </span>
            <h3 className={styles.cardTitle}>Call 2-1-1</h3>
            <p className={styles.cardText}>
              Dial{' '}
              <a
                href='tel:211'
                className={styles.phoneHighlight}
                aria-label='Call 2 1 1'
              >
                2-1-1
              </a>{' '}
              from any phone to reach a trained specialist who can connect you
              to local services &mdash; housing, food, utilities, and more.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

import * as React from 'react'

import { trackEvent } from '@/components/GoogleAnalytics'

import styles from './NewsletterSignup.module.css'

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function NewsletterSignup() {
  const [email, setEmail] = React.useState('')
  const [state, setState] = React.useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // No Formspree id wired yet → render an unobtrusive mailto fallback so the
  // section still works at launch. JP can sign up at formspree.io and set
  // NEXT_PUBLIC_FORMSPREE_ID to switch to a proper inline form.
  if (!FORMSPREE_ID) {
    return (
      <section className={styles.section} aria-labelledby='newsletter-heading'>
        <div className={styles.inner}>
          <h2 id='newsletter-heading' className={styles.heading}>
            Get new guides in your inbox
          </h2>
          <p className={styles.text}>
            We send a short note when we publish a new guide or update an
            existing one. No spam, no fundraising emails — just useful resources
            for low-income folks and the people who help them.
          </p>
          <div className={styles.actions}>
            <a
              href='mailto:hi@techempower.org?subject=Subscribe%20me%20to%20the%20TechEmpower%20newsletter&body=Yes%20please%20add%20me%20to%20your%20mailing%20list.'
              className={styles.btn}
              onClick={() =>
                trackEvent('newsletter_intent', {
                  method: 'mailto_fallback'
                })
              }
            >
              Email to subscribe
            </a>
          </div>
        </div>
      </section>
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return
    setState('submitting')
    setErrorMessage(null)
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(event.currentTarget)
      })
      if (response.ok) {
        setState('success')
        trackEvent('newsletter_signup', { method: 'formspree' })
        setEmail('')
      } else {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(
          (data as { error?: string })?.error ??
            'Something went wrong. Try again in a minute?'
        )
        setState('error')
      }
    } catch {
      setErrorMessage(
        'Couldn’t reach the signup service. Check your connection and retry.'
      )
      setState('error')
    }
  }

  return (
    <section className={styles.section} aria-labelledby='newsletter-heading'>
      <div className={styles.inner}>
        <h2 id='newsletter-heading' className={styles.heading}>
          Get new guides in your inbox
        </h2>
        <p className={styles.text}>
          A short email when we publish a new guide or update one. No spam, no
          fundraising — just useful resources, a few times a year.
        </p>

        {state === 'success' ? (
          <p className={styles.success} role='status' aria-live='polite'>
            ✓ You’re in. Check your inbox for a confirmation.
          </p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label htmlFor='newsletter-email' className={styles.label}>
              Email address
            </label>
            <input
              id='newsletter-email'
              name='email'
              type='email'
              required
              autoComplete='email'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'submitting'}
              className={styles.input}
            />
            <button
              type='submit'
              disabled={state === 'submitting' || !email}
              className={styles.btn}
            >
              {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
            </button>
            {state === 'error' && errorMessage && (
              <p className={styles.error} role='alert' aria-live='assertive'>
                {errorMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

import * as React from 'react'

import { trackEvent } from '@/components/GoogleAnalytics'

import styles from './NewsletterSignup.module.css'

// Self-hosted listmonk at list.techempower.org. Public list "TechEMPOWER News".
// Double opt-in: listmonk sends a confirmation email; only confirmed addresses
// receive newsletters. No PII passes through any third party.
const LISTMONK_ENDPOINT = 'https://list.techempower.org/api/public/subscription'
const LISTMONK_LIST_UUID = '38286840-6d95-4288-95e3-dac8ab804bcc'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function NewsletterSignup() {
  const [email, setEmail] = React.useState('')
  const [state, setState] = React.useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return
    setState('submitting')
    setErrorMessage(null)
    try {
      const response = await fetch(LISTMONK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          list_uuids: [LISTMONK_LIST_UUID]
        })
      })
      if (response.ok) {
        setState('success')
        trackEvent('newsletter_signup', { method: 'listmonk' })
        setEmail('')
      } else {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string
        }
        setErrorMessage(
          data?.message ?? 'Something went wrong. Try again in a minute?'
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
          New guides, sent to your inbox
        </h2>
        <p className={styles.text}>
          One short email a month &mdash; new episodes, program changes, and
          free resources. No spam, no fundraising pitches, and you can
          unsubscribe with one click.
        </p>

        {state === 'success' ? (
          <p className={styles.success} role='status' aria-live='polite'>
            ✓ Check your inbox to confirm — the link expires in 24 hours.
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

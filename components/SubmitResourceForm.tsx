import Link from 'next/link'
import Script from 'next/script'
import * as React from 'react'

import styles from './SubmitResourceForm.module.css'

const CATEGORIES = [
  'Internet & Phone',
  'Food Benefits',
  'Utilities',
  'Healthcare',
  'Housing',
  'Transportation',
  'Education',
  'Employment',
  'Childcare',
  'Legal',
  'Mental Health',
  'Other'
] as const

type Category = (typeof CATEGORIES)[number]

interface FormState {
  name: string
  url: string
  category: Category | ''
  description: string
  whoItHelps: string
  submitterName: string
  submitterEmail: string
}

type FieldErrors = Partial<Record<keyof FormState | 'turnstile', string>>

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

function clientValidate(state: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (state.name.trim().length < 5 || state.name.trim().length > 200) {
    errors.name = 'Please enter a name between 5 and 200 characters.'
  }
  const urlValue = state.url.trim()
  if (!urlValue) {
    errors.url = 'Please enter the resource website.'
  } else if (urlValue.length > 500) {
    errors.url = 'URL must be 500 characters or less.'
  } else {
    try {
      const u = new URL(urlValue)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        errors.url = 'URL must start with http:// or https://'
      }
    } catch {
      errors.url = 'Please enter a valid URL (e.g. https://example.org).'
    }
  }
  if (!state.category) {
    errors.category = 'Please choose a category.'
  }
  if (
    state.description.trim().length < 10 ||
    state.description.trim().length > 2000
  ) {
    errors.description = 'Description must be between 10 and 2000 characters.'
  }
  if (state.whoItHelps.trim().length > 1000) {
    errors.whoItHelps = 'Please keep this to 1000 characters or less.'
  }
  if (state.submitterName.trim().length > 100) {
    errors.submitterName = 'Please keep your name to 100 characters or less.'
  }
  const email = state.submitterEmail.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.submitterEmail = 'Please enter a valid email address.'
  }
  return errors
}

const INITIAL_STATE: FormState = {
  name: '',
  url: '',
  category: '',
  description: '',
  whoItHelps: '',
  submitterName: '',
  submitterEmail: ''
}

export function SubmitResourceForm() {
  const [state, setState] = React.useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string>('')
  const [succeeded, setSucceeded] = React.useState(false)

  const turnstileContainerRef = React.useRef<HTMLDivElement | null>(null)
  const turnstileWidgetId = React.useRef<string | null>(null)
  const [turnstileToken, setTurnstileToken] = React.useState<string>('')
  const [turnstileReady, setTurnstileReady] = React.useState(false)

  // Render the Turnstile widget once the script is loaded and the container
  // mounts. We re-render after a reset on failure.
  const renderTurnstile = React.useCallback(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !turnstileContainerRef.current ||
      !window.turnstile
    ) {
      return
    }
    if (turnstileWidgetId.current) {
      // already rendered
      return
    }
    turnstileWidgetId.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'auto',
        callback: (token: string) => {
          setTurnstileToken(token)
          setErrors((e) => ({ ...e, turnstile: undefined }))
        },
        'error-callback': () => {
          setTurnstileToken('')
        },
        'expired-callback': () => {
          setTurnstileToken('')
        }
      }
    )
  }, [])

  React.useEffect(() => {
    if (turnstileReady) renderTurnstile()
  }, [turnstileReady, renderTurnstile])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
    // Clear inline error for the field as the user edits.
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')

    const validationErrors = clientValidate(state)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Move focus to the first invalid field for a11y.
      const firstKey = Object.keys(validationErrors)[0] as keyof FormState
      const el = document.getElementById(`submit-field-${firstKey}`)
      el?.focus()
      return
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrors((e) => ({
        ...e,
        turnstile: 'Please complete the captcha to continue.'
      }))
      return
    }

    setSubmitting(true)
    try {
      const resp = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name.trim(),
          url: state.url.trim(),
          category: state.category,
          description: state.description.trim(),
          whoItHelps: state.whoItHelps.trim(),
          submitterName: state.submitterName.trim(),
          submitterEmail: state.submitterEmail.trim(),
          turnstileToken
        })
      })

      const body = (await resp.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
      }

      if (!resp.ok || !body.ok) {
        setFormError(
          body.error ||
            'Something went wrong sending your submission. Please try again in a moment.'
        )
        // Reset the captcha so the user can retry without a stale token.
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current)
          setTurnstileToken('')
        }
        return
      }

      setSucceeded(true)
    } catch (err) {
      console.error('[submit] network error', err)
      setFormError(
        'We could not reach our server. Please check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setState(INITIAL_STATE)
    setErrors({})
    setFormError('')
    setSucceeded(false)
    setTurnstileToken('')
    if (window.turnstile && turnstileWidgetId.current) {
      window.turnstile.reset(turnstileWidgetId.current)
    }
  }

  if (succeeded) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.success} role='status' aria-live='polite'>
          <h1 className={styles.successHeading}>Thank you</h1>
          <p className={styles.successBody}>
            We received your submission and will review it shortly. If we have
            questions, we may reach out using the email you provided.
          </p>
          <div className={styles.successActions}>
            <button
              type='button'
              className={styles.linkButton}
              onClick={resetForm}
            >
              Submit another resource
            </button>
            <Link href='/resources' className={styles.secondaryButton}>
              Back to resources
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {TURNSTILE_SITE_KEY && (
        <Script
          src='https://challenges.cloudflare.com/turnstile/v0/api.js'
          strategy='afterInteractive'
          onLoad={() => setTurnstileReady(true)}
        />
      )}

      <div className={styles.intro}>
        <h1 className={styles.heading}>Submit a free resource</h1>
        <p className={styles.subtitle}>
          Know a free program or service that helps low-income individuals or
          families? Tell us about it. Our team reviews every submission before
          it goes live on TechEMPOWER.org.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={onSubmit}
        noValidate
        aria-describedby='submit-form-error'
      >
        {formError && (
          <p id='submit-form-error' role='alert' className={styles.formError}>
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor='submit-field-name' className={styles.label}>
            Resource name
          </label>
          <input
            id='submit-field-name'
            name='name'
            type='text'
            className={styles.input}
            value={state.name}
            onChange={(e) => update('name', e.target.value)}
            required
            minLength={5}
            maxLength={200}
            aria-invalid={errors.name ? true : false}
            aria-describedby={errors.name ? 'submit-error-name' : undefined}
            placeholder='e.g. Affordable Connectivity Program'
            autoComplete='off'
          />
          {errors.name && (
            <p id='submit-error-name' className={styles.fieldError}>
              {errors.name}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-url' className={styles.label}>
            Resource website
          </label>
          <input
            id='submit-field-url'
            name='url'
            type='url'
            className={styles.input}
            value={state.url}
            onChange={(e) => update('url', e.target.value)}
            required
            maxLength={500}
            inputMode='url'
            aria-invalid={errors.url ? true : false}
            aria-describedby={errors.url ? 'submit-error-url' : undefined}
            placeholder='https://example.org'
            autoComplete='off'
          />
          {errors.url && (
            <p id='submit-error-url' className={styles.fieldError}>
              {errors.url}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-category' className={styles.label}>
            Category
          </label>
          <select
            id='submit-field-category'
            name='category'
            className={styles.select}
            value={state.category}
            onChange={(e) =>
              update('category', e.target.value as Category | '')
            }
            required
            aria-invalid={errors.category ? true : false}
            aria-describedby={
              errors.category ? 'submit-error-category' : undefined
            }
          >
            <option value=''>Choose a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id='submit-error-category' className={styles.fieldError}>
              {errors.category}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-description' className={styles.label}>
            What does it do?
          </label>
          <textarea
            id='submit-field-description'
            name='description'
            className={styles.textarea}
            value={state.description}
            onChange={(e) => update('description', e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            aria-invalid={errors.description ? true : false}
            aria-describedby={
              errors.description
                ? 'submit-error-description submit-help-description'
                : 'submit-help-description'
            }
            placeholder='Briefly describe the resource — what it offers, how to apply, anything important about eligibility.'
          />
          <p id='submit-help-description' className={styles.help}>
            10–2000 characters.
          </p>
          {errors.description && (
            <p id='submit-error-description' className={styles.fieldError}>
              {errors.description}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-whoItHelps' className={styles.label}>
            Who does it help?
            <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id='submit-field-whoItHelps'
            name='whoItHelps'
            className={styles.textarea}
            value={state.whoItHelps}
            onChange={(e) => update('whoItHelps', e.target.value)}
            maxLength={1000}
            rows={3}
            aria-invalid={errors.whoItHelps ? true : false}
            aria-describedby={
              errors.whoItHelps ? 'submit-error-whoItHelps' : undefined
            }
            placeholder='e.g. Low-income households, seniors on Medicare, families with school-aged children.'
          />
          {errors.whoItHelps && (
            <p id='submit-error-whoItHelps' className={styles.fieldError}>
              {errors.whoItHelps}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-submitterName' className={styles.label}>
            Your name
            <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id='submit-field-submitterName'
            name='submitterName'
            type='text'
            className={styles.input}
            value={state.submitterName}
            onChange={(e) => update('submitterName', e.target.value)}
            maxLength={100}
            aria-invalid={errors.submitterName ? true : false}
            aria-describedby={
              errors.submitterName ? 'submit-error-submitterName' : undefined
            }
            autoComplete='name'
          />
          {errors.submitterName && (
            <p id='submit-error-submitterName' className={styles.fieldError}>
              {errors.submitterName}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='submit-field-submitterEmail' className={styles.label}>
            Your email
            <span className={styles.optional}>
              (optional, for follow-up questions)
            </span>
          </label>
          <input
            id='submit-field-submitterEmail'
            name='submitterEmail'
            type='email'
            className={styles.input}
            value={state.submitterEmail}
            onChange={(e) => update('submitterEmail', e.target.value)}
            maxLength={200}
            inputMode='email'
            aria-invalid={errors.submitterEmail ? true : false}
            aria-describedby={
              errors.submitterEmail ? 'submit-error-submitterEmail' : undefined
            }
            placeholder='you@example.com'
            autoComplete='email'
          />
          {errors.submitterEmail && (
            <p id='submit-error-submitterEmail' className={styles.fieldError}>
              {errors.submitterEmail}
            </p>
          )}
        </div>

        {TURNSTILE_SITE_KEY && (
          <div className={styles.field}>
            <div
              ref={turnstileContainerRef}
              className={styles.turnstile}
              aria-describedby={
                errors.turnstile ? 'submit-error-turnstile' : undefined
              }
            />
            {errors.turnstile && (
              <p id='submit-error-turnstile' className={styles.fieldError}>
                {errors.turnstile}
              </p>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button type='submit' className={styles.submit} disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit resource'}
          </button>
        </div>
      </form>
    </div>
  )
}

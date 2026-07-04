import Head from 'next/head'
import * as React from 'react'

import type {
  Answers,
  EvaluationResult,
  Lang,
  Rule
} from '@/lib/screener/types'
import styles from '@/components/screener/screener.module.css'
import { ScreenerForm } from '@/components/screener/ScreenerForm'
import { ScreenerResults } from '@/components/screener/ScreenerResults'
import * as config from '@/lib/config'
import { evaluate } from '@/lib/screener/evaluate'
import rulesData from '@/lib/screener/rules.data.json'
import { t } from '@/lib/screener/strings'

const RULES = rulesData as Rule[]

// Trust footer: the OLDEST verifiedAt across the whole corpus — "every
// number on this page is at least this fresh" is the honest claim.
const VERIFIED_ISO =
  RULES.flatMap((rule) =>
    rule.provenance.map((p) => p.verifiedAt)
  ).toSorted()[0] ?? ''

// Localized long date (oracle N3). Fixed locale strings + a pinned UTC zone
// keep it deterministic across server and client (an ISO date parses as UTC
// midnight — without the pin, a PDT server renders the previous day).
function verifiedAsOfLabel(lang: Lang): string {
  return new Date(VERIFIED_ISO).toLocaleDateString(
    lang === 'es' ? 'es-US' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }
  )
}

// Site chrome (Header, Footer, chat) lives outside screener.module.css, and
// Next's CSS modules reject :global-only selectors — so its print hiding is
// this page-scoped <style>, rendered only once results exist. The module's
// `.hasResults` rules hide the form side; together, paper gets the results
// list full width, while printing before a screen still prints the page.
const PRINT_CHROME_CSS = `
@media print {
  header,
  nav,
  #main-content ~ * {
    display: none !important;
  }
}
`

export default function QualifyPage() {
  const [lang, setLang] = React.useState<Lang>('en')
  // Result + the answers that produced it, kept together so the
  // suggestions selector can re-derive signals on language toggle.
  // Client-state only — answers never leave the device (spec §privacy).
  const [screened, setScreened] = React.useState<{
    answers: Answers
    result: EvaluationResult
  } | null>(null)
  const result = screened?.result ?? null

  // Hydrate the saved language after mount: SSR markup and the first client
  // render both say 'en', so hydration matches; the swap happens post-paint.
  React.useEffect(() => {
    const saved = localStorage.getItem('te-lang')
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  // After a screen, bring the verdict into view.
  React.useEffect(() => {
    if (result) {
      document
        .querySelector('#screener-results')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  function toggleLang() {
    const next: Lang = lang === 'en' ? 'es' : 'en'
    setLang(next)
    localStorage.setItem('te-lang', next)
  }

  function handleScreen(answers: Answers) {
    setScreened({ answers, result: evaluate(answers, RULES) })
  }

  const title = 'Do I qualify? — 2-minute benefits check · TechEMPOWER.org'
  const description =
    'A free, private 2-minute check: see which programs — CalFresh, WIC, PG&E bill discounts, free phone service, and more — your household likely qualifies for. Your answers never leave your device.'

  return (
    <>
      <Head>
        <meta charSet='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
        />

        <meta name='robots' content='index,follow' />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content={config.name} />
        <meta property='twitter:domain' content={config.domain} />

        <meta name='description' content={description} />
        <meta property='og:description' content={description} />
        <meta name='twitter:description' content={description} />

        <meta name='twitter:card' content='summary' />
        <meta property='og:title' content={title} />
        <meta name='twitter:title' content={title} />
        <title>{title}</title>

        {result && <style>{PRINT_CHROME_CSS}</style>}
      </Head>

      <section
        className={
          result ? `${styles.screener} ${styles.hasResults}` : styles.screener
        }
        aria-labelledby='qualify-heading'
        lang={lang}
      >
        <div className={styles.inner}>
          <div className={styles.topRow}>
            <h1 id='qualify-heading' className={styles.title}>
              {t(lang, 'page.title')}
            </h1>
            <button
              className={styles.langToggle}
              type='button'
              onClick={toggleLang}
            >
              {t(lang, 'lang.toggle')}
            </button>
          </div>

          <p className={styles.promise}>{t(lang, 'page.promise')}</p>

          <ScreenerForm lang={lang} onSubmit={handleScreen} />

          {screened && (
            <ScreenerResults
              result={screened.result}
              rules={RULES}
              lang={lang}
              answers={screened.answers}
            />
          )}

          <p className={styles.verified}>
            {t(lang, 'page.verifiedAsOf', { date: verifiedAsOfLabel(lang) })}
          </p>
        </div>
      </section>
    </>
  )
}

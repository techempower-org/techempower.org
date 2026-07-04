import type {
  Answers,
  Bucket,
  EvaluationResult,
  Lang,
  Rule
} from '@/lib/screener/types'
import { t } from '@/lib/screener/strings'
import { suggest } from '@/lib/screener/suggest'

import { ProgramCard } from './ProgramCard'
import styles from './screener.module.css'

const BUCKET_ORDER: Bucket[] = ['strong', 'likely', 'worthAsking', 'notNow']

export function ScreenerResults({
  result,
  rules,
  lang,
  answers
}: {
  result: EvaluationResult
  rules: Rule[]
  lang: Lang
  answers: Answers
}) {
  const ruleById = new Map(rules.map((r) => [r.id, r]))
  const noStrongOrLikely =
    result.strong.length === 0 && result.likely.length === 0
  // Pure + client-side, like evaluate(): pointers to non-screenable
  // resources, matched to the situation already described. No network.
  const suggestions = suggest(answers, result, lang)

  return (
    <div className={styles.results} id='screener-results'>
      {noStrongOrLikely && (
        <p className={styles.empty}>{t(lang, 'results.empty')}</p>
      )}

      {BUCKET_ORDER.map((bucket) => {
        const verdicts = result[bucket]
        if (verdicts.length === 0) return null
        return (
          <section
            className={styles.bucketSection}
            key={bucket}
            aria-labelledby={`bucket-${bucket}`}
          >
            <h2 id={`bucket-${bucket}`} className={styles.bucketHeading}>
              {t(lang, `results.${bucket}`)}
            </h2>
            <div className={styles.cards}>
              {verdicts.map((verdict) => {
                const rule = ruleById.get(verdict.ruleId)
                // defensive: a verdict for an unknown rule renders nothing
                if (!rule) return null
                return (
                  <ProgramCard
                    key={verdict.ruleId}
                    rule={rule}
                    verdict={verdict}
                    lang={lang}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {suggestions.length > 0 && (
        <section
          className={styles.suggestSection}
          aria-labelledby='suggestions-heading'
        >
          <h2 id='suggestions-heading' className={styles.bucketHeading}>
            {t(lang, 'suggest.heading')}
          </h2>
          <p className={styles.suggestIntro}>{t(lang, 'suggest.intro')}</p>
          <div className={styles.suggestGrid}>
            {suggestions.map((s) => (
              <a
                key={s.id}
                className={styles.suggestCard}
                href={`/${s.slug}`}
                target='_blank'
                rel='noreferrer'
              >
                <span className={styles.suggestName}>
                  {s.name[lang]}
                  <svg
                    className={styles.suggestExt}
                    viewBox='0 0 12 12'
                    aria-hidden='true'
                    focusable='false'
                  >
                    <path
                      d='M3.5 1.5h7v7M10.5 1.5 1.5 10.5'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span className={styles.srOnly}>
                    {t(lang, 'suggest.newTab')}
                  </span>
                </span>
                <span className={styles.suggestBlurb}>{s.blurb[lang]}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.resultsFooter}>
        <p className={styles.standingThree}>{t(lang, 'footer.threeDoors')}</p>
        <button
          className={`${styles.printBtn} ${styles.noPrint}`}
          type='button'
          onClick={() => window.print()}
        >
          {t(lang, 'footer.print')}
        </button>
      </footer>
    </div>
  )
}

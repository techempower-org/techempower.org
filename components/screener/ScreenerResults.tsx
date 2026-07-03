import type { Bucket, EvaluationResult, Lang, Rule } from '@/lib/screener/types'
import { t } from '@/lib/screener/strings'

import { ProgramCard } from './ProgramCard'
import styles from './screener.module.css'

const BUCKET_ORDER: Bucket[] = ['strong', 'likely', 'worthAsking', 'notNow']

export function ScreenerResults({
  result,
  rules,
  lang
}: {
  result: EvaluationResult
  rules: Rule[]
  lang: Lang
}) {
  const ruleById = new Map(rules.map((r) => [r.id, r]))
  const noStrongOrLikely =
    result.strong.length === 0 && result.likely.length === 0

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

import type { Lang, Rule, Verdict } from '@/lib/screener/types'
import { t } from '@/lib/screener/strings'

import styles from './screener.module.css'

export function ProgramCard({
  rule,
  verdict,
  lang
}: {
  rule: Rule
  verdict: Verdict
  lang: Lang
}) {
  // Newest verification date on the card; ISO dates sort lexicographically.
  const newest =
    rule.provenance
      .map((p) => p.verifiedAt)
      .toSorted()
      .at(-1) ?? ''
  const phone = rule.apply.phone?.[lang]
  const local = rule.apply.local?.[lang]
  // "Call:" prefix only when the prose is an actual number (oracle N2) —
  // some rows carry agency instructions ("Project GO …", "FREED …") instead.
  const phoneIsNumber = phone !== undefined && /^[\d+(]/.test(phone)
  return (
    <article className={styles.card} data-bucket={verdict.bucket}>
      <h3 className={styles.cardTitle}>{rule.name[lang]}</h3>
      <p className={styles.cardValue}>{rule.value[lang]}</p>

      <details className={styles.why}>
        <summary>{t(lang, 'card.whyMatch')}</summary>
        <ul>
          {verdict.reasons.map((r) => (
            <li key={r.key}>{t(lang, r.key, r.params)}</li>
          ))}
        </ul>
      </details>

      {verdict.notes.length > 0 && (
        <ul className={styles.notes}>
          {verdict.notes.map((n) => (
            <li key={n}>{t(lang, `note.${n}`)}</li>
          ))}
        </ul>
      )}

      <div className={styles.applyRow}>
        {rule.apply.url && (
          <a
            className={styles.applyBtn}
            href={rule.apply.url}
            target='_blank'
            rel='noreferrer'
          >
            {t(lang, 'card.apply')}
          </a>
        )}
        {phone && (
          <span className={styles.phone}>
            {phoneIsNumber ? `${t(lang, 'card.call')}: ${phone}` : phone}
          </span>
        )}
        {local && <span className={styles.local}>{local}</span>}
      </div>

      <footer className={styles.provenance}>
        <a href={rule.provenance[0]?.source} target='_blank' rel='noreferrer'>
          {t(lang, 'card.source', { date: newest })}
        </a>
      </footer>
    </article>
  )
}

import { describe, expect, it } from 'vitest'

import type {
  Answers,
  EvaluationResult,
  Lang,
  Rule,
  Verdict
} from '@/lib/screener/types'
import lockfile from '@/lib/data/resource-slug-lockfile.json'
import en from '@/lib/screener/data/strings.en.json'
import es from '@/lib/screener/data/strings.es.json'
import rules from '@/lib/screener/rules.data.json'
import {
  deriveSignals,
  MAX_SUGGESTIONS,
  type Signal,
  SIGNAL_VOCABULARY,
  suggest,
  type Suggestion,
  SUGGESTIONS
} from '@/lib/screener/suggest'

const RULES = rules as Rule[]

function baseAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    householdSize: 1,
    incomeMonthlyGross: 2000,
    county: 'nevada',
    ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 0, age80plus: 0 },
    flags: [],
    enrolled: [],
    ...overrides
  }
}

function emptyResult(): EvaluationResult {
  return { strong: [], likely: [], worthAsking: [], notNow: [] }
}

function verdictFor(ruleId: string, reasons: Verdict['reasons'] = []): Verdict {
  return { ruleId, bucket: 'strong', reasons, notes: [] }
}

/** A rule id of each category we derive interest signals from — pulled from
 *  the live corpus so the goldens track the data, not hardcoded ids. */
function ruleIdOfCategory(category: Rule['category']): string {
  const rule = RULES.find((r) => r.category === category)
  expect(rule, `corpus has a ${category} rule`).toBeDefined()
  return rule!.id
}

describe('deriveSignals — goldens', () => {
  it('senior-only household: exactly {senior}', () => {
    const answers = baseAnswers({
      ages: { under5: 0, age5to17: 0, age18to59: 0, age60plus: 1, age80plus: 0 }
    })
    const signals = deriveSignals(answers, emptyResult(), 'en')
    expect([...signals].toSorted()).toEqual(['senior'])
  })

  it('student flag derives exactly {student}', () => {
    const signals = deriveSignals(
      baseAnswers({ flags: ['student'] }),
      emptyResult(),
      'en'
    )
    expect([...signals].toSorted()).toEqual(['student'])
  })

  it('homeless flag derives exactly {homeless}', () => {
    const signals = deriveSignals(
      baseAnswers({ flags: ['homeless'] }),
      emptyResult(),
      'en'
    )
    expect([...signals].toSorted()).toEqual(['homeless'])
  })

  it('kids + food program in results: {has-kids, food-interest}', () => {
    const answers = baseAnswers({
      ages: { under5: 1, age5to17: 1, age18to59: 1, age60plus: 0, age80plus: 0 }
    })
    const result = emptyResult()
    result.strong.push(verdictFor(ruleIdOfCategory('food')))
    const signals = deriveSignals(answers, result, 'en')
    expect([...signals].toSorted()).toEqual(['food-interest', 'has-kids'])
  })

  it('crisis fires on a notNow (waitlist) verdict', () => {
    const result = emptyResult()
    result.notNow.push(verdictFor('section8-hcv'))
    const signals = deriveSignals(baseAnswers(), result, 'en')
    expect(signals.has('crisis')).toBe(true)
  })

  it('crisis fires on an overLimitRescue reason hit', () => {
    // pull a real rescue key from the corpus so the golden tracks the data
    const rescueRule = RULES.find((r) => r.test.overLimitRescue)
    expect(rescueRule, 'corpus has an overLimitRescue rule').toBeDefined()
    const result = emptyResult()
    result.worthAsking.push(
      verdictFor(rescueRule!.id, [{ key: rescueRule!.test.overLimitRescue! }])
    )
    const signals = deriveSignals(baseAnswers(), result, 'en')
    expect(signals.has('crisis')).toBe(true)
  })

  it('no crisis from ordinary results', () => {
    const result = emptyResult()
    result.strong.push(verdictFor(ruleIdOfCategory('food')))
    const signals = deriveSignals(baseAnswers(), result, 'en')
    expect(signals.has('crisis')).toBe(false)
  })

  it('flags map 1:1 (disability, renter, pge-customer, pregnant, medicare)', () => {
    const answers = baseAnswers({
      flags: ['disability', 'renter', 'pge-customer', 'pregnant', 'medicare']
    })
    const signals = deriveSignals(answers, emptyResult(), 'en')
    expect([...signals].toSorted()).toEqual(
      [
        'disability',
        'medicare',
        'pge-customer',
        'pregnant',
        'renter'
      ].toSorted()
    )
  })

  it('spanish-ui fires from lang, and only from lang', () => {
    expect(
      deriveSignals(baseAnswers(), emptyResult(), 'es').has('spanish-ui')
    ).toBe(true)
    expect(
      deriveSignals(baseAnswers(), emptyResult(), 'en').has('spanish-ui')
    ).toBe(false)
  })

  it('utilities/transport/health interests fire from their categories', () => {
    const result = emptyResult()
    result.likely.push(verdictFor(ruleIdOfCategory('utilities')))
    result.worthAsking.push(verdictFor(ruleIdOfCategory('transport')))
    result.strong.push(verdictFor(ruleIdOfCategory('health')))
    const signals = deriveSignals(baseAnswers(), result, 'en')
    for (const s of [
      'utilities-interest',
      'transport-interest',
      'health-interest'
    ] as Signal[]) {
      expect(signals.has(s), s).toBe(true)
    }
  })
})

function syntheticRow(id: string, signals: Signal[]): Suggestion {
  return {
    id,
    slug: 'hospitality-house', // any valid slug; selection ignores it
    name: { en: id, es: id },
    blurb: { en: id, es: id },
    signals
  }
}

describe('suggest — selection', () => {
  it('zero fired signals → zero suggestions', () => {
    expect(suggest(baseAnswers(), emptyResult(), 'en')).toEqual([])
  })

  it('caps at MAX_SUGGESTIONS when everything fires', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      syntheticRow(`row-${i}`, ['senior'])
    )
    const answers = baseAnswers({
      ages: { under5: 0, age5to17: 0, age18to59: 0, age60plus: 1, age80plus: 0 }
    })
    const picked = suggest(answers, emptyResult(), 'en', rows)
    expect(picked.length).toBe(MAX_SUGGESTIONS)
  })

  it('orders by signal-match count desc, then data-file order', () => {
    const rows = [
      syntheticRow('one-match', ['senior']),
      syntheticRow('two-match', ['senior', 'has-kids']),
      syntheticRow('one-match-later', ['has-kids']),
      syntheticRow('no-match', ['medicare'])
    ]
    const answers = baseAnswers({
      ages: { under5: 1, age5to17: 0, age18to59: 1, age60plus: 1, age80plus: 0 }
    })
    const picked = suggest(answers, emptyResult(), 'en', rows)
    expect(picked.map((r) => r.id)).toEqual([
      'two-match',
      'one-match',
      'one-match-later'
    ])
  })

  it('is deterministic — same inputs, same output, twice', () => {
    const answers = baseAnswers({
      ages: {
        under5: 1,
        age5to17: 1,
        age18to59: 1,
        age60plus: 1,
        age80plus: 0
      },
      flags: ['disability', 'renter', 'pge-customer', 'pregnant', 'medicare']
    })
    const result = emptyResult()
    result.strong.push(verdictFor(ruleIdOfCategory('food')))
    result.notNow.push(verdictFor('section8-hcv'))
    const a = suggest(answers, result, 'es')
    const b = suggest(answers, result, 'es')
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
    expect(a.length).toBeLessThanOrEqual(MAX_SUGGESTIONS)
  })
})

describe('suggestions.data.json — seed corpus', () => {
  // Slug gotcha: the "My Child Care Plan" resource resolves ONLY at its
  // verbose canonical lockfile slug
  // (`...find-child-care-you-can-trust--my-child-care-plan`), not a short
  // `my-child-care-plan` alias — the alias isn't a lockfile key and would
  // 404. Historically the resources DB carried a near-duplicate row for it;
  // the current lockfile keeps the single long-slug survivor. Don't
  // "tidy" the data-file slug into something shorter — this test guards it.
  it('every slug exists in the resource slug lockfile', () => {
    const lockedSlugs = new Set(
      Object.keys(lockfile as Record<string, string>).map((s) =>
        s.replace(/^\//, '')
      )
    )
    for (const row of SUGGESTIONS) {
      expect(
        lockedSlugs.has(row.slug),
        `slug not in lockfile: ${row.slug}`
      ).toBe(true)
    }
  })

  it('ids are unique, signals are non-empty and in the vocabulary', () => {
    const ids = SUGGESTIONS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    const vocabulary = new Set<string>(SIGNAL_VOCABULARY)
    for (const row of SUGGESTIONS) {
      expect(row.signals.length, row.id).toBeGreaterThan(0)
      for (const s of row.signals) {
        expect(vocabulary.has(s), `${row.id}: unknown signal ${s}`).toBe(true)
      }
    }
  })

  it('EN/ES parity: every row has both languages, one line, no eligibility-verdict wording', () => {
    const langs: Lang[] = ['en', 'es']
    for (const row of SUGGESTIONS) {
      for (const lang of langs) {
        expect(row.name[lang], `${row.id} name.${lang}`).toBeTruthy()
        expect(row.blurb[lang], `${row.id} blurb.${lang}`).toBeTruthy()
        expect(
          row.blurb[lang],
          `${row.id} blurb.${lang} single line`
        ).not.toMatch(/\n/)
        expect(
          row.blurb[lang].length,
          `${row.id} blurb.${lang} stays one line`
        ).toBeLessThanOrEqual(160)
        // pointers, not promises — a blurb never claims the user qualifies
        expect(
          row.blurb[lang].toLowerCase(),
          `${row.id} blurb.${lang}`
        ).not.toMatch(/you qualify|usted califica/)
      }
    }
  })

  it('sensitive rows use neutral help-is-available phrasing, never benefits framing', () => {
    // DV, crisis line, and the reproductive-health clinic must never read as
    // an eligibility verdict ("you may qualify") — they are help that exists,
    // not benefits a household is scored into. Guard both languages.
    const SENSITIVE = new Set([
      'community-beyond-violence',
      'crisis-care',
      'the-clinic',
      'calvcb'
    ])
    const BENEFITS_FRAMING =
      /qualif|eligib|you (?:may|might|could)|benefit|apply|califi|elegib|puede (?:solicitar|calificar)|beneficio|solicit/i
    const present = SUGGESTIONS.filter((r) => SENSITIVE.has(r.id))
    expect(present.length, 'sensitive rows are present in the corpus').toBe(4)
    for (const row of present) {
      for (const lang of ['en', 'es'] as Lang[]) {
        expect(row.blurb[lang], `${row.id} blurb.${lang}`).not.toMatch(
          BENEFITS_FRAMING
        )
      }
    }
  })

  it('suggest.* UI strings exist in both string tables', () => {
    const enKeys = en as Record<string, string>
    const esKeys = es as Record<string, string>
    for (const key of ['suggest.heading', 'suggest.intro', 'suggest.newTab']) {
      expect(enKeys[key], `en ${key}`).toBeTruthy()
      expect(esKeys[key], `es ${key}`).toBeTruthy()
    }
  })

  it('the seed set stays within the starter budget and every row can actually fire', () => {
    expect(SUGGESTIONS.length).toBeGreaterThanOrEqual(10)
    // every row's signals are reachable: at least one is derivable today
    const derivable = new Set<string>(SIGNAL_VOCABULARY)
    for (const row of SUGGESTIONS) {
      expect(
        row.signals.some((s) => derivable.has(s)),
        `${row.id} has a reachable signal`
      ).toBe(true)
    }
  })
})

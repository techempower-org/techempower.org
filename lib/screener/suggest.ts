import type {
  Answers,
  Category,
  EvaluationResult,
  Lang,
  Rule,
  Verdict
} from './types'
import rulesData from './rules.data.json'
import suggestionsData from './suggestions.data.json'

/**
 * Signals a suggestion row can key on. Derived ONLY from the answers the
 * user already gave, the evaluation they already ran, and the UI language —
 * no new questions, nothing leaves the device (same privacy contract as
 * evaluate.ts).
 */
export type Signal =
  | 'has-kids'
  | 'senior'
  | 'disability'
  | 'renter'
  | 'homeowner'
  | 'pge-customer'
  | 'nid-water'
  | 'pregnant'
  | 'medicare'
  | 'student'
  | 'homeless'
  | 'food-interest'
  | 'utilities-interest'
  | 'transport-interest'
  | 'health-interest'
  | 'crisis'
  | 'spanish-ui'

export const SIGNAL_VOCABULARY: readonly Signal[] = [
  'has-kids',
  'senior',
  'disability',
  'renter',
  'homeowner',
  'pge-customer',
  'nid-water',
  'pregnant',
  'medicare',
  'student',
  'homeless',
  'food-interest',
  'utilities-interest',
  'transport-interest',
  'health-interest',
  'crisis',
  'spanish-ui'
]

/**
 * A pointer to a resource on techempower.org that is NOT a screenable
 * program — tools, orgs, and guides matched to the user's situation.
 * `slug` renders at `/<slug>` (the resource slug lockfile path shape;
 * see lib/resolve-notion-page.ts). Blurbs are one factual line each —
 * pointers, not promises: no eligibility claims, no verdicts.
 */
export interface Suggestion {
  id: string
  slug: string
  name: Record<Lang, string>
  blurb: Record<Lang, string>
  signals: Signal[]
}

export const SUGGESTIONS = suggestionsData as Suggestion[]

const RULES = rulesData as Rule[]

export const MAX_SUGGESTIONS = 6

const INTEREST_BY_CATEGORY: Partial<Record<Category, Signal>> = {
  food: 'food-interest',
  utilities: 'utilities-interest',
  transport: 'transport-interest',
  health: 'health-interest'
}

function allVerdicts(result: EvaluationResult): Verdict[] {
  return [
    ...result.strong,
    ...result.likely,
    ...result.worthAsking,
    ...result.notNow
  ]
}

/**
 * Pure signal derivation — answers + evaluation + language in, Set out.
 * Exported for golden tests.
 */
export function deriveSignals(
  answers: Answers,
  result: EvaluationResult,
  lang: Lang,
  rules: Rule[] = RULES
): Set<Signal> {
  const signals = new Set<Signal>()

  if (answers.ages.under5 + answers.ages.age5to17 > 0) signals.add('has-kids')
  if (answers.ages.age60plus > 0) signals.add('senior')
  if (answers.flags.includes('disability')) signals.add('disability')
  // Housing is exclusive in the form (renter XOR homeowner), so exactly one
  // of these fires — keyed rows target the tenure that can actually act on
  // the resource (e.g. whole-house electrification rebates need an owner).
  if (answers.flags.includes('renter')) signals.add('renter')
  if (answers.flags.includes('homeowner')) signals.add('homeowner')
  if (answers.flags.includes('pge-customer')) signals.add('pge-customer')
  if (answers.flags.includes('nid-water')) signals.add('nid-water')
  if (answers.flags.includes('pregnant')) signals.add('pregnant')
  if (answers.flags.includes('medicare')) signals.add('medicare')
  if (answers.flags.includes('student')) signals.add('student')
  if (answers.flags.includes('homeless')) signals.add('homeless')
  if (lang === 'es') signals.add('spanish-ui')

  // Category interests: a program of that category anywhere in the results
  // (any bucket — a waitlisted food program still evidences the need).
  const categoryById = new Map(rules.map((r) => [r.id, r.category]))
  const verdicts = allVerdicts(result)
  for (const v of verdicts) {
    const category = categoryById.get(v.ruleId)
    const interest = category && INTEREST_BY_CATEGORY[category]
    if (interest) signals.add(interest)
  }

  // Crisis: anything landed in notNow (waitlist-closed), or an
  // overLimitRescue reason fired (over a limit but surfaced as a question) —
  // both mark a household pressing against the edges of the system.
  const rescueKeys = new Set(
    rules
      .map((r) => r.test.overLimitRescue)
      .filter((k): k is string => k !== undefined)
  )
  const rescueHit = verdicts.some((v) =>
    v.reasons.some((reason) => rescueKeys.has(reason.key))
  )
  if (result.notNow.length > 0 || rescueHit) signals.add('crisis')

  return signals
}

/**
 * Select up to MAX_SUGGESTIONS rows whose signals intersect the derived
 * set. Deterministic: signal-match count descending, then data-file order.
 * Pure — zero DOM, unit-testable; rows/rules injectable for tests.
 */
export function suggest(
  answers: Answers,
  result: EvaluationResult,
  lang: Lang,
  rows: Suggestion[] = SUGGESTIONS,
  rules: Rule[] = RULES
): Suggestion[] {
  const signals = deriveSignals(answers, result, lang, rules)
  return rows
    .map((row, index) => ({
      row,
      index,
      score: row.signals.filter((s) => signals.has(s)).length
    }))
    .filter((entry) => entry.score > 0)
    .toSorted((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => entry.row)
}

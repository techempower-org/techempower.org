export type Lang = 'en' | 'es'

export type Jurisdiction = 'federal' | 'CA' | 'nevada-county'

export type Category =
  | 'food'
  | 'health'
  | 'utilities'
  | 'housing'
  | 'transport'
  | 'money'
  | 'legal'
  | 'devices'

export type ProgramStatus =
  | 'open'
  | 'waitlist-closed'
  | 'seasonal'
  | 'check-first'

export type Bucket = 'strong' | 'likely' | 'worthAsking' | 'notNow'

/** Enrollment flags a user can already have (categorical unlocks). */
export type Enrollment = 'medi-cal' | 'calfresh' | 'ssi' | 'calworks' | 'wic'

/** Situational flags from the form. */
export type SituationFlag =
  | 'renter'
  | 'homeowner'
  | 'pge-customer'
  | 'nid-water'
  | 'has-vehicle'
  | 'failed-smog'
  | 'pregnant'
  | 'medicare'

export interface AgeBandCounts {
  under5: number
  age5to17: number
  age18to59: number
  age60plus: number
  age80plus: number // subset of age60plus
}

export interface Answers {
  householdSize: number
  incomeMonthlyGross: number // annual÷12 done in the form layer
  county: 'nevada' | 'other-ca'
  ages: AgeBandCounts
  flags: SituationFlag[]
  enrolled: Enrollment[]
}

export interface IncomeTest {
  /** Verified per-household monthly gross limits. Keys "1".."8" + "increment". Preferred. */
  limitsMonthly?: Record<string, number>
  /** Fallback: percent of FPL (fpl-2026.json), scaled to household. */
  incomePctFPL?: number
  /** Treat households smaller than this as this size (CARE/FERA floor of 2). */
  householdFloor?: number
}

export interface RuleTest extends IncomeTest {
  /** At least one household member in any of these bands qualifies the age dimension. */
  ageAnyMin?: number // e.g. 60, 80; checked against ages bands
  ageAnyMax?: number // e.g. 4 (under 5), 17 (kids)
  flagsAll?: SituationFlag[]
  categoricalUnlocks?: Enrollment[]
  /** Inverse of an unlock: enrollment in any of these DISQUALIFIES (e.g. GA
   *  is only for people ineligible for CalWORKs/SSI). */
  categoricalExcludes?: Enrollment[]
  /** Alternative to the ageAny member dimension: any of these flags also
   *  satisfies it (e.g. WIC's pregnancy category alongside kids under 5).
   *  Income and other gates still apply. */
  memberFlagsAny?: SituationFlag[]
  /** Everyone passes (e.g. CA universal school meals w/ kids). Income ignored. */
  universal?: boolean
  /** When set, the income limit is a proxy/band that GATES visibility but
   *  must never RENDER: evaluate() emits this no-number reason key instead
   *  of reason.under-limit. Numbers used for gating are not claims; numbers
   *  rendered are. */
  proxyReasonKey?: string
  /** When set, income OVER the household limit does not omit the rule —
   *  it lands in worthAsking with this no-number reason key. For programs
   *  that test the applicant's OWN income, not the household's (MSP,
   *  ssi-ssp): the multigenerational case must not be silently hidden. */
  overLimitRescue?: string
  /** Keys into strings for nuance rows rendered as Worth-Asking footnotes. */
  specialNotes?: string[]
}

export interface Provenance {
  claim: string
  source: string
  verifiedAt: string // YYYY-MM-DD
  via: string
}

export interface Rule {
  id: string
  jurisdiction: Jurisdiction
  category: Category
  status: ProgramStatus
  test: RuleTest
  /** For reason strings, e.g. { "1": 2610, "4": 5360, "increment": 918 } (monthly $). */
  thresholdsDisplay?: Record<string, number>
  /** Params for note.* templates, keyed by specialNotes key. Dollar figures
   *  live HERE (not in the string tables) so they sit inside the rule's
   *  provenance + 120-day freshness regime. */
  noteParams?: Record<string, Record<string, string | number>>
  name: Record<Lang, string>
  value: Record<Lang, string>
  /** url is language-neutral; phone/local are user-facing prose (both langs). */
  apply: {
    url?: string
    phone?: Record<Lang, string>
    local?: Record<Lang, string>
  }
  provenance: Provenance[]
  boundaryMarginPct?: number // default 10
}

export interface Reason {
  key: string
  params?: Record<string, string | number>
}

export interface Verdict {
  ruleId: string
  bucket: Bucket
  reasons: Reason[]
  notes: string[] // specialNotes keys that apply
}

export interface EvaluationResult {
  strong: Verdict[]
  likely: Verdict[]
  worthAsking: Verdict[]
  notNow: Verdict[]
}

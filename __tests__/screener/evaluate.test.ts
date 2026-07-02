import { describe, expect, it } from 'vitest'

import type { Answers, Rule } from '@/lib/screener/types'
import { evaluate } from '@/lib/screener/evaluate'
import rules from '@/lib/screener/rules.data.json'

const R = rules as Rule[]

const base: Answers = {
  householdSize: 4,
  incomeMonthlyGross: 4800,
  county: 'nevada',
  ages: { under5: 1, age5to17: 1, age18to59: 2, age60plus: 0, age80plus: 0 },
  flags: ['renter', 'pge-customer'],
  enrolled: []
}

function bucketOf(result: ReturnType<typeof evaluate>, id: string) {
  for (const b of ['strong', 'likely', 'worthAsking', 'notNow'] as const) {
    if (result[b].some((v) => v.ruleId === id)) return b
  }
  return 'absent'
}

describe('evaluate — golden cases from the fact-check corpus', () => {
  it('HH4 @ $4,800 is STRONG for CalFresh (limit $5,360, >10% margin)', () => {
    expect(bucketOf(evaluate(base, R), 'calfresh')).toBe('strong')
  })
  it('HH4 @ $5,100 is LIKELY for CalFresh (within 10% boundary of $5,360)', () => {
    const r = evaluate({ ...base, incomeMonthlyGross: 5100 }, R)
    expect(bucketOf(r, 'calfresh')).toBe('likely')
  })
  it('HH4 @ $6,000 omits CalFresh but keeps FERA (limit $6,875)', () => {
    const r = evaluate({ ...base, incomeMonthlyGross: 6000 }, R)
    expect(bucketOf(r, 'calfresh')).toBe('absent')
    expect(bucketOf(r, 'fera')).toBe('strong')
  })
  it('SSI enrollment unlocks CalFresh categorically at any income', () => {
    const r = evaluate(
      { ...base, incomeMonthlyGross: 9000, enrolled: ['ssi'] },
      R
    )
    expect(bucketOf(r, 'calfresh')).toBe('strong')
  })
  it('WIC needs a child under 5 (or pregnancy note) — no kid, no WIC', () => {
    const noKid = { ...base, ages: { ...base.ages, under5: 0 } }
    expect(bucketOf(evaluate(noKid, R), 'wic')).toBe('absent')
    expect(bucketOf(evaluate(base, R), 'wic')).toBe('strong')
  })
  it('Medi-Cal enrollment makes WIC strong regardless of income', () => {
    const r = evaluate(
      { ...base, incomeMonthlyGross: 8000, enrolled: ['medi-cal'] },
      R
    )
    expect(bucketOf(r, 'wic')).toBe('strong')
  })
  it('NID requires the nid-water flag', () => {
    expect(bucketOf(evaluate(base, R), 'nid-lira')).toBe('absent')
    const withNid = evaluate(
      { ...base, flags: [...base.flags, 'nid-water'], enrolled: ['medi-cal'] },
      R
    )
    expect(bucketOf(withNid, 'nid-lira')).toBe('strong')
  })
  it('Golden Ticket only appears with an 80+ member', () => {
    expect(bucketOf(evaluate(base, R), 'bus-golden-ticket')).toBe('absent')
    const withElder = evaluate(
      { ...base, ages: { ...base.ages, age60plus: 1, age80plus: 1 } },
      R
    )
    expect(bucketOf(withElder, 'bus-golden-ticket')).toBe('strong')
  })
  it('check-first status caps the bucket at worthAsking (LIHEAP)', () => {
    const r = evaluate({ ...base, incomeMonthlyGross: 4000 }, R)
    expect(bucketOf(r, 'liheap')).toBe('worthAsking')
  })
  it('60+ senior CalFresh nuance surfaces as a note, not a denial', () => {
    const senior = evaluate(
      {
        ...base,
        incomeMonthlyGross: 6000,
        ages: {
          under5: 0,
          age5to17: 0,
          age18to59: 1,
          age60plus: 1,
          age80plus: 0
        }
      },
      R
    )
    // over gross limit BUT household has 60+ → worthAsking with senior-net-test note
    expect(bucketOf(senior, 'calfresh')).toBe('worthAsking')
    const v = senior.worthAsking.find((x) => x.ruleId === 'calfresh')
    expect(v?.notes).toContain('senior-net-test')
  })
  it('reasons carry threshold params for rendering', () => {
    const r = evaluate(base, R)
    const cf = r.strong.find((v) => v.ruleId === 'calfresh')
    expect(cf?.reasons[0]?.params?.limit).toBe(5360)
  })
  it('flags-only: PG&E customer sees Medical Baseline as worthAsking with its note', () => {
    const r = evaluate(base, R)
    expect(bucketOf(r, 'medical-baseline')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'medical-baseline')
    expect(v?.notes).toContain('medical-baseline-device')
  })
  it('flags-only: a vehicle surfaces retirement, not smog repair (needs failed-smog)', () => {
    const r = evaluate({ ...base, flags: [...base.flags, 'has-vehicle'] }, R)
    expect(bucketOf(r, 'bar-retirement')).toBe('worthAsking')
    expect(bucketOf(r, 'bar-cap-repair')).toBe('absent')
  })
})

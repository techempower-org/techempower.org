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
    // $4,800 sits inside the 10% boundary of WIC's $5,087 limit — the
    // conservative demotion is unconditional (oracle S2), so LIKELY.
    expect(bucketOf(evaluate(base, R), 'wic')).toBe('likely')
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
  it('E5: ESA uses the live 250% per-person table — no CARE band, no HH2 floor', () => {
    // HH4 @ $6,000 sat over the old CARE-aligned $5,500 cap; the live ESA
    // table allows up to $6,875 (250% FPG, same as FERA's upper bound).
    const hh4 = evaluate({ ...base, incomeMonthlyGross: 6000 }, R)
    expect(bucketOf(hh4, 'esa')).toBe('strong')
    // A 1-person household under the old floor-of-2 model passed up to
    // $3,606; the live table has a true 1-person row capping at $3,325.
    const single = evaluate(
      {
        ...base,
        householdSize: 1,
        incomeMonthlyGross: 3500,
        ages: {
          under5: 0,
          age5to17: 0,
          age18to59: 1,
          age60plus: 0,
          age80plus: 0
        }
      },
      R
    )
    expect(bucketOf(single, 'esa')).toBe('absent')
  })
  it('B1: HH2 @ $2,600 gets CA LifeLine — inside the real $2,775 limit, boundary → likely', () => {
    // The pre-fix row ($2,050 for HH2) wrongly screened this household out.
    const hh2 = evaluate(
      {
        ...base,
        householdSize: 2,
        incomeMonthlyGross: 2600,
        ages: {
          under5: 0,
          age5to17: 0,
          age18to59: 2,
          age60plus: 0,
          age80plus: 0
        }
      },
      R
    )
    expect(bucketOf(hh2, 'lifeline-ca')).toBe('likely')
  })
  it('B1: HH2 @ $2,400 is comfortably under the LifeLine limit — strong', () => {
    const hh2 = evaluate(
      {
        ...base,
        householdSize: 2,
        incomeMonthlyGross: 2400,
        ages: {
          under5: 0,
          age5to17: 0,
          age18to59: 2,
          age60plus: 0,
          age80plus: 0
        }
      },
      R
    )
    expect(bucketOf(hh2, 'lifeline-ca')).toBe('strong')
  })
  it('F3: disability flag reaches FREED without a 60+ member', () => {
    // under-60 household, no seniors — FREED was previously unreachable
    const disabled = evaluate(
      { ...base, flags: [...base.flags, 'disability'] },
      R
    )
    expect(bucketOf(disabled, 'freed-equipment')).not.toBe('absent')
    const verdict = [
      ...disabled.strong,
      ...disabled.likely,
      ...disabled.worthAsking,
      ...disabled.notNow
    ].find((v) => v.ruleId === 'freed-equipment')
    expect(verdict?.reasons.map((r) => r.key)).toContain('reason.member-flag')

    // and without the flag or a senior, it stays omitted
    const neither = evaluate(base, R)
    expect(bucketOf(neither, 'freed-equipment')).toBe('absent')
  })
  it('S1: county gate — other-ca keeps CA programs, drops nevada-county ones', () => {
    const withElder = {
      ...base,
      ages: { ...base.ages, age18to59: 1, age60plus: 1 }
    }
    const home = evaluate(withElder, R)
    expect(bucketOf(home, 'bus-youth-free')).toBe('strong')
    expect(bucketOf(home, 'freed-equipment')).not.toBe('absent')

    const elsewhere = evaluate({ ...withElder, county: 'other-ca' as const }, R)
    expect(bucketOf(elsewhere, 'calfresh')).not.toBe('absent')
    expect(bucketOf(elsewhere, 'care')).not.toBe('absent')
    expect(bucketOf(elsewhere, 'bus-youth-free')).toBe('absent')
    expect(bucketOf(elsewhere, 'freed-equipment')).toBe('absent')
  })
  it('wave-1 GA: proxy limit gates visibility but NEVER renders a number', () => {
    const single: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 600,
      ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 0, age80plus: 0 }
    }
    const r = evaluate(single, R)
    // check-first caps at worthAsking; $600 is under the $695 proxy floor
    expect(bucketOf(r, 'county-general-assistance')).toBe('worthAsking')
    const v = r.worthAsking.find(
      (x) => x.ruleId === 'county-general-assistance'
    )
    expect(v?.reasons[0]?.key).toBe('reason.income-screen')
    for (const reason of v?.reasons ?? []) {
      // the proxy MAP chart gates but is not an official GA limit — no
      // verdict may carry it as a renderable number
      expect(reason.params?.limit, 'GA must never carry a limit param').toBe(
        undefined
      )
    }
    // GA is nevada-county-jurisdiction: gone for other-ca users
    const away = evaluate({ ...single, county: 'other-ca' as const }, R)
    expect(bucketOf(away, 'county-general-assistance')).toBe('absent')
  })
  it('wave-1 GA: CalWORKs/SSI enrollment excludes it (inverse of an unlock)', () => {
    const single: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 600,
      ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 0, age80plus: 0 }
    }
    const r = evaluate({ ...single, enrolled: ['ssi'] }, R)
    expect(bucketOf(r, 'county-general-assistance')).toBe('absent')
  })
  it('wave-1 EITC: band gates with a no-number reason; over-band is absent', () => {
    // base HH4 @ $4,800 is inside the $5,369 broadest-honest band
    const r = evaluate(base, R)
    expect(bucketOf(r, 'eitc-caleitc')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'eitc-caleitc')
    expect(v?.reasons[0]?.key).toBe('reason.income-band')
    expect(v?.reasons[0]?.params?.limit).toBe(undefined)
    // single filer over every configuration's cap ($1,592 band for HH1)
    const over = evaluate(
      {
        ...base,
        householdSize: 1,
        incomeMonthlyGross: 2000,
        ages: {
          under5: 0,
          age5to17: 0,
          age18to59: 1,
          age60plus: 0,
          age80plus: 0
        }
      },
      R
    )
    expect(bucketOf(over, 'eitc-caleitc')).toBe('absent')
  })
  it('pregnant flag surfaces WIC without a kid under 5; flag off = absent', () => {
    const pregnantNoKids: Answers = {
      ...base,
      householdSize: 2,
      incomeMonthlyGross: 2500,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 2,
        age60plus: 0,
        age80plus: 0
      },
      flags: ['renter', 'pregnant']
    }
    // $2,500 is comfortably under WIC's $3,336 HH2 limit → strong
    expect(bucketOf(evaluate(pregnantNoKids, R), 'wic')).toBe('strong')
    expect(
      bucketOf(evaluate({ ...pregnantNoKids, flags: ['renter'] }, R), 'wic')
    ).toBe('absent')
    // the flag rescues the member dimension only — income still gates
    expect(
      bucketOf(
        evaluate({ ...pregnantNoKids, incomeMonthlyGross: 4000 }, R),
        'wic'
      )
    ).toBe('absent')
  })
  it('medicare flag activates MSP; unchecked, MSP is absent', () => {
    const single: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 1500,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 0,
        age60plus: 1,
        age80plus: 0
      },
      flags: ['renter', 'medicare']
    }
    // $1,500 ≤ the real $1,795 single cap; check-first caps the bucket
    expect(bucketOf(evaluate(single, R), 'medicare-savings-programs')).toBe(
      'worthAsking'
    )
    expect(
      bucketOf(
        evaluate({ ...single, flags: ['renter'] }, R),
        'medicare-savings-programs'
      )
    ).toBe('absent')
  })
  it('MSP own-income rescue: over the couple-cap still surfaces, no number', () => {
    // multigenerational: household gross high, but MSP tests own income
    const multigen: Answers = {
      ...base,
      incomeMonthlyGross: 9000,
      flags: [...base.flags, 'medicare']
    }
    const r = evaluate(multigen, R)
    expect(bucketOf(r, 'medicare-savings-programs')).toBe('worthAsking')
    const v = r.worthAsking.find(
      (x) => x.ruleId === 'medicare-savings-programs'
    )
    expect(v?.reasons[0]?.key).toBe('reason.own-income')
    for (const reason of v?.reasons ?? []) {
      expect(reason.params?.limit, 'rescue must render no number').toBe(
        undefined
      )
    }
  })
  it('pregnant flag activates the Medi-Cal pregnancy tier', () => {
    const pregnantHH2: Answers = {
      ...base,
      householdSize: 2,
      incomeMonthlyGross: 3000,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 2,
        age60plus: 0,
        age80plus: 0
      },
      flags: ['renter', 'pregnant']
    }
    // $3,000 is under 90% of the $3,841 HH2 limit → strong
    expect(bucketOf(evaluate(pregnantHH2, R), 'medi-cal-pregnancy')).toBe(
      'strong'
    )
    expect(
      bucketOf(
        evaluate({ ...pregnantHH2, flags: ['renter'] }, R),
        'medi-cal-pregnancy'
      )
    ).toBe('absent')
  })
  it('Medi-Cal tiers: kids reach much higher income than adults', () => {
    const r = evaluate(base, R) // HH4 @ $4,800
    expect(bucketOf(r, 'medi-cal-kids')).toBe('strong') // ≤ $7,315, kid present
    expect(bucketOf(r, 'medi-cal-adult')).toBe('absent') // over $3,795
    const lower = evaluate({ ...base, incomeMonthlyGross: 3200 }, R)
    expect(bucketOf(lower, 'medi-cal-adult')).toBe('strong')
  })
  it('Covered California: present under the 400% cliff, absent past it', () => {
    expect(bucketOf(evaluate(base, R), 'covered-california')).toBe(
      'worthAsking' // check-first cap
    )
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 10_800 }, R),
        'covered-california'
      )
    ).toBe('absent') // $10,800 > the $10,716 HH4 cliff; no rescue declared
  })
  it('N4: section-8 (real row) lands in notNow with reason.waitlist-closed', () => {
    const r = evaluate(base, R) // HH4 @ $4,800 ≤ the $5,212 VLI ceiling
    expect(bucketOf(r, 'section8-hcv')).toBe('notNow')
    const v = r.notNow.find((x) => x.ruleId === 'section8-hcv')
    expect(v?.reasons.some((x) => x.key === 'reason.waitlist-closed')).toBe(
      true
    )
    // county-gated like every nevada-county rule
    expect(
      bucketOf(
        evaluate({ ...base, county: 'other-ca' as const }, R),
        'section8-hcv'
      )
    ).toBe('absent')
  })
  it('memberGate: SSI omitted on income-pass without a qualifying member', () => {
    const single: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 1000,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 1,
        age60plus: 0,
        age80plus: 0
      }
    }
    // income passes ($1,000 ≤ $1,233) but no 65+/disability member → omit
    expect(bucketOf(evaluate(single, R), 'ssi-ssp')).toBe('absent')
    // the disability flag satisfies the member dimension
    const withDisability = evaluate(
      { ...single, flags: ['renter', 'disability'] },
      R
    )
    expect(bucketOf(withDisability, 'ssi-ssp')).toBe('worthAsking') // check-first
  })
  it('memberGate: own-income rescue fires ONLY when a member passes', () => {
    const overLimit: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 3000,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 1,
        age60plus: 0,
        age80plus: 0
      }
    }
    // over the couple-cap AND no member → the rescue must stay dead
    expect(bucketOf(evaluate(overLimit, R), 'ssi-ssp')).toBe('absent')
    const elder = evaluate(
      {
        ...overLimit,
        ages: { ...overLimit.ages, age18to59: 0, age60plus: 1 }
      },
      R
    )
    expect(bucketOf(elder, 'ssi-ssp')).toBe('worthAsking')
    const v = elder.worthAsking.find((x) => x.ruleId === 'ssi-ssp')
    expect(v?.reasons[0]?.key).toBe('reason.own-income')
    expect(v?.reasons[0]?.params?.limit).toBe(undefined)
  })
  it('school-meals: universal with a school-age kid; absent without kids', () => {
    expect(bucketOf(evaluate(base, R), 'school-meals')).toBe('strong')
    const noKids: Answers = {
      ...base,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 2,
        age60plus: 0,
        age80plus: 0
      }
    }
    expect(bucketOf(evaluate(noKids, R), 'school-meals')).toBe('absent')
  })
  it('wave-1 CalWORKs: applicant test = MBSAC+$450 band, child required', () => {
    const fam3: Answers = {
      ...base,
      householdSize: 3,
      incomeMonthlyGross: 2200,
      ages: { under5: 1, age5to17: 0, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    // $2,200 ≤ $2,309 (R2 MBSAC $1,859 + $450 disregard); check-first cap
    expect(bucketOf(evaluate(fam3, R), 'calworks')).toBe('worthAsking')
    expect(
      bucketOf(evaluate({ ...fam3, incomeMonthlyGross: 2400 }, R), 'calworks')
    ).toBe('absent')
    const noKid: Answers = {
      ...fam3,
      ages: { under5: 0, age5to17: 0, age18to59: 3, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(noKid, R), 'calworks')).toBe('absent')
  })
  it('wave-2 SFMNP: memberGate omits income-pass/no-senior; a senior lands worthAsking (seasonal)', () => {
    // HH2 @ $2,500 is under the $3,336 limit but nobody is 60+ → omitted
    const noSenior: Answers = {
      ...base,
      householdSize: 2,
      incomeMonthlyGross: 2500,
      ages: { under5: 0, age5to17: 0, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(noSenior, R), 'senior-farmers-market')).toBe(
      'absent'
    )
    const withSenior = evaluate(
      { ...noSenior, ages: { ...noSenior.ages, age18to59: 1, age60plus: 1 } },
      R
    )
    expect(bucketOf(withSenior, 'senior-farmers-market')).toBe('worthAsking')
  })
  it('wave-2 NEMT: pure categorical — not enrolled omits; enrolled is worthAsking via reason.unlock, no numbers', () => {
    expect(bucketOf(evaluate(base, R), 'medi-cal-nemt-rides')).toBe('absent')
    const enrolled = evaluate({ ...base, enrolled: ['medi-cal'] }, R)
    // check-first caps the unlock at worthAsking (oracle: an enrollee's move
    // is "call to book" — endorsed)
    expect(bucketOf(enrolled, 'medi-cal-nemt-rides')).toBe('worthAsking')
    const v = enrolled.worthAsking.find(
      (x) => x.ruleId === 'medi-cal-nemt-rides'
    )
    expect(v?.reasons[0]?.key).toBe('reason.unlock')
    for (const reason of v?.reasons ?? []) {
      expect(reason.params?.limit, 'NEMT carries no income numbers').toBe(
        undefined
      )
    }
    // jurisdiction ruling: Partnership is Nevada County's plan, not statewide
    const away = evaluate(
      { ...base, county: 'other-ca' as const, enrolled: ['medi-cal'] },
      R
    )
    expect(bucketOf(away, 'medi-cal-nemt-rides')).toBe('absent')
  })
  it('wave-2 Head Start: pregnant-only household (no kids) is included via EHS prenatal', () => {
    const pregnantNoKids: Answers = {
      ...base,
      householdSize: 2,
      incomeMonthlyGross: 1500,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 2,
        age60plus: 0,
        age80plus: 0
      },
      flags: ['renter', 'pregnant']
    }
    // $1,500 ≤ the $1,803 HH2 limit at 100% FPL; check-first caps the bucket
    expect(bucketOf(evaluate(pregnantNoKids, R), 'head-start')).toBe(
      'worthAsking'
    )
    // no kid under 5 and no pregnancy → the member dimension hard-gates
    expect(
      bucketOf(
        evaluate({ ...pregnantNoKids, flags: ['renter'] }, R),
        'head-start'
      )
    ).toBe('absent')
  })
})

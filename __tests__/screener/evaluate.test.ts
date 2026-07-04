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
  it('wave-2 CalKIDS: a kid ≤17 surfaces (reason.age, check-first cap); adults-only is absent', () => {
    // no income test on CalKIDS — the account exists regardless of earnings
    const kidNoIncome: Answers = {
      ...base,
      incomeMonthlyGross: 0,
      ages: { under5: 0, age5to17: 1, age18to59: 1, age60plus: 0, age80plus: 0 }
    }
    const r = evaluate(kidNoIncome, R)
    expect(bucketOf(r, 'calkids')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'calkids')
    expect(v?.reasons[0]?.key).toBe('reason.age')
    const adultsOnly: Answers = {
      ...base,
      ages: { under5: 0, age5to17: 0, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(adultsOnly, R), 'calkids')).toBe('absent')
  })
  it('wave-2 PG&E generator rebate: flags-only — pge-customer surfaces worthAsking; no flag is absent', () => {
    const r = evaluate(base, R) // base flags include pge-customer
    expect(bucketOf(r, 'pge-generator-battery')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'pge-generator-battery')
    expect(v?.reasons[0]?.key).toBe('reason.flag-match')
    // no income/age gate — the flag itself is the whole screenable test
    const noPge = evaluate({ ...base, flags: ['renter'] }, R)
    expect(bucketOf(noPge, 'pge-generator-battery')).toBe('absent')
  })
  it('wave-2 REACH: HH4 at the DEF $5,358 line is included; clearly over is absent; no flag omits it', () => {
    // check-first caps the bucket — the point is it is present, not omitted
    const atLine = evaluate({ ...base, incomeMonthlyGross: 5358 }, R)
    expect(bucketOf(atLine, 'reach-dollar-energy')).toBe('worthAsking')
    const over = evaluate({ ...base, incomeMonthlyGross: 7000 }, R)
    expect(bucketOf(over, 'reach-dollar-energy')).toBe('absent')
    // pge-customer is a hard flag gate — no flag, no REACH even under-income
    const noPge = evaluate(
      { ...base, incomeMonthlyGross: 3000, flags: ['renter'] },
      R
    )
    expect(bucketOf(noPge, 'reach-dollar-energy')).toBe('absent')
  })
  it('wave-2 T-Mobile P10M: K-12 ≤185% surfaces; medi-cal unlocks above 185%; trap note rides along; no kid omits', () => {
    // base: HH4 @ $4,800 with a school-age kid, under the $5,087 185% line
    expect(bucketOf(evaluate(base, R), 'tmobile-p10m')).toBe('worthAsking')
    // above 185% with no unlock → income gate holds → absent
    const overNoUnlock = evaluate({ ...base, incomeMonthlyGross: 8000 }, R)
    expect(bucketOf(overNoUnlock, 'tmobile-p10m')).toBe('absent')
    // the Medi-Cal unlock rescues a family above 185% (Medi-Cal kids run to 266%)
    const overUnlock = evaluate(
      { ...base, incomeMonthlyGross: 8000, enrolled: ['medi-cal'] },
      R
    )
    expect(bucketOf(overUnlock, 'tmobile-p10m')).toBe('worthAsking')
    const v = overUnlock.worthAsking.find((x) => x.ruleId === 'tmobile-p10m')
    expect(v?.reasons[0]?.key).toBe('reason.unlock')
    expect(v?.reasons[0]?.params?.program).toBe('medi-cal')
    // the CA universal-meals trap ships as a note on the card (free meals ≠ proof)
    expect(v?.notes).toContain('p10m-universal-meals-trap')
    // no K-12 member → hard age gate omits it even under-income
    const noKid = evaluate(
      {
        ...base,
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
    expect(bucketOf(noKid, 'tmobile-p10m')).toBe('absent')
  })
  it('wave-2 CAPI: SSI-excluded senior surfaces on own income; SSI enrollment excludes; rescue + memberGate hold', () => {
    // an aged/disabled immigrant who CANNOT get SSI (not enrolled) — under the
    // $1,233 single standard, check-first caps at worthAsking
    const senior: Answers = {
      ...base,
      householdSize: 1,
      incomeMonthlyGross: 1000,
      ages: {
        under5: 0,
        age5to17: 0,
        age18to59: 0,
        age60plus: 1,
        age80plus: 0
      },
      flags: ['renter'],
      enrolled: []
    }
    const r = evaluate(senior, R)
    expect(bucketOf(r, 'capi')).toBe('worthAsking')
    expect(
      r.worthAsking.find((v) => v.ruleId === 'capi')?.reasons[0]?.key
    ).toBe('reason.under-limit')
    // categoricalExcludes: someone already on SSI must NOT see CAPI
    expect(
      bucketOf(evaluate({ ...senior, enrolled: ['ssi'] }, R), 'capi')
    ).toBe('absent')
    // own-income rescue: over the household limit still surfaces (no number)
    const overLimit = evaluate({ ...senior, incomeMonthlyGross: 3000 }, R)
    expect(bucketOf(overLimit, 'capi')).toBe('worthAsking')
    const v = overLimit.worthAsking.find((x) => x.ruleId === 'capi')
    expect(v?.reasons[0]?.key).toBe('reason.own-income')
    expect(v?.reasons[0]?.params?.limit).toBe(undefined)
    // memberGate: income passes but no 65+/disabled member → omitted, so the
    // rescue can never fire member-blind
    const noMember: Answers = {
      ...senior,
      ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(noMember, R), 'capi')).toBe('absent')
  })
  it('wave-2 subsidized child care: a kid at the 85% SMI boundary surfaces; adults-only / over-income omit', () => {
    // HH3 @ $8,054 = the exact 85% SMI ceiling for a family of 3, with a kid
    const fam3Kid: Answers = {
      ...base,
      householdSize: 3,
      incomeMonthlyGross: 8054,
      ages: { under5: 0, age5to17: 1, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    const r = evaluate(fam3Kid, R)
    expect(bucketOf(r, 'sncs-child-care')).toBe('worthAsking') // check-first cap
    expect(
      r.worthAsking.find((v) => v.ruleId === 'sncs-child-care')?.reasons[0]?.key
    ).toBe('reason.under-limit')
    // no child under 13 → the age gate omits it even under-income
    const adultsOnly: Answers = {
      ...fam3Kid,
      ages: { under5: 0, age5to17: 0, age18to59: 3, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(adultsOnly, R), 'sncs-child-care')).toBe('absent')
    // a kid but well over 85% SMI (no rescue) → absent
    expect(
      bucketOf(
        evaluate({ ...fam3Kid, incomeMonthlyGross: 12_000 }, R),
        'sncs-child-care'
      )
    ).toBe('absent')
  })
  it('wave-2 CalWORKs Homeless Assistance: the mirrored gate reaches the apparently-eligible (not-yet-enrolled) family', () => {
    // HH3 @ $2,200 ≤ the $2,309 MBSAC line, a kid present, NOT enrolled in
    // CalWORKs — option B surfaces the not-yet-enrolled homeless family
    const applicant: Answers = {
      ...base,
      householdSize: 3,
      incomeMonthlyGross: 2200,
      ages: {
        under5: 1,
        age5to17: 0,
        age18to59: 2,
        age60plus: 0,
        age80plus: 0
      },
      enrolled: []
    }
    expect(
      bucketOf(evaluate(applicant, R), 'calworks-homeless-assistance')
    ).toBe('worthAsking')
    // no child → the CalWORKs age gate omits it
    const noKid: Answers = {
      ...applicant,
      ages: { under5: 0, age5to17: 0, age18to59: 3, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(noKid, R), 'calworks-homeless-assistance')).toBe(
      'absent'
    )
    // an enrolled CalWORKs recipient over the income line still surfaces via the unlock
    const recipient = evaluate(
      { ...applicant, incomeMonthlyGross: 5000, enrolled: ['calworks'] },
      R
    )
    expect(bucketOf(recipient, 'calworks-homeless-assistance')).toBe(
      'worthAsking'
    )
    expect(
      recipient.worthAsking.find(
        (v) => v.ruleId === 'calworks-homeless-assistance'
      )?.reasons[0]?.key
    ).toBe('reason.unlock')
  })
  it('wave-2 county food banks: universal → strong for Nevada County, absent elsewhere', () => {
    const here = evaluate(base, R)
    expect(bucketOf(here, 'food-bank-nevada-county')).toBe('strong')
    expect(bucketOf(here, 'interfaith-food-ministry')).toBe('strong')
    expect(
      here.strong.find((v) => v.ruleId === 'food-bank-nevada-county')
        ?.reasons[0]?.key
    ).toBe('reason.universal')
    // county gate: nevada-county programs don't exist for other-ca users
    const elsewhere = evaluate({ ...base, county: 'other-ca' as const }, R)
    expect(bucketOf(elsewhere, 'food-bank-nevada-county')).toBe('absent')
    expect(bucketOf(elsewhere, 'interfaith-food-ministry')).toBe('absent')
  })
  it('wave-2 batch D library hotspot: universal → strong for Nevada County, absent for other-ca', () => {
    const here = evaluate(base, R)
    expect(bucketOf(here, 'library-hotspot')).toBe('strong')
    expect(
      here.strong.find((v) => v.ruleId === 'library-hotspot')?.reasons[0]?.key
    ).toBe('reason.universal')
    // nevada-county jurisdiction: gone for other-ca users
    const elsewhere = evaluate({ ...base, county: 'other-ca' as const }, R)
    expect(bucketOf(elsewhere, 'library-hotspot')).toBe('absent')
  })
  it('wave-2 batch D unclaimed property: universal CA → strong for Nevada County AND other-ca (statewide)', () => {
    const here = evaluate(base, R)
    expect(bucketOf(here, 'unclaimed-property')).toBe('strong')
    expect(
      here.strong.find((v) => v.ruleId === 'unclaimed-property')?.reasons[0]
        ?.key
    ).toBe('reason.universal')
    // CA jurisdiction (not nevada-county) → still strong for an other-ca user
    const elsewhere = evaluate({ ...base, county: 'other-ca' as const }, R)
    expect(bucketOf(elsewhere, 'unclaimed-property')).toBe('strong')
  })
  it('wave-2 batch D senior firewood: a 60+ senior lands worthAsking (seasonal + memberGate); no-senior omits', () => {
    // base HH4 has no 60+ member → memberGate omits it before income
    expect(bucketOf(evaluate(base, R), 'senior-firewood')).toBe('absent')
    const withSenior = evaluate(
      { ...base, ages: { ...base.ages, age18to59: 1, age60plus: 1 } },
      R
    )
    expect(bucketOf(withSenior, 'senior-firewood')).toBe('worthAsking')
    const v = withSenior.worthAsking.find((x) => x.ruleId === 'senior-firewood')
    expect(v?.reasons[0]?.key).toBe('reason.age')
  })
  it('wave-2 batch D GCSS senior meals: any 60+ senior → strong (open café); no-senior omits', () => {
    // base HH4 has no 60+ member → memberGate omits it
    expect(bucketOf(evaluate(base, R), 'gcss-senior-meals')).toBe('absent')
    const withSenior = evaluate(
      { ...base, ages: { ...base.ages, age18to59: 1, age60plus: 1 } },
      R
    )
    expect(bucketOf(withSenior, 'gcss-senior-meals')).toBe('strong')
    const v = withSenior.strong.find((x) => x.ruleId === 'gcss-senior-meals')
    expect(v?.reasons[0]?.key).toBe('reason.age')
  })
  it('wave-2 E-cluster (E1/E2/E3): flags-only PG&E customer → worthAsking; no pge-customer → absent', () => {
    const cluster = [
      'pge-storage-initiative',
      'pge-backup-transfer-meter',
      'pge-battery-rebate'
    ]
    const r = evaluate(base, R) // base flags include pge-customer
    for (const id of cluster) {
      expect(bucketOf(r, id), id).toBe('worthAsking')
      expect(
        r.worthAsking.find((v) => v.ruleId === id)?.reasons[0]?.key,
        id
      ).toBe('reason.flag-match')
    }
    const noPge = evaluate({ ...base, flags: ['renter'] }, R)
    for (const id of cluster) expect(bucketOf(noPge, id), id).toBe('absent')
  })
  it('wave-2 E3 battery rebate: the Dec-31-2026 deadline note rides on the card', () => {
    const v = evaluate(base, R).worthAsking.find(
      (x) => x.ruleId === 'pge-battery-rebate'
    )
    expect(v?.notes).toContain('pbsr-deadline')
  })
  it('wave-2 E4 used-EV: Standard tier is flag-match; enrollment fires the $4,000 Plus unlock; hard PG&E gate', () => {
    const r = evaluate(base, R) // pge-customer, no enrollment
    expect(bucketOf(r, 'pge-used-ev-rebate')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'pge-used-ev-rebate')
    expect(v?.reasons[0]?.key).toBe('reason.flag-match')
    expect(v?.notes).toContain('usedev-standard-sunset')
    // an enrolled household reaches the income-qualified Plus tier via the unlock
    const plus = evaluate({ ...base, enrolled: ['calfresh'] }, R)
    expect(
      plus.worthAsking.find((x) => x.ruleId === 'pge-used-ev-rebate')
        ?.reasons[0]?.key
    ).toBe('reason.unlock')
    // flagsAll[pge-customer] is a hard gate — no pge-customer omits it even when enrolled
    expect(
      bucketOf(
        evaluate({ ...base, flags: ['renter'], enrolled: ['calfresh'] }, R),
        'pge-used-ev-rebate'
      )
    ).toBe('absent')
  })
  it('wave-2 E5 EV charger: corrected Rebate-Plus unlock set includes WIC and CalWORKs (CARE removed)', () => {
    expect(bucketOf(evaluate(base, R), 'pge-ev-charging-rebate')).toBe(
      'worthAsking'
    )
    // every enum in the corrected set unlocks the Plus tier
    for (const e of [
      'calfresh',
      'calworks',
      'medi-cal',
      'ssi',
      'wic'
    ] as const) {
      const v = evaluate({ ...base, enrolled: [e] }, R).worthAsking.find(
        (x) => x.ruleId === 'pge-ev-charging-rebate'
      )
      expect(v?.reasons[0]?.key, e).toBe('reason.unlock')
    }
    expect(
      bucketOf(
        evaluate({ ...base, flags: ['renter'] }, R),
        'pge-ev-charging-rebate'
      )
    ).toBe('absent')
  })
  it('wave-2 E6 HEEHRA: income-qualified household → notNow (waitlist-closed) with NO rendered number; over-band absent', () => {
    // HH4 @ $4,800 is under the 150% AMI band ($17,550) → included, then waitlist-closed forces notNow
    const r = evaluate(base, R)
    expect(bucketOf(r, 'heehra-heat-pump')).toBe('notNow')
    const v = r.notNow.find((x) => x.ruleId === 'heehra-heat-pump')
    expect(v?.reasons.some((x) => x.key === 'reason.waitlist-closed')).toBe(
      true
    )
    // the proxy AMI band gates visibility but must never render a number
    for (const reason of v?.reasons ?? [])
      expect(reason.params?.limit, 'HEEHRA proxy renders no number').toBe(
        undefined
      )
    // above the 150% AMI band, no rescue → absent
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 20_000 }, R),
        'heehra-heat-pump'
      )
    ).toBe('absent')
  })
  it('wave-2 woodstove: homeowner in Nevada County → notNow (waitlist-closed); renter or other-ca → absent', () => {
    const owner = evaluate({ ...base, flags: ['homeowner'] }, R)
    expect(bucketOf(owner, 'woodstove-changeout')).toBe('notNow')
    const v = owner.notNow.find((x) => x.ruleId === 'woodstove-changeout')
    expect(v?.reasons.some((x) => x.key === 'reason.waitlist-closed')).toBe(
      true
    )
    // flagsAll[homeowner] gate — a renter never sees it
    expect(
      bucketOf(
        evaluate({ ...base, flags: ['renter'] }, R),
        'woodstove-changeout'
      )
    ).toBe('absent')
    // nevada-county jurisdiction — gone for other-ca users
    expect(
      bucketOf(
        evaluate(
          { ...base, flags: ['homeowner'], county: 'other-ca' as const },
          R
        ),
        'woodstove-changeout'
      )
    ).toBe('absent')
  })
  it('wave-2 PTP: 62+ homeowner under the income cap → worthAsking (seasonal) with the lien note; gates on homeowner + 62/disabled', () => {
    const owner62: Answers = {
      ...base,
      flags: ['homeowner'],
      incomeMonthlyGross: 4000,
      ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 1, age80plus: 0 }
    }
    const r = evaluate(owner62, R)
    expect(bucketOf(r, 'property-tax-postponement')).toBe('worthAsking') // seasonal cap
    const v = r.worthAsking.find(
      (x) => x.ruleId === 'property-tax-postponement'
    )
    expect(v?.notes).toContain('ptp-lien-repaid')
    // must own the home — a renter never sees it (flagsAll gate)
    expect(
      bucketOf(
        evaluate({ ...owner62, flags: ['renter'] }, R),
        'property-tax-postponement'
      )
    ).toBe('absent')
    // memberGate: a homeowner under the cap but with no 62+/blind/disabled member → omitted
    const youngOwner: Answers = {
      ...owner62,
      ages: { under5: 0, age5to17: 0, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(youngOwner, R), 'property-tax-postponement')).toBe(
      'absent'
    )
  })
  it('wave-2 Homeowners Exemption: flags × universal — homeowner → strong, non-homeowner → omitted', () => {
    const owner = evaluate({ ...base, flags: ['homeowner'] }, R)
    expect(bucketOf(owner, 'homeowners-exemption')).toBe('strong')
    expect(
      owner.strong.find((x) => x.ruleId === 'homeowners-exemption')?.reasons[0]
        ?.key
    ).toBe('reason.universal')
    // base flags are ['renter', 'pge-customer'] → the flagsAll[homeowner] gate omits it
    expect(bucketOf(evaluate(base, R), 'homeowners-exemption')).toBe('absent')
  })
  it('wave-2 DOR voc rehab: flags-only disability → worthAsking; no disability → absent', () => {
    const disabled = evaluate(
      { ...base, flags: [...base.flags, 'disability'] },
      R
    )
    expect(bucketOf(disabled, 'dor-voc-rehab')).toBe('worthAsking')
    expect(
      disabled.worthAsking.find((x) => x.ruleId === 'dor-voc-rehab')?.reasons[0]
        ?.key
    ).toBe('reason.flag-match')
    expect(bucketOf(evaluate(base, R), 'dor-voc-rehab')).toBe('absent')
  })
  it('wave-2 Habitat: nevada-county household at/under the income ceiling → worthAsking; over the ceiling / other-ca → absent', () => {
    // HH4 ceiling = $7,500/mo; base HH4 @ $4,800 is under it
    expect(bucketOf(evaluate(base, R), 'habitat-home-buyer')).toBe(
      'worthAsking'
    )
    // at the ceiling boundary → still present
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 7500 }, R),
        'habitat-home-buyer'
      )
    ).toBe('worthAsking')
    // over the ceiling (no rescue) → absent
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 8000 }, R),
        'habitat-home-buyer'
      )
    ).toBe('absent')
    // nevada-county jurisdiction → gone for other-ca
    expect(
      bucketOf(
        evaluate({ ...base, county: 'other-ca' as const }, R),
        'habitat-home-buyer'
      )
    ).toBe('absent')
  })
  it('wave-2 SilverSneakers: Medicare flag → worthAsking; no medicare flag → absent', () => {
    const medicare = evaluate(
      { ...base, flags: [...base.flags, 'medicare'] },
      R
    )
    expect(bucketOf(medicare, 'silversneakers')).toBe('worthAsking')
    expect(
      medicare.worthAsking.find((x) => x.ruleId === 'silversneakers')
        ?.reasons[0]?.key
    ).toBe('reason.flag-match')
    expect(bucketOf(evaluate(base, R), 'silversneakers')).toBe('absent')
  })
  it('ready-set H1 DCAP: income ≤ 300% FPL → worthAsking (computed cell renders); over → absent', () => {
    // HH4 300% FPL = $33,000 × 3.0 / 12 = $8,250/mo; base @ $4,800 is under
    const r = evaluate(base, R)
    expect(bucketOf(r, 'dcap-clean-vehicle')).toBe('worthAsking') // check-first cap
    const v = r.worthAsking.find((x) => x.ruleId === 'dcap-clean-vehicle')
    expect(v?.reasons[0]?.key).toBe('reason.under-limit') // DCAP's 300% is pinned → number renders
    expect(v?.reasons[0]?.params?.limit).toBe(8250)
    // over the 300% ceiling → absent (no rescue)
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 9000 }, R),
        'dcap-clean-vehicle'
      )
    ).toBe('absent')
  })
  it('ready-set H5 CIAP: income-only 300% FPL rule → worthAsking under, absent over', () => {
    expect(bucketOf(evaluate(base, R), 'ciap-inventor-legal')).toBe(
      'worthAsking'
    )
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 9000 }, R),
        'ciap-inventor-legal'
      )
    ).toBe('absent')
  })
  it('ready-set G4 Miracle Flights: kid ≤17 within the widened 370% FPL band → worthAsking; adults-only / over-370% → absent', () => {
    // HH4 370% FPL = $33,000 × 3.7 / 12 = $10,175/mo (widened from the old 300% = $8,250)
    expect(bucketOf(evaluate(base, R), 'miracle-flights')).toBe('worthAsking')
    // a family in the newly-included 300–370% band (was excluded at 300%) with a kid now qualifies
    const widened = evaluate({ ...base, incomeMonthlyGross: 9000 }, R)
    expect(bucketOf(widened, 'miracle-flights')).toBe('worthAsking')
    // over 370% → absent
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 11_000 }, R),
        'miracle-flights'
      )
    ).toBe('absent')
    // no child → the ageAnyMax gate omits it even under-income
    const adultsOnly: Answers = {
      ...base,
      ages: { under5: 0, age5to17: 0, age18to59: 2, age60plus: 0, age80plus: 0 }
    }
    expect(bucketOf(evaluate(adultsOnly, R), 'miracle-flights')).toBe('absent')
  })
  it('ready-set G5 Mercy Medical Angels: proxyReasonKey suppresses the unpinnable income number', () => {
    const r = evaluate(base, R) // HH4 @ $4,800 under the 300% cell
    expect(bucketOf(r, 'mercy-medical-angels')).toBe('worthAsking')
    const v = r.worthAsking.find((x) => x.ruleId === 'mercy-medical-angels')
    // the proxy reason renders instead of reason.under-limit — no number
    expect(v?.reasons[0]?.key).toBe('reason.income-ami')
    for (const reason of v?.reasons ?? [])
      expect(reason.params?.limit, 'G5 must render no income number').toBe(
        undefined
      )
    // over the (suppressed) 300% ceiling → still absent
    expect(
      bucketOf(
        evaluate({ ...base, incomeMonthlyGross: 9000 }, R),
        'mercy-medical-angels'
      )
    ).toBe('absent')
  })
  it('finale G1 Cal Grants: student flag under the ceiling → worthAsking with a NO-number proxy; no student / over ceiling → absent', () => {
    const student = evaluate({ ...base, flags: [...base.flags, 'student'] }, R)
    expect(bucketOf(student, 'cal-grants')).toBe('worthAsking') // check-first cap
    const v = student.worthAsking.find((x) => x.ruleId === 'cal-grants')
    expect(v?.reasons[0]?.key).toBe('reason.calgrant-income-band')
    for (const reason of v?.reasons ?? [])
      expect(
        reason.params?.limit,
        'Cal Grant renders no single income number'
      ).toBe(undefined)
    // the student flag is a hard gate — no flag, no card
    expect(bucketOf(evaluate(base, R), 'cal-grants')).toBe('absent')
    // over the A/C ceiling (HH4 $12,058/mo) → absent (no rescue)
    expect(
      bucketOf(
        evaluate(
          {
            ...base,
            flags: [...base.flags, 'student'],
            incomeMonthlyGross: 13_000
          },
          R
        ),
        'cal-grants'
      )
    ).toBe('absent')
  })
  it('finale G2/G3 Sierra College: student flag → worthAsking (flags-only); no student → absent', () => {
    const student = evaluate({ ...base, flags: [...base.flags, 'student'] }, R)
    for (const id of [
      'sierra-college-emergency-fund',
      'sierra-college-free-bus'
    ]) {
      expect(bucketOf(student, id), id).toBe('worthAsking')
      expect(
        student.worthAsking.find((x) => x.ruleId === id)?.reasons[0]?.key,
        id
      ).toBe('reason.flag-match')
      expect(bucketOf(evaluate(base, R), id), id).toBe('absent')
    }
  })
  it('finale H4 Hospitality House: homeless flag in Nevada County → worthAsking; no flag / other-ca → absent', () => {
    const homeless = evaluate(
      { ...base, flags: [...base.flags, 'homeless'] },
      R
    )
    expect(bucketOf(homeless, 'hospitality-house')).toBe('worthAsking')
    expect(
      homeless.worthAsking.find((x) => x.ruleId === 'hospitality-house')
        ?.reasons[0]?.key
    ).toBe('reason.flag-match')
    expect(bucketOf(evaluate(base, R), 'hospitality-house')).toBe('absent')
    expect(
      bucketOf(
        evaluate(
          {
            ...base,
            flags: [...base.flags, 'homeless'],
            county: 'other-ca' as const
          },
          R
        ),
        'hospitality-house'
      )
    ).toBe('absent')
  })
  it('finale C2 sharpening: the homeless flag widens CalWORKs-HA to a childless household (was omitted on the income path)', () => {
    // HH2 @ $1,500 ≤ the $1,951 MBSAC line, NO child, not enrolled in CalWORKs
    const childless: Answers = {
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
      flags: ['renter'],
      enrolled: []
    }
    // without the homeless flag, the ageAnyMax:17 gate omits a childless household
    expect(
      bucketOf(evaluate(childless, R), 'calworks-homeless-assistance')
    ).toBe('absent')
    // the homeless flag satisfies the widened member dimension → HA surfaces
    const homeless = evaluate(
      { ...childless, flags: ['renter', 'homeless'] },
      R
    )
    expect(bucketOf(homeless, 'calworks-homeless-assistance')).toBe(
      'worthAsking'
    )
    // the optional 'pregnant' member also widens it (CalWORKs covers pregnancy)
    const pregnant = evaluate(
      { ...childless, flags: ['renter', 'pregnant'] },
      R
    )
    expect(bucketOf(pregnant, 'calworks-homeless-assistance')).toBe(
      'worthAsking'
    )
    // a childless household with neither flag stays omitted (the existing batch-C behavior)
    expect(
      bucketOf(evaluate(childless, R), 'calworks-homeless-assistance')
    ).toBe('absent')
  })
})

import type {
  Answers,
  Bucket,
  EvaluationResult,
  Reason,
  Rule,
  Verdict
} from './types'
import { monthlyLimit } from './fpl'

const DEFAULT_MARGIN_PCT = 10

function incomeLimitFor(rule: Rule, householdSize: number): number | null {
  const t = rule.test
  if (t.limitsMonthly) {
    const size = Math.max(householdSize, t.householdFloor ?? 1)
    const table = t.limitsMonthly
    if (table[String(size)] !== undefined) return table[String(size)]!
    const increment = table.increment ?? 0
    const known = Object.keys(table)
      .filter((k) => k !== 'increment')
      .map(Number)
    const maxKnown = Math.max(...known)
    return table[String(maxKnown)]! + (size - maxKnown) * increment
  }
  if (t.incomePctFPL !== undefined)
    return monthlyLimit(householdSize, t.incomePctFPL, t.householdFloor ?? 1)
  return null
}

function agePasses(rule: Rule, a: Answers): boolean | null {
  const t = rule.test
  if (t.ageAnyMin === undefined && t.ageAnyMax === undefined) return null
  let pass = false
  if (t.ageAnyMin !== undefined) {
    if (t.ageAnyMin >= 80) pass ||= a.ages.age80plus > 0
    else if (t.ageAnyMin >= 60) pass ||= a.ages.age60plus > 0
    else pass ||= a.ages.age18to59 + a.ages.age60plus > 0
  }
  if (t.ageAnyMax !== undefined) {
    if (t.ageAnyMax <= 4) pass ||= a.ages.under5 > 0
    else if (t.ageAnyMax <= 17) pass ||= a.ages.under5 + a.ages.age5to17 > 0
  }
  return pass
}

function worst(a: Bucket, b: Bucket): Bucket {
  const order: Bucket[] = ['strong', 'likely', 'worthAsking', 'notNow']
  return order[Math.max(order.indexOf(a), order.indexOf(b))]!
}

export function evaluate(answers: Answers, rules: Rule[]): EvaluationResult {
  const out: EvaluationResult = {
    strong: [],
    likely: [],
    worthAsking: [],
    notNow: []
  }

  for (const rule of rules) {
    const t = rule.test
    const reasons: Reason[] = []
    const notes: string[] = [...(t.specialNotes ?? [])]
    let bucket: Bucket = 'strong'
    let include = false

    // county gate (oracle S1): nevada-county programs don't exist elsewhere
    if (rule.jurisdiction === 'nevada-county' && answers.county !== 'nevada')
      continue

    // categorical excludes — enrollment that DISQUALIFIES (GA is only for
    // people who can't get CalWORKs/SSI; the inverse of an unlock)
    if (t.categoricalExcludes?.some((x) => answers.enrolled.includes(x)))
      continue

    // hard flag gates — program simply doesn't apply without them
    if (t.flagsAll?.length) {
      const missing = t.flagsAll.filter((f) => !answers.flags.includes(f))
      if (missing.length > 0) continue
    }

    const age = agePasses(rule, answers)
    const memberViaFlag =
      t.memberFlagsAny?.some((f) => answers.flags.includes(f)) ?? false

    // memberGate (oracle mixed ruling): the member dimension is HARD — no
    // qualifying member (age band or member flag) means the rule is omitted
    // before income is even considered, so overLimitRescue can never fire
    // member-blind.
    if (t.memberGate && age !== null && !age && !memberViaFlag) continue

    const unlockHit = (t.categoricalUnlocks ?? []).find((u) =>
      answers.enrolled.includes(u)
    )
    const limit = incomeLimitFor(rule, answers.householdSize)

    if (t.universal) {
      include = true
      reasons.push({ key: 'reason.universal' })
    }

    if (unlockHit) {
      include = true
      reasons.push({ key: 'reason.unlock', params: { program: unlockHit } })
    } else if (limit !== null) {
      const margin = (rule.boundaryMarginPct ?? DEFAULT_MARGIN_PCT) / 100
      if (answers.incomeMonthlyGross <= limit) {
        include = true
        if (t.proxyReasonKey) {
          // Numbers used for gating are not claims; numbers rendered are.
          // A proxy/band limit gates visibility but must never print — emit
          // the rule's no-number reason instead of reason.under-limit.
          reasons.push({ key: t.proxyReasonKey })
        } else {
          reasons.push({
            key: 'reason.under-limit',
            params: {
              income: answers.incomeMonthlyGross,
              limit,
              household: answers.householdSize
            }
          })
        }
        // boundary → never strong; spec conservatism is unconditional
        // (oracle S2 removed a WIC-shaped age exemption here)
        if (answers.incomeMonthlyGross > limit * (1 - margin))
          bucket = worst(bucket, 'likely')
      } else if (t.overLimitRescue) {
        // over the HOUSEHOLD limit, but the rule tests the applicant's OWN
        // income (oracle health item 4) — an omitted card renders no note,
        // so the multigen case surfaces as a question, never a claim
        include = true
        bucket = worst(bucket, 'worthAsking')
        reasons.push({ key: t.overLimitRescue })
      } else if (
        notes.includes('senior-net-test') &&
        answers.ages.age60plus > 0
      ) {
        // over gross limit but senior nuance applies — worth asking
        include = true
        bucket = worst(bucket, 'worthAsking')
        reasons.push({ key: 'reason.senior-net-test', params: { limit } })
      }
    }

    // flags-only rules (amendment A1): flagsAll passed and no other dimension
    // exists — universal/unlock-hit would already have set include, and
    // income/age are absent — so the flag itself is the whole screenable
    // test. Surface capped at worthAsking; the note carries the remaining
    // nuance (medical device, failed-smog tier).
    if (
      !include &&
      (t.flagsAll?.length ?? 0) > 0 &&
      limit === null &&
      age === null
    ) {
      include = true
      bucket = worst(bucket, 'worthAsking')
      reasons.push({ key: 'reason.flag-match' })
    }

    // age dimension: ageAnyMax (a specific member, e.g. a child) is a hard
    // gate; ageAnyMin is a solo gate when it's the rule's only dimension and
    // an alternative qualifying route (weaker bucket) when income exists too.
    // memberFlagsAny widens the member dimension only (e.g. WIC's pregnancy
    // category) — every other gate, income included, still applies.
    if (age !== null) {
      const incomeDimension = limit !== null || t.universal || unlockHit
      if (age && !include) {
        if (!incomeDimension) {
          include = true
          reasons.push({ key: 'reason.age' })
        } else if (t.ageAnyMin !== undefined) {
          include = true
          bucket = worst(bucket, 'worthAsking')
          reasons.push({ key: 'reason.age' })
        }
      } else if (!age && !include) {
        continue // age-gated and no qualifying member
      } else if (
        !age &&
        include &&
        t.ageAnyMax !== undefined &&
        !memberViaFlag
      ) {
        // income passed but the required member (e.g. a child for WIC) is absent
        continue
      }
    }

    if (!include) continue

    if (rule.status === 'check-first') bucket = worst(bucket, 'worthAsking')
    if (rule.status === 'seasonal') bucket = worst(bucket, 'worthAsking')
    if (rule.status === 'waitlist-closed') {
      // Not-right-now still deserves an honest why (oracle N4); the card's
      // value line carries the next move.
      bucket = 'notNow'
      reasons.push({ key: 'reason.waitlist-closed' })
    }

    const verdict: Verdict = { ruleId: rule.id, bucket, reasons, notes }
    out[bucket].push(verdict)
  }
  return out
}

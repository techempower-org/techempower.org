import type { Rule } from './types'

const MAX_AGE_DAYS = 120

/** Returns a list of human-readable problems; empty list = valid. */
export function validateRules(rules: Rule[], now: Date): string[] {
  const problems: string[] = []
  const seen = new Set<string>()

  for (const r of rules) {
    const where = `rule "${r.id}"`
    if (seen.has(r.id)) problems.push(`${where}: duplicate id`)
    seen.add(r.id)

    if (!r.provenance?.length) problems.push(`${where}: provenance required`)
    for (const p of r.provenance ?? []) {
      const age =
        (now.getTime() - new Date(p.verifiedAt).getTime()) / 86_400_000
      if (Number.isNaN(age))
        problems.push(`${where}: bad verifiedAt "${p.verifiedAt}"`)
      else if (age > MAX_AGE_DAYS)
        problems.push(
          `${where}: stale provenance "${p.claim}" (${Math.floor(age)}d old)`
        )
      if (!p.source.startsWith('http'))
        problems.push(`${where}: provenance source must be a URL`)
    }

    const t = r.test
    const hasDimension =
      t.universal === true ||
      t.limitsMonthly !== undefined ||
      t.incomePctFPL !== undefined ||
      t.ageAnyMin !== undefined ||
      t.ageAnyMax !== undefined ||
      (t.flagsAll?.length ?? 0) > 0 ||
      (t.categoricalUnlocks?.length ?? 0) > 0
    if (!hasDimension) problems.push(`${where}: no eligibility dimension`)

    for (const field of ['name', 'value'] as const) {
      if (!r[field]?.en?.trim()) problems.push(`${where}: ${field}.en missing`)
      if (!r[field]?.es?.trim()) problems.push(`${where}: ${field}.es missing`)
    }
    if (!r.apply.url && !r.apply.phone)
      problems.push(`${where}: apply needs url or phone`)
    // apply prose is user-facing — when present it must carry both languages
    for (const field of ['phone', 'local'] as const) {
      const prose = r.apply[field]
      if (prose) {
        if (!prose.en?.trim())
          problems.push(`${where}: apply.${field}.en missing`)
        if (!prose.es?.trim())
          problems.push(`${where}: apply.${field}.es missing`)
      }
    }
    // dollar figures for note templates live in noteParams so they sit inside
    // this rule's provenance/freshness regime — every key must map to a
    // declared specialNote (catches typos and orphaned numbers)
    for (const key of Object.keys(r.noteParams ?? {})) {
      if (!r.test.specialNotes?.includes(key))
        problems.push(
          `${where}: noteParams["${key}"] has no matching specialNotes entry`
        )
    }
  }
  return problems
}

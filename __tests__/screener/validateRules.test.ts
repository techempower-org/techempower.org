import { describe, expect, it } from 'vitest'

import type { Rule } from '@/lib/screener/types'
import { validateRules } from '@/lib/screener/validateRules'

const good: Rule = {
  id: 'x',
  jurisdiction: 'CA',
  category: 'food',
  status: 'open',
  test: { limitsMonthly: { '1': 100, increment: 10 } },
  name: { en: 'X', es: 'X' },
  value: { en: 'v', es: 'v' },
  apply: { url: 'https://example.org' },
  provenance: [
    {
      claim: 'income',
      source: 'https://example.org/eligibility',
      verifiedAt: '2026-07-01',
      via: 'test'
    }
  ]
}

describe('validateRules', () => {
  it('accepts a valid rule', () => {
    expect(validateRules([good], new Date('2026-07-02'))).toEqual([])
  })
  it('rejects missing provenance', () => {
    const bad = { ...good, provenance: [] }
    expect(validateRules([bad], new Date('2026-07-02'))[0]).toMatch(
      /provenance/
    )
  })
  it('rejects stale provenance (>120 days)', () => {
    const stale = {
      ...good,
      provenance: [{ ...good.provenance[0]!, verifiedAt: '2026-01-01' }]
    }
    expect(validateRules([stale], new Date('2026-07-02'))[0]).toMatch(/stale/)
  })
  it('rejects a rule with no eligibility dimension at all', () => {
    const dimless = { ...good, test: {} }
    expect(validateRules([dimless], new Date('2026-07-02'))[0]).toMatch(
      /dimension/
    )
  })
  it('rejects missing Spanish strings', () => {
    const noEs = { ...good, name: { en: 'X', es: '' } }
    expect(validateRules([noEs], new Date('2026-07-02'))[0]).toMatch(/es/)
  })
  it('rejects a bare-origin provenance source (E4)', () => {
    const bare = {
      ...good,
      provenance: [{ ...good.provenance[0]!, source: 'https://example.org' }]
    }
    expect(validateRules([bare], new Date('2026-07-02'))[0]).toMatch(
      /bare origin/
    )
    const notAUrl = {
      ...good,
      provenance: [
        { ...good.provenance[0]!, source: 'https://example.org (some pages)' }
      ]
    }
    expect(validateRules([notAUrl], new Date('2026-07-02'))[0]).toMatch(
      /must be a URL/
    )
  })
})

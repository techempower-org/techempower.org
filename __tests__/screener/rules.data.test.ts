import { describe, expect, it } from 'vitest'

import type { Rule } from '@/lib/screener/types'
import rules from '@/lib/screener/rules.data.json'
import { validateRules } from '@/lib/screener/validateRules'

describe('rules.data.json', () => {
  it('validates clean against the live clock', () => {
    expect(validateRules(rules as Rule[], new Date())).toEqual([])
  })
  it('contains the wave-0 season corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'calfresh',
      'wic',
      'lifeline-ca',
      'care',
      'fera',
      'liheap',
      'esa',
      'nid-lira',
      'clca',
      'bar-cap-repair',
      'bar-retirement',
      'bus-youth-free',
      'bus-golden-ticket',
      'bus-low-income-pass',
      'medical-baseline',
      'freed-equipment',
      'lsnc-legal'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
})

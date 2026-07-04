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
  it('contains the complete wave-1 verified corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'eitc-caleitc',
      'calworks',
      'county-general-assistance',
      'medi-cal-adult',
      'medi-cal-kids',
      'medi-cal-pregnancy',
      'covered-california',
      'medicare-savings-programs',
      'ssi-ssp',
      'section8-hcv',
      'school-meals'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
  it('contains the wave-2 batch A corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'medi-cal-nemt-rides',
      'sun-bucks',
      'wap-weatherization',
      'head-start',
      'senior-farmers-market'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
  it('contains the wave-2 batch B corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'calkids',
      'pge-generator-battery',
      'reach-dollar-energy',
      'tmobile-p10m'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
  it('contains the wave-2 batch C corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'sncs-child-care',
      'calworks-homeless-assistance',
      'capi',
      'childrens-community-chest',
      'food-bank-nevada-county',
      'interfaith-food-ministry'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
  it('contains the wave-2 batch D corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'library-hotspot',
      'senior-firewood',
      'gcss-senior-meals',
      'unclaimed-property'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
  it('contains the wave-2 batch E corpus (54 rules)', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'pge-storage-initiative',
      'pge-backup-transfer-meter',
      'pge-battery-rebate',
      'pge-used-ev-rebate',
      'pge-ev-charging-rebate',
      'heehra-heat-pump',
      'woodstove-changeout'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
    expect((rules as Rule[]).length).toBe(54)
  })
})

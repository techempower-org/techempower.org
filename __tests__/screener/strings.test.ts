import { describe, expect, it } from 'vitest'

import type { Rule } from '@/lib/screener/types'
import en from '@/lib/screener/data/strings.en.json'
import es from '@/lib/screener/data/strings.es.json'
import rules from '@/lib/screener/rules.data.json'
import { t } from '@/lib/screener/strings'

describe('strings', () => {
  it('every EN key exists in ES and vice versa', () => {
    expect(Object.keys(es).toSorted()).toEqual(Object.keys(en).toSorted())
  })
  it('no empty ES values', () => {
    for (const [k, v] of Object.entries(es)) expect(v, k).not.toBe('')
  })
  it('t() interpolates params', () => {
    expect(
      t('en', 'reason.under-limit', { income: 4800, limit: 5360, household: 4 })
    ).toContain('$5,360')
  })
  it('t() renders the expedited-CalFresh dollars from noteParams', () => {
    const rendered = t('en', 'note.expedited-3-day', {
      limitExpedited: 150,
      limitLiquid: 100
    })
    expect(rendered).toContain('$150')
    expect(rendered).toContain('$100')
    expect(rendered).not.toContain('{')
  })
  it('every referenced key is defined: note.* from rules, reason.* from evaluate', () => {
    const noteKeys = (rules as Rule[])
      .flatMap((r) => r.test.specialNotes ?? [])
      .map((k) => `note.${k}`)
    // per-rule proxy/rescue reason keys are data-driven — derive from corpus
    const proxyKeys = (rules as Rule[])
      .flatMap((r) => [r.test.proxyReasonKey, r.test.overLimitRescue])
      .filter((k): k is string => k !== undefined)
    // the reason keys evaluate.ts emits — extend when the evaluator grows
    const reasonKeys = [
      'reason.under-limit',
      'reason.unlock',
      'reason.age',
      'reason.universal',
      'reason.senior-net-test',
      'reason.flag-match',
      'reason.waitlist-closed'
    ]
    const enKeys = new Set(Object.keys(en))
    const esKeys = new Set(Object.keys(es))
    for (const key of [...noteKeys, ...proxyKeys, ...reasonKeys]) {
      expect(enKeys.has(key), `en missing ${key}`).toBe(true)
      expect(esKeys.has(key), `es missing ${key}`).toBe(true)
    }
  })
  it('no literal dollar figures in the string tables — dollars live in rules noteParams (inside the provenance freshness regime)', () => {
    for (const [name, table] of [
      ['en', en],
      ['es', es]
    ] as const) {
      for (const [k, v] of Object.entries(table)) {
        expect(v, `${name}:${k}`).not.toMatch(/\$\s*\d/)
      }
    }
  })
})

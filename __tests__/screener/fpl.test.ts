import { describe, expect, it } from 'vitest'

import { monthlyLimit } from '@/lib/screener/fpl'

describe('monthlyLimit (2026 FPL)', () => {
  it('CLCA 250% household of 1 = $39,900/yr → $3,325/mo', () => {
    expect(monthlyLimit(1, 250)).toBe(3325)
  })
  it('CLCA 250% household of 4 = $82,500/yr → $6,875/mo', () => {
    expect(monthlyLimit(4, 250)).toBe(6875)
  })
  it('CARE 200% with floor 2 = $43,280/yr → $3,606/mo (floored)', () => {
    expect(monthlyLimit(1, 200, 2)).toBe(3606)
  })
  it('scales past 8 with the increment', () => {
    // 9 people at 100%: 55,720 + 5,680 = 61,400 → /12 rounded down
    expect(monthlyLimit(9, 100)).toBe(5116)
  })
})

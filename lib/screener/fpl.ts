import fpl from './data/fpl-2026.json'

/**
 * Monthly gross-income limit for a household at pct% of the 2026 FPL.
 * Conservative: rounds DOWN to the dollar (a borderline user sees the
 * stricter number; the program itself decides the real case).
 */
export function monthlyLimit(
  householdSize: number,
  pct: number,
  householdFloor = 1
): number {
  const size = Math.max(householdSize, householdFloor)
  const annualTable = fpl.annual as Record<string, number>
  const base =
    size <= 8
      ? annualTable[String(size)]!
      : annualTable['8']! + (size - 8) * fpl.increment
  return Math.floor((base * (pct / 100)) / 12)
}

export const FPL_META = {
  year: fpl.year,
  source: fpl.source,
  verifiedAt: fpl.verifiedAt
}

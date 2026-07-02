# Benefits Screener (/qualify) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual, 100% client-side "do I likely qualify?" screener at `/qualify`, whose every number comes from the show's adversarially-verified rules corpus (spec: `docs/superpowers/specs/2026-07-01-benefits-screener-design.md`).

**Architecture:** Static rules JSON (with per-number provenance) + a pure TypeScript evaluator + React components on the site's existing CSS-module/token system. No API routes; answers never leave the browser. New programs enter `rules.data.json` only through research→adversarial-verification agent waves.

**Tech Stack:** Next.js Pages Router (existing), React 19, TypeScript, CSS Modules with `--te-*` tokens, vitest (new devDep) wired into the existing `pnpm test` (`run-p test:*`).

**Spec delta (documented refinement):** rules carry explicit verified per-household `limitsMonthly` tables when the corpus has them (preferred); `incomePctFPL` × `fpl-2026.json` is the computed fallback, with `householdFloor` support (CARE/FERA treat households of 1 as 2). Verified explicit numbers always beat computed ones.

**Branch rule:** ALL tasks happen on `feat/benefits-screener`. Never push `master` (auto-deploys production). Finish with a draft PR for JP.

---

### Task 0: Branch + vitest tooling

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `vitest.config.ts`
- Create: `__tests__/screener/smoke.test.ts`

- [ ] **Step 1: Branch**

```bash
cd ~/Projects/techempower && git checkout -b feat/benefits-screener
```

- [ ] **Step 2: Install vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: { include: ['__tests__/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname) } }
})
```

- [ ] **Step 4: Add script to `package.json`** — in `"scripts"`, add (alongside existing `test:*` entries; `"test": "run-p test:*"` already fans out):

```json
"test:unit": "vitest run"
```

- [ ] **Step 5: Write smoke test `__tests__/screener/smoke.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

describe('vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run** `pnpm test:unit` — Expected: `1 passed`. Then `pnpm test` — Expected: prettier ✓, eslint ✓, vitest ✓ (prettier may demand formatting of the new files: run `pnpm prettier --write vitest.config.ts __tests__` if it complains, rerun).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts __tests__/screener/smoke.test.ts
git commit -m "chore(screener): vitest wired into pnpm test"
```

---

### Task 1: Types

**Files:**
- Create: `lib/screener/types.ts`

- [ ] **Step 1: Create `lib/screener/types.ts`** (types are exercised by every later test; no standalone runtime test)

```ts
export type Lang = 'en' | 'es'

export type Jurisdiction = 'federal' | 'CA' | 'nevada-county'

export type Category =
  | 'food'
  | 'health'
  | 'utilities'
  | 'housing'
  | 'transport'
  | 'money'
  | 'legal'
  | 'devices'

export type ProgramStatus = 'open' | 'waitlist-closed' | 'seasonal' | 'check-first'

export type Bucket = 'strong' | 'likely' | 'worthAsking' | 'notNow'

/** Enrollment flags a user can already have (categorical unlocks). */
export type Enrollment = 'medi-cal' | 'calfresh' | 'ssi' | 'calworks' | 'wic'

/** Situational flags from the form. */
export type SituationFlag =
  | 'renter'
  | 'homeowner'
  | 'pge-customer'
  | 'nid-water'
  | 'has-vehicle'
  | 'failed-smog'

export interface AgeBandCounts {
  under5: number
  age5to17: number
  age18to59: number
  age60plus: number
  age80plus: number // subset of age60plus
}

export interface Answers {
  householdSize: number
  incomeMonthlyGross: number // annual÷12 done in the form layer
  county: 'nevada' | 'other-ca'
  ages: AgeBandCounts
  flags: SituationFlag[]
  enrolled: Enrollment[]
}

export interface IncomeTest {
  /** Verified per-household monthly gross limits. Keys "1".."8" + "increment". Preferred. */
  limitsMonthly?: Record<string, number>
  /** Fallback: percent of FPL (fpl-2026.json), scaled to household. */
  incomePctFPL?: number
  /** Treat households smaller than this as this size (CARE/FERA floor of 2). */
  householdFloor?: number
}

export interface RuleTest extends IncomeTest {
  /** At least one household member in any of these bands qualifies the age dimension. */
  ageAnyMin?: number // e.g. 60, 80; checked against ages bands
  ageAnyMax?: number // e.g. 4 (under 5), 17 (kids)
  flagsAll?: SituationFlag[]
  categoricalUnlocks?: Enrollment[]
  /** Everyone passes (e.g. CA universal school meals w/ kids). Income ignored. */
  universal?: boolean
  /** Keys into strings for nuance rows rendered as Worth-Asking footnotes. */
  specialNotes?: string[]
}

export interface Provenance {
  claim: string
  source: string
  verifiedAt: string // YYYY-MM-DD
  via: string
}

export interface Rule {
  id: string
  jurisdiction: Jurisdiction
  category: Category
  status: ProgramStatus
  test: RuleTest
  /** For reason strings, e.g. { "1": 2610, "4": 5360, "increment": 918 } (monthly $). */
  thresholdsDisplay?: Record<string, number>
  name: Record<Lang, string>
  value: Record<Lang, string>
  apply: { url?: string; phone?: string; local?: string }
  provenance: Provenance[]
  boundaryMarginPct?: number // default 10
}

export interface Reason {
  key: string
  params?: Record<string, string | number>
}

export interface Verdict {
  ruleId: string
  bucket: Bucket
  reasons: Reason[]
  notes: string[] // specialNotes keys that apply
}

export interface EvaluationResult {
  strong: Verdict[]
  likely: Verdict[]
  worthAsking: Verdict[]
  notNow: Verdict[]
}
```

- [ ] **Step 2: Typecheck** — `pnpm exec tsc --noEmit` — Expected: no new errors (repo baseline may emit existing warnings; only fail on errors in `lib/screener/`).

- [ ] **Step 3: Commit** — `git add lib/screener/types.ts && git commit -m "feat(screener): domain types"`

---

### Task 2: FPL table + income math

**Files:**
- Create: `lib/screener/data/fpl-2026.json`
- Create: `lib/screener/fpl.ts`
- Test: `__tests__/screener/fpl.test.ts`

- [ ] **Step 1: Write the failing test `__tests__/screener/fpl.test.ts`**

```ts
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
```

- [ ] **Step 2: Run** `pnpm test:unit` — Expected: FAIL (`Cannot find module '@/lib/screener/fpl'`).

- [ ] **Step 3: Create `lib/screener/data/fpl-2026.json`** (2026 HHS guidelines, 48 states — the same table the WIC verifier cross-checked: 185% of these = $29,526/1p and $61,050/4p)

```json
{
  "year": 2026,
  "annual": { "1": 15960, "2": 21640, "3": 27320, "4": 33000, "5": 38680, "6": 44360, "7": 50040, "8": 55720 },
  "increment": 5680,
  "source": "https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines",
  "verifiedAt": "2026-07-01",
  "via": "cross-checked against Ep3 WIC verification (185% = $29,526/1p, $61,050/4p) and Ep4 CLCA verification (250% = $39,900/1p, $82,500/4p)"
}
```

- [ ] **Step 4: Create `lib/screener/fpl.ts`**

```ts
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
      ? annualTable[String(size)]
      : annualTable['8'] + (size - 8) * fpl.increment
  return Math.floor((base * (pct / 100)) / 12)
}

export const FPL_META = {
  year: fpl.year,
  source: fpl.source,
  verifiedAt: fpl.verifiedAt
}
```

- [ ] **Step 5: Run** `pnpm test:unit` — Expected: 4 passed (+smoke).

- [ ] **Step 6: Commit** — `git add lib/screener/fpl.ts lib/screener/data/fpl-2026.json __tests__/screener/fpl.test.ts && git commit -m "feat(screener): 2026 FPL table + conservative monthly-limit math"`

---

### Task 3: Rules validator (schema + provenance + freshness)

**Files:**
- Create: `lib/screener/validateRules.ts`
- Test: `__tests__/screener/validateRules.test.ts`

- [ ] **Step 1: Failing test `__tests__/screener/validateRules.test.ts`**

```ts
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
    { claim: 'income', source: 'https://example.org', verifiedAt: '2026-07-01', via: 'test' }
  ]
}

describe('validateRules', () => {
  it('accepts a valid rule', () => {
    expect(validateRules([good], new Date('2026-07-02'))).toEqual([])
  })
  it('rejects missing provenance', () => {
    const bad = { ...good, provenance: [] }
    expect(validateRules([bad], new Date('2026-07-02'))[0]).toMatch(/provenance/)
  })
  it('rejects stale provenance (>120 days)', () => {
    const stale = {
      ...good,
      provenance: [{ ...good.provenance[0], verifiedAt: '2026-01-01' }]
    }
    expect(validateRules([stale], new Date('2026-07-02'))[0]).toMatch(/stale/)
  })
  it('rejects a rule with no eligibility dimension at all', () => {
    const dimless = { ...good, test: {} }
    expect(validateRules([dimless], new Date('2026-07-02'))[0]).toMatch(/dimension/)
  })
  it('rejects missing Spanish strings', () => {
    const noEs = { ...good, name: { en: 'X', es: '' } }
    expect(validateRules([noEs], new Date('2026-07-02'))[0]).toMatch(/es/)
  })
})
```

- [ ] **Step 2: Run** `pnpm test:unit` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/screener/validateRules.ts`**

```ts
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
      if (Number.isNaN(age)) problems.push(`${where}: bad verifiedAt "${p.verifiedAt}"`)
      else if (age > MAX_AGE_DAYS)
        problems.push(`${where}: stale provenance "${p.claim}" (${Math.floor(age)}d old)`)
      if (!p.source.startsWith('http')) problems.push(`${where}: provenance source must be a URL`)
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
    if (!r.apply.url && !r.apply.phone) problems.push(`${where}: apply needs url or phone`)
  }
  return problems
}
```

- [ ] **Step 4: Run** `pnpm test:unit` — Expected: all pass.

- [ ] **Step 5: Commit** — `git add lib/screener/validateRules.ts __tests__/screener/validateRules.test.ts && git commit -m "feat(screener): rules validator (schema, provenance, 120d freshness, bilingual)"`

---

### Task 4: Wave-0 rules data (the verified season corpus)

**Files:**
- Create: `lib/screener/rules.data.json`
- Test: `__tests__/screener/rules.data.test.ts`

- [ ] **Step 1: Failing test `__tests__/screener/rules.data.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

import rules from '@/lib/screener/rules.data.json'
import type { Rule } from '@/lib/screener/types'
import { validateRules } from '@/lib/screener/validateRules'

describe('rules.data.json', () => {
  it('validates clean against the live clock', () => {
    expect(validateRules(rules as Rule[], new Date())).toEqual([])
  })
  it('contains the wave-0 season corpus', () => {
    const ids = new Set((rules as Rule[]).map((r) => r.id))
    for (const id of [
      'calfresh', 'wic', 'lifeline-ca', 'care', 'fera', 'liheap', 'esa',
      'nid-lira', 'clca', 'bar-cap-repair', 'bar-retirement',
      'bus-youth-free', 'bus-golden-ticket', 'bus-low-income-pass',
      'medical-baseline', 'freed-equipment', 'lsnc-legal'
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL (file missing).

- [ ] **Step 3: Create `lib/screener/rules.data.json`** with the 17 wave-0 entries. Every number below is from the season fact-check corpus (`show/ep{2,3,4,5}/fact-check-full-report.json`); keep provenance `via` strings pointing at the wave. Full content (abridge NOTHING when implementing — this is the complete file):

```jsonc
// NOTE for implementer: JSON file must be plain JSON (no comments). The
// entries below are complete; strip these guide comments when writing.
[
  {
    "id": "calfresh", "jurisdiction": "CA", "category": "food", "status": "open",
    "test": {
      "limitsMonthly": { "1": 2610, "2": 3526, "3": 4442, "4": 5360, "5": 6276, "6": 7192, "7": 8110, "8": 9026, "increment": 918 },
      "categoricalUnlocks": ["ssi", "calworks"],
      "specialNotes": ["senior-net-test", "student-rules", "expedited-3-day"]
    },
    "thresholdsDisplay": { "1": 2610, "4": 5360 },
    "name": { "en": "CalFresh (grocery money / SNAP)", "es": "CalFresh (dinero para comida / SNAP)" },
    "value": { "en": "Up to $298/mo (1 person) or $994/mo (family of 4) on an EBT card", "es": "Hasta $298/mes (1 persona) o $994/mes (familia de 4) en una tarjeta EBT" },
    "apply": { "url": "https://benefitscal.com", "phone": "1-877-847-3663", "local": "Nevada County DSS 530-265-1340 · Nevada City or Truckee offices" },
    "provenance": [
      { "claim": "200% FPL gross limits FFY2026", "source": "https://calfresh.dss.ca.gov/food/eligibility/index.html", "verifiedAt": "2026-07-01", "via": "ep3 wave: cf-mechanics-income (ACIN I-46-25)" },
      { "claim": "max/min allotments FY2026", "source": "https://www.usda.gov/sites/default/files/guidance-documents/fns.snap-cola-fy26memo.pdf", "verifiedAt": "2026-07-01", "via": "ep3 wave: cf-amounts (primary PDF)" },
      { "claim": "SSI eligible since 2019", "source": "https://www.cdss.ca.gov/inforesources/calfresh/supplemental-security-income", "verifiedAt": "2026-07-01", "via": "ep3 wave: cf-ssi-seniors" }
    ]
  },
  {
    "id": "wic", "jurisdiction": "CA", "category": "food", "status": "open",
    "test": {
      "limitsMonthly": { "1": 2460, "2": 3336, "3": 4212, "4": 5087, "5": 5963, "6": 6839, "7": 7714, "8": 8590, "increment": 876 },
      "ageAnyMax": 4,
      "categoricalUnlocks": ["medi-cal", "calfresh", "calworks"],
      "specialNotes": ["wic-caregivers", "wic-pregnant"]
    },
    "thresholdsDisplay": { "1": 2460, "4": 5087 },
    "name": { "en": "WIC (food money for pregnancy + kids under 5)", "es": "WIC (dinero para alimentos: embarazo y niños menores de 5)" },
    "value": { "en": "$26/mo produce money per child (1-5), $48-52 while pregnant/breastfeeding, plus healthy staples", "es": "$26/mes en frutas y verduras por niño (1-5), $48-52 durante el embarazo/lactancia, más alimentos básicos" },
    "apply": { "url": "https://myfamily.wic.ca.gov", "phone": "1-800-852-5770", "local": "Grass Valley 530-265-1454 · Truckee 530-582-7814" },
    "provenance": [
      { "claim": "185% FPL table eff. 2026-05-01→2027-06-30 ($29,526/1p, $61,050/4p annual → monthly floor)", "source": "https://myfamily.wic.ca.gov/Home/AmIEligible", "verifiedAt": "2026-07-01", "via": "ep3 wave: wic-eligibility (CDPH WPPM 980-1060)" },
      { "claim": "CVB amounts Apr-2026", "source": "https://myfamily.wic.ca.gov/Home/FruitsVegBenefits", "verifiedAt": "2026-07-01", "via": "ep3 wave: wic-benefits" }
    ]
  },
  {
    "id": "lifeline-ca", "jurisdiction": "CA", "category": "utilities", "status": "open",
    "test": {
      "limitsMonthly": { "1": 2050, "2": 2050, "3": 2358, "4": 4233, "increment": 725 },
      "householdFloor": 2,
      "categoricalUnlocks": ["medi-cal", "calfresh", "ssi", "wic"],
      "specialNotes": ["lifeline-two-apps"]
    },
    "thresholdsDisplay": { "1": 2050, "4": 4233 },
    "name": { "en": "Free/discount phone service (federal Lifeline + CA LifeLine)", "es": "Servicio telefónico gratis o con descuento (Lifeline federal + CA LifeLine)" },
    "value": { "en": "Up to ~$28/mo combined discounts — free phone plans exist from participating carriers", "es": "Hasta ~$28/mes en descuentos combinados — hay planes gratis con operadores participantes" },
    "apply": { "url": "https://www.californialifeline.com", "phone": "califone providers via site" },
    "provenance": [
      { "claim": "CA LifeLine income $24,600/1-2p, $50,800/4p annual (thru 2027-05-31) → monthly floors", "source": "https://www.cpuc.ca.gov/consumer-support/financial-assistance-savings-and-discounts/lifeline/california-lifeline-eligibility", "verifiedAt": "2026-06-29", "via": "ep2 wave + week-of recheck" },
      { "claim": "$9.25 federal + up to $19 CA stack", "source": "https://www.cpuc.ca.gov/-/media/cpuc-website/divisions/communications-division/documents/lifeline/lifeline-stat-sheet-051126.pdf", "verifiedAt": "2026-07-01", "via": "ep2 final pre-shoot sweep" }
    ]
  },
  {
    "id": "care", "jurisdiction": "CA", "category": "utilities", "status": "open",
    "test": {
      "incomePctFPL": 200, "householdFloor": 2,
      "flagsAll": ["pge-customer"],
      "categoricalUnlocks": ["medi-cal", "calfresh", "ssi", "wic", "calworks"]
    },
    "thresholdsDisplay": { "2": 3606, "4": 5500 },
    "name": { "en": "CARE (20%+ off PG&E, every month)", "es": "CARE (20%+ de descuento en PG&E, cada mes)" },
    "value": { "en": "20%+ off gas and ~30-35% off electric, permanently while eligible", "es": "20%+ de descuento en gas y ~30-35% en electricidad, de forma permanente mientras califique" },
    "apply": { "url": "https://www.pge.com/carefera", "phone": "1-877-660-6789" },
    "provenance": [
      { "claim": "200% FPG tables eff. 2026-06-01→2027-05-31 ($43,280/1-2p, $66,000/4p annual)", "source": "https://www.pge.com/en/account/billing-and-assistance/financial-assistance/california-alternate-rates-for-energy-program.html", "verifiedAt": "2026-07-01", "via": "ep4 wave: care-fera" }
    ]
  },
  {
    "id": "fera", "jurisdiction": "CA", "category": "utilities", "status": "open",
    "test": { "incomePctFPL": 250, "householdFloor": 2, "flagsAll": ["pge-customer"] },
    "thresholdsDisplay": { "2": 4508, "4": 6875 },
    "name": { "en": "FERA (18% off PG&E electric)", "es": "FERA (18% de descuento en electricidad PG&E)" },
    "value": { "en": "~18% off the electric side (~$45/mo typical) if you make a bit too much for CARE", "es": "~18% de descuento en electricidad (~$45/mes típico) si gana un poco más del límite de CARE" },
    "apply": { "url": "https://www.pge.com/carefera", "phone": "1-877-660-6789" },
    "provenance": [
      { "claim": "250% FPG; SB1130 opened 1-2p households; one application routes CARE/FERA", "source": "https://www.pge.com/en/account/billing-and-assistance/financial-assistance/family-electric-rate-assistance-program.html", "verifiedAt": "2026-07-01", "via": "ep4 wave: care-fera" }
    ]
  },
  {
    "id": "liheap", "jurisdiction": "federal", "category": "utilities", "status": "check-first",
    "test": { "limitsMonthly": { "1": 2916, "2": 3813, "3": 4711, "4": 5608, "increment": 897 } },
    "thresholdsDisplay": { "4": 5608 },
    "name": { "en": "LIHEAP (heating-bill help — covers propane, wood, oil)", "es": "LIHEAP (ayuda con calefacción — incluye propano, leña y petróleo)" },
    "value": { "en": "Up to $1,500 once a year + crisis help with shut-off notices; never repaid", "es": "Hasta $1,500 una vez al año + ayuda de crisis ante avisos de corte; no se devuelve" },
    "apply": { "phone": "Project GO 1-888-524-5705 (press 2 for Nevada County — call at 9am, ~40 calls/day)", "url": "https://csd.ca.gov" },
    "provenance": [
      { "claim": "FFY2026 max $1,500 + crisis; CA monthly cap $6,407.16/4p state ceiling, local matrix lower — table uses CSD 60% SMI figures", "source": "https://www.csd.ca.gov/Pages/LIHEAPProgram.aspx", "verifiedAt": "2026-07-01", "via": "ep4 wave: amp-liheap (State Plan §9)" },
      { "claim": "Project GO = Nevada County agency", "source": "https://www.projectgoinc.org", "verifiedAt": "2026-07-01", "via": "ep4 energy brief" }
    ]
  },
  {
    "id": "esa", "jurisdiction": "CA", "category": "utilities", "status": "open",
    "test": { "incomePctFPL": 200, "householdFloor": 2, "flagsAll": ["pge-customer"], "categoricalUnlocks": ["medi-cal", "calfresh", "ssi"] },
    "name": { "en": "Free home energy upgrades (ESA)", "es": "Mejoras de energía gratis para el hogar (ESA)" },
    "value": { "en": "Free insulation, LEDs, weatherstripping — sometimes fridge/furnace help; renters welcome with landlord OK", "es": "Aislamiento, focos LED y sellado gratis — a veces refrigerador/calefacción; inquilinos con permiso del dueño" },
    "apply": { "url": "https://www.pge.com/esa" },
    "provenance": [
      { "claim": "measures + renters + home 5+ yrs; income aligned to CARE/FERA", "source": "https://www.pge.com/en/account/billing-and-assistance/financial-assistance/energy-savings-assistance-program.html", "verifiedAt": "2026-07-01", "via": "ep4 wave: esa-wap" }
    ]
  },
  {
    "id": "nid-lira", "jurisdiction": "nevada-county", "category": "utilities", "status": "open",
    "test": { "flagsAll": ["nid-water"], "categoricalUnlocks": ["medi-cal", "ssi"], "specialNotes": ["nid-care-chain"] },
    "name": { "en": "NID water-bill discount (LIRA)", "es": "Descuento en la factura de agua NID (LIRA)" },
    "value": { "en": "Flat $9.50/month off treated (drinking) water — one yearly application", "es": "Descuento fijo de $9.50/mes en agua potable — una solicitud al año" },
    "apply": { "phone": "530-273-6185" },
    "provenance": [
      { "claim": "flat $9.50/mo, treated-water residential, qualify via Medi-Cal A&B/SSI/CARE/BIA-GA", "source": "https://nidwater.specialdistrict.org/files/21a126b95/LIRA+App.pdf", "verifiedAt": "2026-07-01", "via": "ep4 gap-fill audit (application PDF) + ep4 energy addendum" }
    ]
  },
  {
    "id": "clca", "jurisdiction": "CA", "category": "transport", "status": "open",
    "test": { "incomePctFPL": 250, "flagsAll": ["has-vehicle"], "specialNotes": ["clca-liability-only"] },
    "thresholdsDisplay": { "1": 3325, "4": 6875 },
    "name": { "en": "CA Low Cost Auto Insurance ($199/yr in Nevada County)", "es": "Seguro de auto de bajo costo de CA ($199/año en el condado de Nevada)" },
    "value": { "en": "A year of liability coverage from $199 (Nevada County base) — car ≤$25k, valid CA license", "es": "Un año de cobertura de responsabilidad desde $199 (base del condado) — auto ≤$25k, licencia de CA vigente" },
    "apply": { "url": "https://www.mylowcostauto.com", "phone": "1-866-602-8861" },
    "provenance": [
      { "claim": "250% FPL ($39,900/1p, $82,500/4p), $199 Nevada County base, legal via Veh. Code §16056.1 carve-out", "source": "https://www.mylowcostauto.com", "verifiedAt": "2026-07-01", "via": "ep4 wave: clca" }
    ]
  },
  {
    "id": "bar-cap-repair", "jurisdiction": "CA", "category": "transport", "status": "open",
    "test": { "limitsMonthly": { "1": 2992, "2": 4041, "3": 5091, "4": 6187, "increment": 1008 }, "flagsAll": ["has-vehicle", "failed-smog"] },
    "thresholdsDisplay": { "1": 2992, "4": 6187 },
    "name": { "en": "Smog-repair help (BAR CAP, up to $1,450)", "es": "Ayuda para reparación de smog (BAR CAP, hasta $1,450)" },
    "value": { "en": "Up to $1,450 toward emissions repairs after a failed smog check — you pay at least 20%", "es": "Hasta $1,450 para reparaciones tras reprobar el smog — usted paga al menos 20%" },
    "apply": { "url": "https://www.bar.ca.gov/cap" },
    "provenance": [
      { "claim": "225% FPL 2026 table ($35,910/1p, $74,250/4p annual), ≥20% copay, MY1996+", "source": "https://www.bar.ca.gov/consumer/consumer-assistance-program", "verifiedAt": "2026-07-01", "via": "ep4 wave: car-bar (live 2026 table)" }
    ]
  },
  {
    "id": "bar-retirement", "jurisdiction": "CA", "category": "transport", "status": "open",
    "test": { "flagsAll": ["has-vehicle"], "specialNotes": ["retirement-failed-smog-tier"] },
    "name": { "en": "Vehicle retirement (the state buys your car)", "es": "Retiro de vehículo (el estado le compra su auto)" },
    "value": { "en": "$1,350 if it failed smog (no income test) — up to $2,000 income-qualified even if it passed", "es": "$1,350 si reprobó el smog (sin prueba de ingresos) — hasta $2,000 con ingresos calificados aunque haya pasado" },
    "apply": { "url": "https://www.bar.ca.gov/cap" },
    "provenance": [
      { "claim": "$1,350 failed-smog tier / $2,000 ≤225% FPL; FY funds from Jul 1 2026", "source": "https://www.bar.ca.gov/consumer/consumer-assistance-program", "verifiedAt": "2026-07-01", "via": "ep4 wave: car-bar" }
    ]
  },
  {
    "id": "bus-youth-free", "jurisdiction": "nevada-county", "category": "transport", "status": "open",
    "test": { "ageAnyMax": 17, "universal": false },
    "name": { "en": "Kids & teens ride the bus FREE (Nevada County Connects)", "es": "Niños y adolescentes viajan GRATIS en el autobús (Nevada County Connects)" },
    "value": { "en": "Everyone 17 and under rides free since Nov 2025 — no paperwork", "es": "Todos los menores de 18 viajan gratis desde nov 2025 — sin trámites" },
    "apply": { "phone": "530-477-0103" },
    "provenance": [
      { "claim": "youth ≤17 free since 2025-11-01", "source": "https://www.nevadacountyca.gov (transit pages)", "verifiedAt": "2026-07-01", "via": "ep4 wave: transit-west" }
    ]
  },
  {
    "id": "bus-golden-ticket", "jurisdiction": "nevada-county", "category": "transport", "status": "open",
    "test": { "ageAnyMin": 80 },
    "name": { "en": "Golden Ticket — free bus for life at 80+", "es": "Golden Ticket — autobús gratis de por vida a los 80+" },
    "value": { "en": "Lifetime free rides on all regular routes; proof of age is the whole application", "es": "Viajes gratis de por vida en rutas regulares; solo se requiere comprobante de edad" },
    "apply": { "phone": "530-477-0103" },
    "provenance": [
      { "claim": "80+ lifetime fixed-route pass", "source": "https://www.nevadacountyca.gov (transit pages)", "verifiedAt": "2026-07-01", "via": "ep4 wave: transit-west" }
    ]
  },
  {
    "id": "bus-low-income-pass", "jurisdiction": "nevada-county", "category": "transport", "status": "check-first",
    "test": { "incomePctFPL": 200 },
    "name": { "en": "Low-Income Bus Pass (referral)", "es": "Pase de autobús para bajos ingresos (por referencia)" },
    "value": { "en": "Six months of reduced/no-fare riding at a time via FREED, Social Services, or Behavioral Health referral", "es": "Seis meses de tarifa reducida o gratuita mediante referencia de FREED, Servicios Sociales o Salud Conductual" },
    "apply": { "phone": "FREED 530-477-3333 · county DSS 530-265-1340 · or 2-1-1" },
    "provenance": [
      { "claim": "138-200% FPL, 6-month renewable, three referral agencies; 'fully free' pending phone confirm", "source": "https://www.nevadacountyca.gov (transit pages)", "verifiedAt": "2026-07-01", "via": "ep4 wave: transit-west (free-status hedged)" }
    ]
  },
  {
    "id": "medical-baseline", "jurisdiction": "CA", "category": "utilities", "status": "open",
    "test": { "flagsAll": ["pge-customer"], "specialNotes": ["medical-baseline-device"] },
    "name": { "en": "PG&E Medical Baseline (not income-based)", "es": "Medical Baseline de PG&E (no depende de ingresos)" },
    "value": { "en": "Extra power at the lowest rate + early fire-season shutoff warnings if someone relies on a medical device", "es": "Más electricidad a la tarifa más baja + avisos tempranos de cortes si alguien depende de un equipo médico" },
    "apply": { "url": "https://www.pge.com/mblapp" },
    "provenance": [
      { "claim": "medical need not income; MD/NP/PA signs initial enrollment", "source": "https://www.pge.com/en/account/billing-and-assistance/financial-assistance/medical-baseline-program.html", "verifiedAt": "2026-07-01", "via": "ep4 wave: psps" }
    ]
  },
  {
    "id": "freed-equipment", "jurisdiction": "nevada-county", "category": "devices", "status": "open",
    "test": { "specialNotes": ["freed-any-age-disability"], "universal": false, "flagsAll": [], "categoricalUnlocks": [], "ageAnyMin": 60 },
    "name": { "en": "Free medical equipment (FREED reuse)", "es": "Equipo médico gratis (reutilización FREED)" },
    "value": { "en": "Donated wheelchairs, walkers, shower chairs, hospital beds — checked over and free; disability any age or older adults", "es": "Sillas de ruedas, andadores, sillas de ducha, camas de hospital — revisados y gratis; discapacidad a cualquier edad o adultos mayores" },
    "apply": { "phone": "530-477-3333" },
    "provenance": [
      { "claim": "free reuse program, device list, seniors + disabilities", "source": "https://freed.org", "verifiedAt": "2026-07-01", "via": "ep5 wave: freed-lsnc (live contact page)" }
    ]
  },
  {
    "id": "lsnc-legal", "jurisdiction": "CA", "category": "legal", "status": "open",
    "test": { "incomePctFPL": 125, "ageAnyMin": 60, "specialNotes": ["lsnc-senior-soft"] },
    "name": { "en": "Free civil legal aid (LSNC)", "es": "Ayuda legal civil gratuita (LSNC)" },
    "value": { "en": "Evictions, benefits denials, debt, record clearing — free if money's tight; 60+ just call", "es": "Desalojos, negación de beneficios, deudas, limpieza de antecedentes — gratis si el dinero no alcanza; 60+ solo llame" },
    "apply": { "phone": "530-823-7560 · evenings 866-815-5990", "url": "https://lsnc.net" },
    "provenance": [
      { "claim": "Auburn office serves Nevada County; case types; senior program via Area 4 AAA (soft framing)", "source": "https://lsnc.net", "verifiedAt": "2026-07-01", "via": "ep5 wave: freed-lsnc" }
    ]
  }
]
```

**Implementation notes for this task:** (a) age/income dimensions above use OR semantics only where the evaluator defines them (Task 5: income OR unlock; age is a hard gate when `ageAnyMin/Max` present UNLESS `incomePctFPL/limitsMonthly` also present, in which case satisfying EITHER age OR income keeps the program with the weaker bucket — encode `lsnc-legal`/`freed-equipment` accordingly per Task 5's tests). (b) LIHEAP `limitsMonthly` uses CSD's published CA monthly ceilings ($6,407.16/4p family — entered floored). (c) Lifeline table computed monthly-floored from the verified annual figures.

- [ ] **Step 4: Run** `pnpm test:unit` — Expected: both rules tests pass (validator clean, all ids present).

- [ ] **Step 5: Commit** — `git add lib/screener/rules.data.json __tests__/screener/rules.data.test.ts && git commit -m "feat(screener): wave-0 rules — the verified season corpus (17 programs)"`

---

### Task 5: Evaluator (TDD against corpus golden cases)

**Files:**
- Create: `lib/screener/evaluate.ts`
- Test: `__tests__/screener/evaluate.test.ts`

- [ ] **Step 1: Failing golden-case tests `__tests__/screener/evaluate.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

import { evaluate } from '@/lib/screener/evaluate'
import rules from '@/lib/screener/rules.data.json'
import type { Answers, Rule } from '@/lib/screener/types'

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
    const r = evaluate({ ...base, incomeMonthlyGross: 9000, enrolled: ['ssi'] }, R)
    expect(bucketOf(r, 'calfresh')).toBe('strong')
  })
  it('WIC needs a child under 5 (or pregnancy note) — no kid, no WIC', () => {
    const noKid = { ...base, ages: { ...base.ages, under5: 0 } }
    expect(bucketOf(evaluate(noKid, R), 'wic')).toBe('absent')
    expect(bucketOf(evaluate(base, R), 'wic')).toBe('strong')
  })
  it('Medi-Cal enrollment makes WIC strong regardless of income', () => {
    const r = evaluate({ ...base, incomeMonthlyGross: 8000, enrolled: ['medi-cal'] }, R)
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
        ages: { under5: 0, age5to17: 0, age18to59: 1, age60plus: 1, age80plus: 0 }
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
})
```

- [ ] **Step 2: Run** — Expected: FAIL (`evaluate` missing).

- [ ] **Step 3: Implement `lib/screener/evaluate.ts`**

```ts
import { monthlyLimit } from './fpl'
import type {
  Answers,
  Bucket,
  EvaluationResult,
  Reason,
  Rule,
  Verdict
} from './types'

const DEFAULT_MARGIN_PCT = 10

function incomeLimitFor(rule: Rule, householdSize: number): number | null {
  const t = rule.test
  if (t.limitsMonthly) {
    const size = Math.max(householdSize, t.householdFloor ?? 1)
    const table = t.limitsMonthly
    if (table[String(size)] !== undefined) return table[String(size)]
    const increment = table.increment ?? 0
    const known = Object.keys(table)
      .filter((k) => k !== 'increment')
      .map(Number)
    const maxKnown = Math.max(...known)
    return table[String(maxKnown)] + (size - maxKnown) * increment
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
  return order[Math.max(order.indexOf(a), order.indexOf(b))]
}

export function evaluate(answers: Answers, rules: Rule[]): EvaluationResult {
  const out: EvaluationResult = { strong: [], likely: [], worthAsking: [], notNow: [] }

  for (const rule of rules) {
    const t = rule.test
    const reasons: Reason[] = []
    const notes: string[] = [...(t.specialNotes ?? [])]
    let bucket: Bucket = 'strong'
    let include = false

    // hard flag gates — program simply doesn't apply without them
    if (t.flagsAll?.length) {
      const missing = t.flagsAll.filter((f) => !answers.flags.includes(f))
      if (missing.length > 0) continue
    }

    const age = agePasses(rule, answers)
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
        reasons.push({
          key: 'reason.under-limit',
          params: { income: answers.incomeMonthlyGross, limit, household: answers.householdSize }
        })
        if (answers.incomeMonthlyGross > limit * (1 - margin))
          bucket = worst(bucket, 'likely') // boundary → never strong
      } else if (
        age === true &&
        notes.some((n) => n === 'senior-net-test') &&
        answers.ages.age60plus > 0
      ) {
        // over gross limit but senior nuance applies — worth asking
        include = true
        bucket = worst(bucket, 'worthAsking')
        reasons.push({ key: 'reason.senior-net-test', params: { limit } })
      }
    }

    // age dimension: gate when it's the rule's ONLY dimension; upgrade otherwise
    if (age !== null) {
      const incomeDimension = limit !== null || t.universal || unlockHit
      if (age && !include && !incomeDimension) {
        include = true
        reasons.push({ key: 'reason.age' })
      } else if (!age && !include) {
        continue // age-gated and no qualifying member
      } else if (!age && include && (t.ageAnyMax !== undefined || t.ageAnyMin !== undefined)) {
        // income passed but required age band absent (e.g., WIC without a child)
        if (t.ageAnyMax !== undefined || t.ageAnyMin !== undefined) continue
      }
    }

    if (!include) continue

    if (rule.status === 'check-first') bucket = worst(bucket, 'worthAsking')
    if (rule.status === 'seasonal') bucket = worst(bucket, 'worthAsking')
    if (rule.status === 'waitlist-closed') bucket = 'notNow'

    const verdict: Verdict = { ruleId: rule.id, bucket, reasons, notes }
    out[bucket].push(verdict)
  }
  return out
}
```

- [ ] **Step 4: Run** `pnpm test:unit` — Expected: all evaluator golden cases pass. Iterate on `evaluate.ts` ONLY (tests are the corpus-derived truth) until green. Known subtlety: WIC "no kid → absent" requires the age-gate branch to `continue` when an `ageAnyMax` rule has income-pass but zero qualifying members — the test locks the behavior.

- [ ] **Step 5: Commit** — `git add lib/screener/evaluate.ts __tests__/screener/evaluate.test.ts && git commit -m "feat(screener): conservative evaluator with corpus golden cases"`

---

### Task 6: Bilingual strings

**Files:**
- Create: `lib/screener/data/strings.en.json`
- Create: `lib/screener/data/strings.es.json`
- Create: `lib/screener/strings.ts`
- Test: `__tests__/screener/strings.test.ts`

- [ ] **Step 1: Failing test `__tests__/screener/strings.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

import en from '@/lib/screener/data/strings.en.json'
import es from '@/lib/screener/data/strings.es.json'
import { t } from '@/lib/screener/strings'

describe('strings', () => {
  it('every EN key exists in ES and vice versa', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })
  it('no empty ES values', () => {
    for (const [k, v] of Object.entries(es)) expect(v, k).not.toBe('')
  })
  it('t() interpolates params', () => {
    expect(
      t('en', 'reason.under-limit', { income: 4800, limit: 5360, household: 4 })
    ).toContain('$5,360')
  })
})
```

- [ ] **Step 2: Run** — FAIL (modules missing).

- [ ] **Step 3: Create the three files.** `strings.ts`:

```ts
import type { Lang } from './types'
import en from './data/strings.en.json'
import es from './data/strings.es.json'

const tables: Record<Lang, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

export function t(
  lang: Lang,
  key: string,
  params: Record<string, string | number> = {}
): string {
  let s = tables[lang][key] ?? tables.en[key] ?? key
  for (const [k, v] of Object.entries(params)) {
    const rendered =
      typeof v === 'number' && /income|limit|amount/.test(k) ? money(v) : String(v)
    s = s.replaceAll(`{${k}}`, rendered)
  }
  return s
}
```

`strings.en.json` — complete v1 key set (ES mirrors every key; ES values below are the working draft that Task 9's verification agent reviews):

```json
{
  "page.title": "Wait — do I qualify? A two-minute check",
  "page.promise": "Your answers never leave your device. Nothing is stored. This is a two-minute estimate, not a decision — the programs decide.",
  "page.verifiedAsOf": "Numbers last verified {date}. Sources listed on every card.",
  "form.householdSize": "How many people live in your household?",
  "form.income": "Household income before taxes (a close guess is fine)",
  "form.income.monthly": "per month",
  "form.income.yearly": "per year",
  "form.ages": "Who's in the household?",
  "form.ages.under5": "Kids under 5",
  "form.ages.age5to17": "Kids 5–17",
  "form.ages.age18to59": "Adults 18–59",
  "form.ages.age60plus": "Adults 60+",
  "form.ages.age80plus": "…of those, 80 or older",
  "form.housing": "Do you rent or own?",
  "form.housing.rent": "Rent",
  "form.housing.own": "Own",
  "form.county": "Where do you live?",
  "form.county.nevada": "Nevada County",
  "form.county.other": "Elsewhere in California",
  "form.flags": "Check any that apply",
  "form.flags.pge": "PG&E is my electric/gas company",
  "form.flags.nid": "NID delivers my home's water",
  "form.flags.vehicle": "There's a car in the household",
  "form.flags.failedSmog": "…and it failed its last smog check",
  "form.enrolled": "Already enrolled in any of these?",
  "form.enrolled.medi-cal": "Medi-Cal",
  "form.enrolled.calfresh": "CalFresh",
  "form.enrolled.ssi": "SSI",
  "form.enrolled.calworks": "CalWORKs",
  "form.enrolled.wic": "WIC",
  "form.submit": "Show me what I likely qualify for",
  "results.strong": "Strong matches — worth applying this week",
  "results.likely": "Likely matches — apply, let the program do the math",
  "results.worthAsking": "Worth asking about",
  "results.notNow": "Not right now — but know the move",
  "results.empty": "We didn't find a strong match from your answers — but screeners miss things. Call 2-1-1: a real person will go deeper, free.",
  "card.apply": "Apply",
  "card.call": "Call",
  "card.local": "Local help",
  "card.source": "Source, verified {date}",
  "card.whyMatch": "Why this matched",
  "reason.under-limit": "A household of {household} at {income}/month is under this program's {limit}/month limit",
  "reason.unlock": "Being enrolled in {program} already passes this program's income test",
  "reason.age": "Someone in your household is in this program's age range",
  "reason.universal": "This one is for everyone in California",
  "reason.senior-net-test": "You're over the {limit} gross limit, BUT households with someone 60+ only face a net-income test — apply and let the county do the real math",
  "note.senior-net-test": "60+ in the home? Only net income counts — ask when you apply.",
  "note.student-rules": "College students have extra rules — work, work-study, or parenting can qualify you.",
  "note.expedited-3-day": "True emergency? Say so — CalFresh has a 3-day expedited track.",
  "note.wic-caregivers": "Dads, grandparents, and foster parents can enroll a child.",
  "note.wic-pregnant": "Pregnant? You qualify as a household of two — enroll as early as you can.",
  "note.lifeline-two-apps": "Since Feb 2026 the federal and California discounts are two separate enrollments — the carrier walks you through both.",
  "note.nid-care-chain": "Getting CARE (above) is itself a ticket to this water discount.",
  "note.clca-liability-only": "Liability-only coverage — it keeps you legal, it doesn't cover your own car.",
  "note.retirement-failed-smog-tier": "The $1,350 no-income-test tier requires a failed smog check; the income-qualified tier doesn't.",
  "note.medical-baseline-device": "For households where someone relies on a powered medical device; a doctor/NP/PA signs the first enrollment.",
  "note.freed-any-age-disability": "Any age with a disability qualifies too — the 60+ box here is just the screener being simple. Call.",
  "note.lsnc-senior-soft": "60 or older? Just call — there's a senior program and intake will tell you what you qualify for.",
  "footer.threeDoors": "Whatever the screener says: 2-1-1 (24/7, English/Spanish) · findhelp.org · our Discord — real people, free.",
  "footer.print": "Print / save my list",
  "lang.toggle": "Español"
}
```

`strings.es.json` — same keys, Spanish working draft (Task 9 verifies). Write complete translations for every key above; e.g.:

```json
{
  "page.title": "¿Y si sí califico? Una revisión de dos minutos",
  "page.promise": "Sus respuestas nunca salen de su dispositivo. No se guarda nada. Esto es un estimado de dos minutos, no una decisión — los programas deciden.",
  "lang.toggle": "English"
}
```

(…complete ALL keys — the completeness test enforces it.)

- [ ] **Step 4: Run** `pnpm test:unit` — Expected: pass (write every ES key).

- [ ] **Step 5: Commit** — `git add lib/screener/strings.ts lib/screener/data/strings.en.json lib/screener/data/strings.es.json __tests__/screener/strings.test.ts && git commit -m "feat(screener): bilingual string tables + t() interpolation"`

---

### Task 7: Components + page

**Files:**
- Create: `components/screener/ScreenerForm.tsx`, `ScreenerResults.tsx`, `ProgramCard.tsx`, `screener.module.css`
- Create: `pages/qualify.tsx`

Follow the homepage component idiom exactly (CSS modules, `--te-*` tokens, semantic sections, `aria-labelledby`). Components are client-side (`'use client'` not needed in Pages Router; use standard function components + `useState`). The form holds all state; on submit calls `evaluate` and passes results down. Language state lives in `pages/qualify.tsx` (`useState<Lang>` initialized from `localStorage.getItem('te-lang')` in a `useEffect`) and threads down as a prop; every rendered string goes through `t(lang, key)` or the rule's `name[lang]`/`value[lang]`.

- [ ] **Step 1: `components/screener/ProgramCard.tsx`** (complete):

```tsx
import type { Lang, Rule, Verdict } from '@/lib/screener/types'
import { t } from '@/lib/screener/strings'

import styles from './screener.module.css'

export function ProgramCard({
  rule,
  verdict,
  lang
}: {
  rule: Rule
  verdict: Verdict
  lang: Lang
}) {
  const newest = rule.provenance.reduce(
    (a, p) => (p.verifiedAt > a ? p.verifiedAt : a),
    rule.provenance[0]?.verifiedAt ?? ''
  )
  return (
    <article className={styles.card} data-bucket={verdict.bucket}>
      <h3 className={styles.cardTitle}>{rule.name[lang]}</h3>
      <p className={styles.cardValue}>{rule.value[lang]}</p>

      <details className={styles.why}>
        <summary>{t(lang, 'card.whyMatch')}</summary>
        <ul>
          {verdict.reasons.map((r) => (
            <li key={r.key}>{t(lang, r.key, r.params)}</li>
          ))}
        </ul>
      </details>

      {verdict.notes.length > 0 && (
        <ul className={styles.notes}>
          {verdict.notes.map((n) => (
            <li key={n}>{t(lang, `note.${n}`)}</li>
          ))}
        </ul>
      )}

      <div className={styles.applyRow}>
        {rule.apply.url && (
          <a className={styles.applyBtn} href={rule.apply.url} target='_blank' rel='noreferrer'>
            {t(lang, 'card.apply')}
          </a>
        )}
        {rule.apply.phone && (
          <span className={styles.phone}>
            {t(lang, 'card.call')}: {rule.apply.phone}
          </span>
        )}
        {rule.apply.local && <span className={styles.local}>{rule.apply.local}</span>}
      </div>

      <footer className={styles.provenance}>
        <a href={rule.provenance[0]?.source} target='_blank' rel='noreferrer'>
          {t(lang, 'card.source', { date: newest })}
        </a>
      </footer>
    </article>
  )
}
```

- [ ] **Step 2: `ScreenerForm.tsx`** — controlled inputs for every `Answers` field per the strings keys above: number input (householdSize 1–12), income amount + monthly/yearly radio (yearly ⇒ `Math.floor(amount/12)`), five age-count steppers, rent/own radio (sets `renter`/`homeowner` flag), county radio, the four situational checkboxes (pge/nid/vehicle/failed-smog — failed-smog only enabled when vehicle checked), five enrolled checkboxes, submit button calling `onSubmit(answers)`. Full code written at implementation following ProgramCard's idiom; all labels via `t()`; every input has an explicit `<label htmlFor>`.

- [ ] **Step 3: `ScreenerResults.tsx`** — receives `EvaluationResult + rules + lang`; renders the four bucket sections (skip empty; `results.empty` fallback when strong+likely are both empty), maps verdicts to `ProgramCard` (lookup rule by id), then the standing-three footer (`footer.threeDoors`) and a print button (`window.print()`).

- [ ] **Step 4: `screener.module.css`** — token-based: cards `background: var(--te-cream)`, borders by bucket (`[data-bucket='strong'] { border-left: 4px solid var(--te-teal-600) }`, likely → amber-600, worthAsking → bark-400, notNow → coral-500), form controls ≥44px touch targets, `@media print` hides the form + chrome and prints results full-width, dark-mode inherits the site's `.dark-mode` token remaps automatically (only use tokens).

- [ ] **Step 5: `pages/qualify.tsx`** — Head/meta modeled on `pages/index.tsx` (title `Do I qualify? — 2-minute benefits check · TechEMPOWER.org`); promise banner (`page.promise`); `verifiedAsOf` footer computed as the OLDEST `verifiedAt` across `rules.data.json` at module scope; EN/ES toggle button persisting `te-lang`; composes Form + Results.

- [ ] **Step 6: Manual run** — `pnpm dev`, open `http://localhost:3000/qualify`: fill HH4/$4,800/kid-under-5/PG&E → expect CalFresh+WIC+CARE strong, LIHEAP worth-asking; toggle ES → full translation; print preview shows results only. Fix until true.

- [ ] **Step 7: Gates** — `pnpm test` (prettier+eslint+vitest) green; `pnpm build` succeeds.

- [ ] **Step 8: Commit** — `git add components/screener pages/qualify.tsx && git commit -m "feat(screener): /qualify page, form, results, program cards (EN/ES)"`

---

### Task 8: Wave-1 programs (research → adversarial verification → rules entries)

**Files:**
- Modify: `lib/screener/rules.data.json` (append verified entries)
- Modify: `__tests__/screener/evaluate.test.ts` (golden cases for eitc + medi-cal + section-8)

Dispatch **dreamteam agents via the Agent tool** (JP directive: dreamteam types, not headless workers), one research+one verifier per program, exactly like the show waves. Programs: `eitc-caleitc` (money), `medi-cal` (health), `covered-ca` (health, check-first), `section-8` (housing — status: waitlist-closed w/ honest next move), `calworks` (money), `ssi-ssp` (money, worthAsking-only complexity), `county-general-assistance` (money), `school-meals-universal` (food, `universal: true` w/ kids), `medicare-savings` (health, 60+).

- [ ] **Step 1:** Research agent per program (dreamteam:nebula, prompt = show pipeline research template + "output a DRAFT rules.data.json entry with provenance").
- [ ] **Step 2:** Adversarial verifier per draft entry (dreamteam:lucid, prompt = refute every number against primary sources; output verdict + corrected entry).
- [ ] **Step 3:** Merge ONLY verified entries; run `pnpm test:unit` (validator enforces provenance/freshness); add golden cases: EITC HH4 income bands, Medi-Cal 138% adult cut, Section 8 renders in `notNow` with reason `reason.waitlist-closed` (add key to both string files).
- [ ] **Step 4:** Commit per merged batch — `git commit -m "feat(screener): wave-1 verified rules — <ids>"`.

---

### Task 9: Spanish verification pass

**Files:**
- Modify: `lib/screener/data/strings.es.json`, `rules.data.json` (es fields)

- [ ] **Step 1:** Dispatch a dreamteam:lucid agent: "Review every `es` string in strings.es.json + rules.data.json against its EN counterpart and the program's official Spanish terminology (Medi-Cal/CalFresh/WIC use official ES names; CPUC/CDSS publish ES pages — cite them). Output a corrections list old→new; flag any eligibility-meaning drift as CRITICAL."
- [ ] **Step 2:** Apply corrections; `pnpm test:unit` (completeness stays green).
- [ ] **Step 3:** Commit — `git commit -m "fix(screener): verified Spanish strings (official program terminology)"`.

---

### Task 10: Entry points + final gates

**Files:**
- Modify: `components/homepage/Hero.tsx` (add `/qualify` CTA into the existing `ctaRow`)
- Modify: `CLAUDE.md` (routes list + screener dir), `docs` note

- [ ] **Step 1:** Hero CTA: add alongside the existing secondary link:

```tsx
<Link href='/qualify' className={styles.ctaSecondary}>
  2-minute check: what do I qualify for?
</Link>
```

- [ ] **Step 2:** CLAUDE.md: add `/qualify` to Content Architecture + `lib/screener/` to Key Files.
- [ ] **Step 3:** Full gates: `pnpm test` green, `pnpm build` green, `pnpm dev` manual pass (EN+ES, print, empty-result path, keyboard-only walkthrough).
- [ ] **Step 4:** Push branch + open DRAFT PR titled `feat: /qualify benefits screener (client-side, verified rules corpus)` — body: spec link, screenshots, the wave-1 verification summaries, and the explicit note **do not merge — JP reviews; merge deploys production**.
- [ ] **Step 5:** `git checkout master` (house rule: never end on a feature branch).

---

## Self-review (done at write time)

- **Spec coverage:** privacy promise (T7 page banner) ✓ · provenance+freshness CI (T3/T4) ✓ · conservative buckets/boundary (T5) ✓ · categorical unlocks (T4/T5) ✓ · bilingual + verification (T6/T9) ✓ · wave-1 via verified agents (T8) ✓ · status-aware Section 8 (T8) ✓ · entry points (T10) ✓ · never-push-master (T0/T10) ✓ · print (T7) ✓ · standing three (T7) ✓.
- **Placeholders:** Form/Results component internals are specified by behavior + idiom reference rather than full listings (deliberate: ProgramCard shows the complete idiom; duplicating 3 more components verbatim adds bulk, not information — the executing agent has the pattern + strings + types). All logic/code with any subtlety (types, fpl, validator, evaluator, strings, card, rules data) is complete.
- **Type consistency:** `evaluate(answers, rules)` signature matches tests; `t(lang,key,params)` matches; `limitsMonthly.increment` handled in both validator fixture and evaluator; `Verdict.notes` used by card `note.*` keys — keys exist in strings ✓.

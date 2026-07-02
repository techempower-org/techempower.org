# Benefits Screener ("/qualify") — Design Spec

**Date:** 2026-07-01 · **Status:** approved-in-conversation (JP's four scope answers 2026-07-01 ~22:50 PDT; final design gate open — JP AFK, proceeding on feature branch per full-auto mandate; production launch explicitly gated on JP)
**Owner:** JP / TechEmpower · **Builders:** Claude + dreamteam agents

## What & why

A two-minute, anonymous "do I likely qualify?" screener at **techempower.org/qualify** — the show's thesis ("most people qualify for more than they think") made durable and self-serve. Users answer ~7 questions; we bucket real programs into **Strong match / Likely / Worth asking / Not right now**, each with verified numbers, what-you-get, and exactly how to apply. It is a *screening estimate*, never a determination.

The unique asset: the "Wait, I Qualify?!" season produced an **adversarially fact-checked corpus** of eligibility rules (per-claim primary sources + verified-as-of dates) for ~14 programs. The screener's rules database is built from that corpus and extended by the same verification machine.

## JP's locked decisions (2026-07-01)

1. **Depth:** likely-eligible screener (bucketed guidance + routing; no determinations, no per-program walkthroughs).
2. **Privacy:** 100% client-side. Rules ship as static JSON; all math in the browser; answers never leave the device, never stored, no analytics on answers. This promise is printed on the page.
3. **Scope:** GO BIGGER than the season corpus — but every added program passes the same research → adversarial-verification wave before its numbers ship. No unverified number ever renders.
4. **Language:** bilingual EN/ES **at launch**, with the Spanish strings receiving their own verification pass (translation errors in eligibility wording are a burn risk equal to wrong numbers).

## Architecture (approach A — static rules engine)

```
pages/qualify.tsx                      — route shell (Head/meta/EN-ES state), sections
components/screener/
  ScreenerIntro.tsx(.module.css)       — promise header + start
  ScreenerForm.tsx                     — the ~7 inputs, one screen, big touch targets
  ScreenerResults.tsx                  — bucketed program cards + standing-three footer
  ProgramCard.tsx                      — one program: value line, reasons, apply, source+as-of
lib/screener/
  types.ts                             — Rule, Answers, Verdict, Bucket types
  fpl.ts + data/fpl-2026.json          — single source for all %FPL math (HH 1-8 + increment)
  rules.data.json                      — THE rules database (schema below)
  evaluate.ts                          — pure: (answers, rules, fpl) → buckets w/ reason keys
  strings.ts + data/strings.{en,es}.json — every user-facing string, keyed; ES verified
__tests__/screener/                    — evaluator golden cases + schema + i18n completeness
```

No API routes, no server state, no cookies. The page works identically on Cloudflare Workers SSR and as a fully hydrated client app; income math runs only in `evaluate.ts` in the browser.

## Rules schema (per program entry in `rules.data.json`)

```jsonc
{
  "id": "calfresh",
  "jurisdiction": "CA",                    // federal | CA | nevada-county
  "category": "food",                      // food|health|utilities|housing|transport|money|legal|devices
  "test": {
    "incomePctFPL": 200,                   // gross monthly vs FPL scaled to household, OR null
    "incomeBasis": "gross-monthly",
    "ageAny": null,                        // e.g. [{"min":60}] for senior programs
    "flagsAll": [],                        // e.g. ["pge-customer"], ["nid-water"], ["renter"]
    "categoricalUnlocks": ["medi-cal","ssi","calworks"],  // enrolled-in ⇒ income test passes
    "specialNotes": ["senior-net-test"]    // keys for worthAsking nuances (60+ net-only, etc.)
  },
  "thresholdsDisplay": { "1": 2610, "4": 5360, "increment": 918 }, // for reason strings
  "value": { "en": "up to $298/mo (1 person) or $994 (family of 4)", "es": "…" },
  "apply": { "url": "https://benefitscal.com", "phone": "1-877-847-3663", "local": "Nevada County DSS 530-265-1340" },
  "provenance": [{ "claim": "income-limits", "source": "https://calfresh.dss.ca.gov/…", "verifiedAt": "2026-07-01", "via": "ep3 fact-check wave" }],
  "status": "open",                        // open | waitlist-closed | seasonal | check-first
  "buckets": { "boundaryMarginPct": 10 }   // within 10% of a limit ⇒ demote strong→likely
}
```

**Provenance is load-bearing:** the page footer renders "numbers last verified ___" from the oldest `verifiedAt`; a CI check fails if any entry exceeds 120 days without re-verification, tying screener freshness to the show's week-of rhythm.

## Program set

**Wave 0 — already verified (season corpus, load directly):** CalFresh · WIC · CARE · FERA · LIHEAP (Project GO) · ESA · NID LIRA · CLCA · BAR CAP repair + retirement · Nevada County Connects fares (youth-free / senior half / Golden Ticket 80+ / Low-Income Pass) · Medical Baseline (non-income) · FREED equipment reuse · LSNC legal aid (soft 60+) · Lifeline + CA LifeLine (Ep2 corpus).

**Wave 1 — new, each gets research + adversarial verification before shipping:** federal EITC + CalEITC + Young Child Tax Credit · Medi-Cal (adult/child/pregnancy MAGI tiers) · Covered California subsidy screen · Section 8/HCV (status-aware: RHA list state) · CalWORKs · SSI/SSP · Nevada County General Assistance · CA universal school meals (everyone-qualifies flag) · Medicare Savings Programs (QMB/SLMB) · expedited-CalFresh fast path flag.

Anything failing verification ships as `status: "check-first"` with honest wording or not at all.

## Evaluator behavior (conservatism as spec)

- Income compares **gross monthly** (annual÷12 if user picked yearly) vs `incomePctFPL` × household FPL.
- Within `boundaryMarginPct` of a limit ⇒ max bucket **Likely** (never Strong at a boundary).
- Categorical unlock hit ⇒ Strong for the income dimension, with reason string naming the unlock.
- `specialNotes` (e.g., 60+ net-test, WIC caregiver rule, student rules) surface as *Worth asking* rows or card footnotes — the screener says "ask," it never resolves nuance itself.
- Programs whose flags/age don't apply are omitted (not "denied"); `waitlist-closed` renders in **Not right now** with the honest next move (watch + 211), mirroring Ep4's Section 8 segment.
- Reason strings are assembled from keyed templates in both languages; **no free-text math in components**.

## UX

Single input screen (no multi-step wizard in v1) → results below the fold on submit; earth-tone tokens, Fraunces/DM Sans, dark/light via existing `.dark-mode` system; keyboard + screen-reader labels; print stylesheet for "save my list"; sticky standing-three footer (2-1-1 · findhelp.org · Discord). EN/ES toggle persists via localStorage (`te-lang`), the only thing stored. Entry cards added to homepage + /show + episode descriptions ("take the two-minute check at techempower dot org slash qualify").

## Testing

- **Golden cases from the fact-check corpus:** HH4/$5,360 CalFresh boundary (Likely not Strong), WIC household-of-two trap, SSI⇒CalFresh unlock, 60+ senior-net-test note, NID requires nid-water flag, Golden Ticket at 80, waitlist-closed Section 8 rendering, EITC once verified.
- Schema validation of `rules.data.json` (types + provenance completeness + freshness ≤120d) in `pnpm test`.
- i18n completeness: every EN key has ES; no orphan keys.
- Evaluator is pure ⇒ table-driven unit tests; components smoke-tested via existing lint/type gates.

## Delivery & gates

- All work on **`feat/benefits-screener`**; master (auto-deploy) untouched until JP reviews.
- Build order: scaffolding + evaluator + wave-0 rules → UI → wave-1 research/verification agents run in parallel → ES strings + verification pass → tests green → JP demo → merge + deploy.
- Out of scope v1: accounts, saved results, notifications, non-CA states, benefit amount calculators, analytics.

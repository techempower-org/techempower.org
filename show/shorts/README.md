# "Wait, I Qualify?!" — Shorts

Vertical (9:16) 45–60 second teleprompter scripts, recorded by JP with Candela's
teleprompter/short-recorder. One file = one short.

## Format spec

- **Filename:** `NN-slug.md` (batch order, two digits).
- **Header block:** `# Title`, then one line each:
  - **Est. length** — target 45–60 s ≈ 110–150 spoken words.
  - **Source** — episode + claim ID(s) from that episode's fact-check report or
    verified brief. Every number must trace here.
  - **Freshness** — what expires when, and the re-verify step before recording
    or re-posting.
- **`--- SCRIPT ---`** then spoken text ONLY: plain short lines, dollar figures
  and stats written as spoken ("sixty-six thousand"), no cues, no cards.
- **HOOK in the first sentence** — thumb-stopping, the claim itself.
- **One idea per short.** Adjacent programs get their own short.
- **CTA close** on a subset of: dial 2-1-1 · findhelp dot org · techempower dot
  org + Discord. Program-specific pointers (BenefitsCal, pge.com) may appear in
  the body.
- **No bare acronyms** — every program gets a short plain-language gloss at
  first mention (same rule as the episode scripts).
- **Conservative rounding** — always round toward understating the benefit /
  income limit, never over.

## The verified-sources-only rule

Every factual claim must trace to a claim that PASSED an episode's adversarial
fact-check (or a verified July-2026 Ep4 brief). Never air anything the
fact-checks flagged, hedged, or killed. Standing examples:

- **No Market Match promises** — matching was OFF at Nevada City as of Jul 1,
  2026 ("ask at the booth" only, if mentioned at all).
- **No dead programs** — the $2,000 state e-bike voucher (ended Dec 2025),
  LIHWAP water-bill payments (ended Mar 2024), the federal used-EV credit
  (ended Sep 30, 2025).
- **No unsourceable figures** — e.g. the "$8,000 ESA value"; no "one-third off"
  for the NID water discount (it's a flat $9.50/mo).
- **No KARE** — never passed any wave's verification; nothing traceable in any
  fact-check output. Do not cite.
- **No "free riding" on the Low-Income Pass** — no official source says free;
  the county/Caltrans paperwork calls it a "Fare Subsidy Program." Hedged
  pending the week-of phone check (530-477-0103).
- **Dial-a-ride fares** — west county now has an OFFICIAL $4.00 one-way fee
  (county page /3578, Senior + ADA-certified dial-a-ride); never quote the
  stale third-party $3/$5. Whether $4 covers day-before ADA corridor trips is
  pending the week-of phone check. East county TART Dial-A-Ride is $6 adult /
  $2 senior-disabled — a different service; don't mix them.

Before recording a batch, run each file's **Freshness** line. Shorts are
evergreen on YouTube — expired numbers keep misinforming long after air.

## Recording notes (Candela teleprompter)

- Load the text below `--- SCRIPT ---` only (strip the header block).
- **Practice mode:** use pause-for-me so the prompter waits while rehearsing
  the hook and any dollar figures.
- **Takes:** auto-scroll, paced to land 45–60 s; re-time after any edit
  (~2.5 words/sec).
- Vertical framing; hook must land inside the first ~2 seconds — don't burn
  the open on a greeting.
- **Recording after a short's freshness date?** Re-verify its numbers against
  the file's Source line first — the freshness table below is the quick index.

## Batch 1 (this directory, 01–11)

Sources: Ep1 + Ep3 fact-check reports (`show/ep{1,3}/fact-check-full-report.json`),
Ep4 verified briefs + factcheck JSONs
(`~/.claude/projects/-home-jp/scratch/ep4-home-transpo/`).
QA'd 2026-07-01 against those sources: every figure re-traced; one fix applied
(07: "new name" → 2022 rebrand, per Ep4 transit-west FIX 4).

### Freshness index (verify before recording or re-posting)

| # | File | Load-bearing figures | Re-verify | Hard date |
|---|------|----------------------|-----------|-----------|
| 01 | family-of-four-66k | $33k FPL / $66k double / HUD ~$100k | FPL each Jan; HUD limits each spring | after Jan 2027 |
| 02 | 60-billion-unclaimed | $60B+/yr; 1-in-5 CalFresh (CA); 1-in-5 EITC | annually; entitlement claim if federal law changes | — (durable) |
| 03 | ssi-calfresh-ban-ended | June 2019 (AB 1811) | evergreen; re-scan CDSS on federal food-rule changes | — |
| 04 | wic-not-just-for-moms | HH2 ~$40k ($40,034) | WIC table at myfamily.wic.ca.gov | after Jun 30 2027 |
| 05 | fridge-empty-tonight | no income test / no paperwork | phone-confirm IFM 530-273-8132 + FBNC 530-272-3796 still operating | — (hours omitted by design) |
| 06 | calfresh-3-days | 3 calendar days (expedited) | standing CDSS/USDA policy; re-scan on SNAP changes | — |
| 07 | kids-ride-free | youth 0–17 free (Nov 2025); $1.50/$3.00 | nevadacountyca.gov/2259 (grant-funded, can sunset) | before each posting |
| 08 | golden-ticket-80 | 80+ lifetime free; 65+ half fare | nevadacountyca.gov/2259 | before each posting |
| 09 | care-pge-discount | 20%+ / ~⅓ electric; $43,280 HH1–2 / $66,000 HH4 | CPUC/PG&E table (eff. Jun 1 2026) | after May 31 2027 |
| 10 | nid-water-bill | $9.50/mo fixed | phone-confirm 530-273-6185 ("still $9.50?") | before each posting |
| 11 | worst-is-a-no | (no figures) — immigration caveat MUST survive edits | public-charge rule status | if re-recording 2027+ |

## Batch 2 (this directory, 12–20)

Sources: Ep4 teleprompter (`show/ep4/ep4-teleprompter.txt`, post-fix version)
+ Ep4 fact-check report (`show/ep4/fact-check-full-report.json`) — verified
claims only, written 2026-07-01. Every `hostAdLibBlacklist` item obeyed
(failed-smog condition on the $1,350 retirement tier, ESA furnace work
omitted as homeowners-only, "call the property manager" instead of "lists
are open", no 1-800-655-7705, only scripted income figures).

### Freshness index (verify before recording or re-posting)

| # | File | Load-bearing figures | Re-verify | Hard date |
|---|------|----------------------|-----------|-----------|
| 12 | pge-debt-forgiveness-8000 | $8,000 cap; 90+ days behind; 12 on-time payments | pge.com AMP page | — (standing; re-check before re-posting) |
| 13 | medical-baseline-free-battery | no income test; free battery for SOME | pge.com Medical Baseline; phone FREED 530-477-3333 (battery stock) | before each posting (battery supply) |
| 14 | car-insurance-199 | $199/yr Nevada Co. (new driver $308); ~$39k/1p ~$82k/4p; car ≤$25k | mylowcostauto.com FAQ (annual FPL refresh) | after Jan 2027 |
| 15 | failed-smog-1450 | $1,450; ~$36k/1p ~$74k/4p; ≥20% co-pay | bar.ca.gov/cap/income + funds banner | after Jan 2027 + FY-funds check each posting |
| 16 | state-buys-the-car | $1,350 failed-smog only; up to $2,000 income-qual.; 120-day reg-lapse rule | bar.ca.gov/cap/retirement + funds | after Jan 2027 + FY-funds check each posting |
| 17 | liheap-propane-firewood | up to $1,500; 40-call voicemail; FCFS funds | phone Project GO 1-888-524-5705 press 2 (funds!) | before EACH posting; FFY ends Sep 30 2026; FFY2027 elimination proposed |
| 18 | pge-free-home-upgrades | fridge ≥15 yrs; home ≥5 yrs; CARE-level income rules | pge.com ESA page | after May 31 2027 |
| 19 | truckee-bus-free | free fares; "funded into next year" | tahoetruckeetransit.com/fares | re-phrase "next year" after Dec 2026; check before each posting |
| 20 | section-8-closed | waitlist CLOSED (verbatim, Jul 1 2026) | regionalha.org HCV page + homepage property table | STALE THE DAY IT REOPENS — check before EVERY posting |

## Ep6 shorts (21–22) — rural connectivity / copper (NEW, out of numeric batch order)

Sourced from the **Ep6 research brief** (`~/.claude/projects/-home-jp/scratch/att-copper-landline/findings.md`, primary-cited). **Fact-checked (PIPELINE stage-4, 2026-07-05): every load-bearing claim verified to primary** — R.24-06-012 confirmed the *open* CPUC COLR rulemaking, Public Advisor 1-866-849-8390 confirmed, zero "July 22" (the real WC 26-125 dates were comments June 22 / reply July 7, both passed), and AT&T's own no-911-without-power admission + June-1-2027 + Nevada-County-not-in-the-360 all confirmed. #22 is a committed ready-to-record master; #21 is the JP-selected CPUC-venue re-aim (empowerment tone).

### Freshness index (verify before recording or re-posting)

| # | File | Load-bearing facts | Re-verify | Hard date |
|---|------|--------------------|-----------|-----------|
| 21 | copper-landline-fcc-comment (civic; **CPUC-venue**) | ~184k CA customers; June 1 2027 earliest cutoff; AT&T's own "no 911 without power" admission; **CPUC rulemaking R.24-06-012** (verified ACTIVE) + Public Advisor **1-866-849-8390** / apps.cpuc.ca.gov/c/R2406012; NOT a court, NOT local (NV County not in the 360) | confirm **R.24-06-012 still open**; ~184k + June-2027 still hold | **STALE when CPUC closes the rulemaking / issues a decision** — time-sensitive |
| 22 | which-network-works-at-your-house (self-help; **evergreen**) | no dollar figures; 3 networks (VZ/T-Mo/AT&T); county library lends LifeLine hotspots on all 3 (free test); **a booster amplifies existing signal — can't create one** | county library still lends hotspots on all 3 (nevadacountyca.gov/3934); keep hardware names/prices generic; **the booster caveat MUST survive edits** | evergreen — re-confirm library-hotspot program before each posting |

## Batch 3 (this directory, 23–26)

Written 2026-07-05 (grove) from the Ep3/Ep4 fact-check reports + the verified
screener corpus (`lib/screener/rules.data.json`) — corpus sweet-spot topics
only; every figure re-traced. The generator-rebate dollar figure is kept soft
and its sunset prominent per the funds rule. **PR pending rune review (show lane).**

### Freshness index (verify before recording or re-posting)

| # | File | Load-bearing figures | Re-verify | Hard date |
|---|------|----------------------|-----------|-----------|
| 23 | medi-cal-free-rides | free NEMT; book 5+ days ahead; gas reimbursement; Partnership 866-828-2303 | Partnership # + booking window | — (evergreen; Partnership = NV County Medi-Cal plan) |
| 24 | fera-discount | ~18% electric; ~$45/mo; HH4 up to ~$82,000; 1–2p now eligible | pge.com/carefera table (eff. through May 31 2027) | after May 31 2027 |
| 25 | care-fera-generator-rebate | up to $500 (base + CARE/FERA extra); fire-area; buy-first | pge.com — still open AND **funded** (money can exhaust early); do not harden the $ | **STALE after Dec 31 2026 (sunset)** |
| 26 | calworks-motel-nights | 16 nights; deposit + last month's rent; once/12mo; form CW-42 | CDSS HA page + 530-265-1340 | after FY updates |

### Still TODO (after their waves)
Ep5 nonprofit/farm topics (after Ep5 airs/records); Ep2 connection claims (after Ep2 airs). Same rule: only claims that passed their wave.

Ep4-wave refinements already locked in (2026-07-01, `car-bar.json` +
`transit-west.json`) — applied in batch 2; future writers use THESE, not
the older briefs:

- **BAR income limits**: live 2026 table is **$35,910 (1p) / $74,250 (4p)** —
  say "about thirty-six thousand / seventy-four thousand." The ~$33k/~$70k
  figures floating in vehicle.md §5① are 225% of the 2024 guidelines — stale.
- **BAR retirement**: the $1,350 no-income tier **requires a FAILED most-recent
  smog check** (pass-smog cars only qualify via the income-eligible $1,500
  tier); registration lapse >120 days in the prior two years disqualifies.
- **Dial-a-ride**: $4.00 one-way is the official west-county figure (see the
  verified-sources rule above).

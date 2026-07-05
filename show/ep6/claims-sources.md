<!--
Ep6 PROVENANCE / CLAIMS-SOURCES TABLE — untracked, HOLD-FOR-APPROVAL.
Purpose: document every load-bearing claim in the Ep6 script, the companion
resource page, and civic short #21 → its exact PRIMARY source → confidence,
so JP can review provenance and the independent fact-check has a clean checklist.
Master research brief (all § refs point here):
  ~/.claude/projects/-home-jp/scratch/att-copper-landline/findings.md
Author: Nebula. NOT self-verification — this is the source map for an
independent oracle to audit against (finder ≠ fixer).
Confidence legend: HIGH = pinned to primary; MED = secondary/drifts/ranged;
INFER = reasoned synthesis (not a single citable fact); NEG = absence-of-evidence.
⚠️ = flag for the fact-check to scrutinize.
-->

# Ep6 — Claims → Primary Sources → Confidence

Artifacts covered: **[S]** = Ep6 script (`ep6-teleprompter.txt`), **[R]** = resource page (`resource-rural-connectivity.md`), **[21]** = civic short (`shorts/21-copper-landline-fcc-comment.md`).

---

## A. Copper retirement / regulatory (the "problem" + civic ask)

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| A1 | AT&T got federal permission to retire copper for **~184,000** residential CA homes | S, 21 | §1A/§1B | FCC PN **DA-26-539A1** + CPUC "Federal Applications to Discontinue Landline Voice Service" | HIGH |
| A2 | The §214 discontinuance apps (26-120/121) were **deemed granted automatically June 29, 2026** — an FCC *agency* action, **not a court ruling** | S, 21 | §1A | **DA-26-539A1** (§63.71(f) auto-grant); "no court" from absence of any court order | HIGH |
| A3 | **Nothing changes before June 1, 2027**; grandfather **~July 19, 2026 = stop new orders only**, not disconnection | S, R, 21 | §1B | AT&T-CA Residential POTS Discontinuance **application** (lines 557 / 613 / 1150–1181) + DA-26-539A1 | HIGH |
| A4 | **Nevada County is NOT in the 360 wire centers** (nearest = Marysville MYVICA01, Nicolaus NCLSCA12) | S, R | §1E | AT&T **application "List of Affected Wire Centers"** — read directly (0 "Nevada" hits) | HIGH ✅ |
| A5 | Copper **powers itself** and works in an outage; wireless/VoIP need house power + signal | S, R, 21 | §1C | FCC 15-98 backup-power context + physics of line-power; corroborated by press/advocacy | HIGH |
| A6 | ⭐ **AT&T's own filing admits** AP-A "will not power…medical and [alert] devices" and with no power "will not work, **including emergency 911 service**" | S, R, 21 | §1C/§4 | AT&T **application ≈lines 1399–1414** (quoted) | HIGH ✅ |
| A7 | CA **COLR** rule: a carrier can't stop serving unless another provider can actually serve (**no "no-alternative exception"**); CPUC **denied** AT&T's exit June 2024 | S(paraphrased), R, 21 | §1C/§1D | CPUC "CPUC Rejects AT&T Request to Withdraw as Carrier" + COLR-rulemaking page | HIGH |
| A8 | AT&T's **preemption petition (WC 26-125)** seeks to override COLR; comment cycle **comments June 22 / reply July 7, 2026** (⚠️ **NOT "July 22"**) | R (context), 21 (implied) | §1A/§1D-DATES | FCC PN **DA-26-520** (verbatim dates) + Federal Register (no extension) | HIGH ⚠️(kills the "July 22" myth) |
| A9 | Civic venue = **CPUC rulemaking R.24-06-012**; comment via **apps.cpuc.ca.gov/c/R2406012** ("Add Public Comment") / **Public Advisor 1-866-849-8390** / mail 505 Van Ness Ave SF 94102 | R, 21 | §1D/§1E | cpuc.ca.gov **COLR-rulemaking page** (verbatim proceeding # + comment method) | HIGH |
| A10 | FCC backup-power rule (FCC 15-98, former §9.20) *required* providers to offer a battery ≥8h/≥24h — **SUNSET Sept 1 2025; §9.20 now Reserved in eCFR → NOT current law.** Script + resource softened to "ask your provider," § cite dropped. | R | §1C | FCC 15-98 + live eCFR (§9.20 Reserved) | RESOLVED #99 |

## B. Which network works at your house / maps / testing

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| B1 | There are **three major networks** — Verizon, T-Mobile, AT&T | S, R, 22 | §2A | Common industry fact (3 facilities-based nationwide networks) | HIGH |
| B2 | Coverage maps are **modeled, not measured**, and over-promise on terrain — for **cellular AND fixed-wireless** | S, R, 22 | §1C | EFF/FCC BDC critique + Consumer Reports + JP ground-truth (micro-topology; optimistic over-claim) | HIGH |
| B3 | **Nevada County library lends LifeLine hotspots on all 3 networks**, free, 14-day loan, adult/teen cardholders | S, R, 22 | §2A | **Nevada County Library "Hotspots"** page (nevadacountyca.gov/3934) + Ep2 fact-check `library-hotspots` (VERIFIED) | HIGH |
| B4 | Read **dBm** (closer to 0 = stronger; ~−80 strong, ~−110 weak); iPhone `3001#12345#`; Samsung `*#0011#` | R (S/22 = "hidden field-test") | §2A | Vendor/how-to guides (UberSignal, MyAmplifiers); iOS/Android field-test standard | HIGH (codes are standard; ⚠️ device menus drift) |
| B5 | **CellMapper** shows tower location/carrier/band/direction; **OpenSignal** has a tower compass | S, R, 22 | §2A/§2B-ADV | CellMapper docs + coverage-map-reading guides | HIGH |
| B6 | **FCC consumer availability challenge is open/rolling but slow** (~60+60+90 days, provider-rebuttable); **BEAD challenge CLOSED** (rebuttal ended Feb 20) | R only (kept OUT of shorts) | §2A#5 | FCC **BDC Help Center** (challenge process) + NTIA/state BEAD trackers | HIGH |

## C. Boost the signal (the ladder)

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| C1 | ⭐ A booster **amplifies existing outside signal — it can't create one from nothing** | S, R, 22 | §2A/§2B | **FCC Consumer Signal Boosters** page + weBoost | HIGH ✅ (must survive edits) |
| C2 | Consumer booster must be **FCC-certified + registered (free) with your carrier**; all 4 majors permit | R | §2B | FCC Consumer Signal Boosters + **47 CFR §20.21** | HIGH |
| C3 | Prices: Yagi **~$30–80**; router **~$150–400**; weBoost **~$570–1,000**; Cel-Fi **~$1,100–1,700** | R (S/22 = qualitative only) | §2B | Vendor list prices (Waveform, weBoost, Tupavco) | ⚠️ MED (drift; ranged; qualitative on-air by design) |
| C4 | Directional **Yagi/LPDA** aimed at tower; **MIMO ±45°**; **SMA/TS9** connectors | R | §2B-ADV | Waveform LPDA/Yagi guide + antenna vendor specs | HIGH |
| C5 | Satellite (**Starlink**) as the fallback when no cell reaches you (needs sky + power) | S, R | §2B | Brief §2B (secondary) — ⚠️ verify current pricing before publishing R | MED |

## D. Power-user RF tier (resource page depth; ~60–90s taste in S)

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| D1 | **Low band (<1 GHz)** — Band **71 (600 MHz, T-Mobile)**, Bands **12/13/14 (700 MHz, AT&T/Verizon)** — travels farthest / penetrates; mid-high band = shorter range | S(taste), R | §2B-ADV | RF fundamentals + CellMapper/coverage guides + carrier band assignments | HIGH |
| D2 | The tower that **reaches** you is often a **distant low-band** one, not the nearest | S, R | §2B-ADV | Reasoned from D1 + CellMapper practice (national-park low-band note) | ⚠️ MED-HIGH (inference) |
| D3 | Many LTE/5G **routers/hotspots allow band-lock** (or 4G-only); caveats: SIM/plan must support; breaks handoff → fixed device only | S(taste), R | §2B-ADV | outdoorrouter + Waveform Nighthawk band-lock guides | HIGH |
| D4 | **Yagi = narrow/high-gain (~3–5 dB more); LPDA = wideband (~600–4000 MHz)** | R | §2B-ADV | Waveform + antenna-engineering guides | HIGH |
| D5 | **FCC ASR + ULS** databases + **antennasearch.com** + CellMapper **EARFCN→band** calc locate towers/bands | R | §2B-ADV | FCC ASR/ULS (primary gov DBs) + CellMapper docs | HIGH |

## E. Outage resilience

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| E1 | Put hotspot/router + booster on **battery/UPS + solar/portable power** to survive a multi-day PSPS | S, R | §2C | ⚠️ **INFERRED synthesis** (physics + §1C) — framed as guidance, not a cited spec | INFER |
| E2 | If moved to a wireless replacement, **ask your provider** about a backup battery (the FCC offer-obligation sunset Sept 1 2025 — no longer required); PSPS can run **multiple days** | S, R | §1C/§2C | FCC 15-98 (sunset 2025) + PSPS duration | REVISED #99 |

## F. Afford-it / low-income

| # | Claim (as used) | In | findings.md § | Primary source | Conf |
|---|---|---|---|---|---|
| F1 | **ACP ended June 1, 2024**; no federal successor as of early 2026 (Extension Act introduced, unfunded); it gave **$30/mo** ($75 tribal) + one-time **$100 device** | S, R | §2D | **FCC ACP page** + **CRS IF12637** | HIGH |
| F2 | **LifeLine remains**: ~**$9.25** federal + up to **~$19** CA; covers **SERVICE, not equipment** (federal voice-only $5.25 through Nov 30 2026) | S, R | §2D | USAC + CPUC LifeLine pages + Ep2 fact-check (claim 48) | HIGH |
| F3 | **No subsidy exists for boosters/antennas** | S, R | §2D | ⚠️ **NEG** (absence of evidence — none found in searches; framed as "none I could find / today") | NEG |
| F4 | Free levers: **library hotspot** (also the test device); **device refurbishers** (human-I-T, Computers for Classrooms) | S, R | §2D | Nevada County Library page + Ep2 fact-check | HIGH |
| F5 | **"Signal-kit lending" program** as a community idea | S, R | §2B/§2D | ⚠️ **SPECULATIVE** — explicitly labeled "nobody's doing it yet / a pitch," not a claim of an existing program | N/A (flagged) |

---

## Items the fact-check should scrutinize most (self-flagged)
- **A8 / "July 22" myth** — the operative 26-125 reply deadline is **July 7** (DA-26-520). Any artifact must NOT assert a July-22 window. (#21 is deadline-free by design; verify no stray "July 22" survives anywhere.)
- **A10 / backup-power rule** — RESOLVED #99: the §9.20 offer-obligation SUNSET Sept 1 2025 (§9.20 now Reserved in eCFR); script + resource softened to "ask your provider," § cite dropped — no current federal "required to offer" obligation.
- **C3 / prices** — ranged, drift; on-air kept qualitative; resource page prices need a pre-publish re-verify.
- **C5 / Starlink pricing** — verify current before publishing R.
- **D2** — "distant low-band tower reaches you" is a strong inference, not a single citation.
- **E1** — battery/solar resilience is reasoned guidance, not a cited spec (framed as such).
- **F3** — "no booster subsidy" is absence-of-evidence; keep the hedge ("none I could find / today").
- **F5** — signal-kit lending must stay flagged as an idea, never as an existing program.
- **B4** — field-test dial codes + menu paths drift by OS version; the script uses "a hidden field-test setting" (safe); the resource page gives exact codes (re-verify before publish).

## Not-in-any-artifact (deliberately excluded, for the record)
- "Medical-alert/alarm fails on VoIP" as a *generic* claim — I did NOT air it as my own assertion; the episode uses **AT&T's own admission (A6)** instead, which is primary and unimpeachable.
- Any "challenge the FCC map" as an *easy action* — kept out of the shorts entirely; only in the resource page with honest slow/closed framing (B6).

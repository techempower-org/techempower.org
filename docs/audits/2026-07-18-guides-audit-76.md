# Guides Freshness Audit — Issue #76 (Nebula)

**Audit date:** 2026-07-18
**Scope:** all 8 live guides on techempower.org
**Cross-reference:** `lib/screener/rules.data.json` (67 rules, all provenance verified 2026-07-01→07-05 — treated as truth) + live primary sources
**Method:** primary sources; positively verified before declaring anything dead; exact source text pulled from the live pages' embedded Notion recordMap. **No files edited.**

## HEADLINE

The guides are **well-maintained**. Every "known risk" program (ACP, e-bike incentive, LIHWAP, federal used-EV credit) is **already correctly marked as ended** with an accurate date. Total **5 corrections across 3 guides** (4 in free-internet, 1 in ebt-spending, 1 soft/verify in free-cell). 5 of 8 guides are clean. No harmful/live-money errors; the corrections are 1 stale price, 2 broken links, 1 overstatement to hedge, 1 imprecise income figure.

### Per-guide tally
| Guide | Verdict | Corrections |
|---|---|---|
| free-internet | needs fixes | **3** (AT&T price stale; 2 broken links) |
| free-cell-service | 1 soft/verify | 1 ($28k income figure imprecise) |
| ev-incentives | **CLEAN** | 0 (+1 optional typo) |
| ebt-balance | **CLEAN** | 0 |
| ebt-spending | 1 fix | 1 (Market Match — hedge per Ep3) |
| findhelp | **CLEAN** | 0 |
| password-manager | **CLEAN** | 0 |
| how-to-use-techempower | **CLEAN** | 0 |

### 3 worst offenders
1. **free-internet — AT&T Access "$10/mo"** — STALE. Now $15–$30/mo; $10 was the 2021 price, and the ACP subsidy that discounted it ended 2024. Appears twice (intro + provider table).
2. **free-internet — two broken links**: Human-I-T `hitconnect.org` (server dead/unresponsive) and Optimum `optimum.com/internet/advantage` (404 — URL moved). Both program prices are still correct; only the links rot.
3. **ebt-spending — Market Match "double your money"** — overstated. Per the Ep3 fact-check, Market Match matching is currently OFF at the Nevada City farmers market (no confirmed 2026-27 cycle). Should be hedged to "ask at the booth." Gated on JP's pending Market Match phone call.

---

## PER-GUIDE FINDINGS

### 1. /guides/free-internet — NEEDS FIXES (3)

**CONFIRMED-OK:**
- **Federal Lifeline $9.25/mo, 135% FPL** — corpus `lifeline-ca` (CPUC, verified 2026-07-02): "$9.25 federal + up to $19 CA stack"; FCC confirms 135% FPL. Guide: "Federal Lifeline ($9.25/mo, still active)… income at or below 135% of federal poverty." ✔
- **ACP "ended June 1, 2024"** — matches FCC's own phrasing ("The Affordable Connectivity Program ended on June 1, 2024"; last full-benefit month April 2024, partial May 2024). Correctly shown as dead, not promoted. Source: fcc.gov/acp. ✔
- **California LEP — 100% subsidy, $500 fixed wireless / $9,300 wireline** — CONFIRMED. CPUC CASF Line Extension Program: "subsidizes 100% of the cost, up to a maximum of $500 for a fixed wireless installation or $9,300 for wireline." Source: cpuc.ca.gov/…/casf-line-extension-program. ✔
- **Comcast Internet Essentials $9.95/mo, 50 Mbps** — LIKELY-OK, VERIFY. Base Internet Essentials has historically been $9.95/50Mbps and remains offered; some 2026 sources cite $14.95 (that is Internet Essentials **Plus**/100 Mbps). Xfinity's primary page is JS-rendered/bot-protected (couldn't grab price from static HTML). **Recommend JP confirm base price in a browser.** ✔(moderate)
- **Optimum Advantage $14.99/month price** — CONFIRMED current ($14.99, 50 Mbps unlimited). Only the URL is broken (see below). Source: optimum.com/internet/advantage-internet.
- **Human-I-T $15/month hotspot price** — CONFIRMED current ("unlimited 5G internet starting at $15/month"). Only the link is broken (see below). Source: human-i-t.org/low-cost-internet.
- **T-Mobile Project 10Million** — active. Corpus `tmobile-p10m` (t-mobile.com/brand/project-10-million, verified 2026-07-04). ✔
- Load-bearing links resolve: att.com/internet/access (200), treelink.us (200), pcsforpeople.org (200), drivingcleanca.org, cpuc LEP page (200); getinternet.gov / californialifeline.com / xfinity return 403 = alive-but-bot-blocked.

**CORRECTIONS:** AT&T price stale; Human-I-T link dead; Optimum URL 404 — see corrections #1–#3 below.

### 2. /guides/free-cell-service — 1 SOFT/VERIFY

**CONFIRMED-OK:**
- **Application flow is carrier-first** — matches JP's 2026-07-02 directive. Guide: "visit a local representative and walk out with your phone the same day" / "sign up on their website" (per-carrier), with California LifeLine provider search offered as a finder, NOT a government-portal-first flow. ✔
- Lifeline program itself backed by corpus `lifeline-ca` (open, verified 2026-07-02). ✔

**SOFT/VERIFY:** flat "$28,000/year" income figure is imprecise — see correction #5. (Safelink service numbers 1-800-SAFELINK / 1-800-584-7652 / 611611 and in-person tabling spots like "Burger King in Linda" are operational details that change frequently and aren't web-verifiable — recommend periodic local confirm; not scored.)

### 3. /guides/ev-incentives — CLEAN (0)

Every dollar figure and program status verified. All "known risk" items correctly marked ended:
- **Federal Used EV Tax Credit (25E) "ended September 30, 2025 under the One Big Beautiful Bill Act"** — CONFIRMED. Source: IRS + OBBBA coverage. ✔
- **California E-Bike Incentive Project "ENDED Dec 2025… concluded in December 2025 and has not been renewed"** — CONFIRMED (CARB; no 2026 renewal). ✔
- **LIHWAP resource card "ENDED MARCH 2024"** — CONFIRMED (federal LIHWAP sunset 2024-03-31; CSD no longer accepting applications). Correctly marked dead. Source: csd.ca.gov/lihwap. ✔
- **DCAP up to $10,000 / $12,000 (DAC) + $2,000 charging, under 300% FPL** — corpus `dcap-clean-vehicle` (drivingcleanca.org + CARB, verified 2026-07-04). ✔
- **Clean Cars 4 All "remain active for income-qualified buyers"** — CONFIRMED (CC4A active in 5 air districts; statewide path is DCAP — note Nevada County isn't in a CC4A air district, so DCAP is the local route; guide's statewide framing is accurate). ✔
- **PG&E used-EV rebate $1,000/$4,000, "standard… closes to new applications August 31, 2026; income-qualified $4,000 tier continues"** — CONFIRMED against live PG&E page ("complete application must be submitted by August 31, 2026"; "Beginning September 1, 2026, the program will no longer accept Standard rebate applications. Only income-qualified customers…"). Corpus `pge-used-ev-rebate` (evrebates.pge.com, verified 2026-07-04). ✔
- **PG&E EV charging rebate up to $2,000 (up to $5,000 with panel)** — corpus `pge-ev-charging-rebate` (pge.com, verified 2026-07-04). ✔
- **BAR CAP smog repair up to $1,450 ($1,100 for 1976–95)** — corpus `bar-cap-repair` (bar.ca.gov/cap/repair, verified 2026-07-03). ✔
- **BAR CAP vehicle retirement "$1,350–$2,000"** — CONFIRMED ($1,350 all others / $2,000 income-eligible, HPRRP). ✔
- **SGIP whole-house battery** — active; corpus `pge-battery-rebate` ($7,500). ✔

*Optional polish (not freshness):* typo "WATER ASSISSTANCE" → "WATER ASSISTANCE"; LIHWAP full name is "Low Income Household Water Assistance Program."

### 4. /guides/ebt-balance — CLEAN (0)

- **EBT customer service 1-877-328-9677 (24/7)** — CONFIRMED official CA EBT cardholder line. Source: ebtproject.ca.gov/clients/whentocall.html. ✔
- Propel app (propel.app) and ebtEDGE (ebtedge.com) both live (200). ✔

### 5. /guides/ebt-spending — 1 FIX

**CONFIRMED-OK:**
- **Restaurant Meals Program "Nevada County is signing up restaurants now — none are active yet"** — CONFIRMED against Nevada County's own RMP page today: "Nevada County is recruiting local restaurants and vendors… to participate in the Restaurant Meals Program (RMP)." Still recruitment-stage, no active vendors. Source: nevadacountyca.gov/3329/Restaurant-Meals-Program. ✔
- eatfresh.org, Propel, retailer names (Amazon/Walmart/Instacart/Briar Patch/SPD/Grocery Outlet), Nevada City Farmers Market, Mountain Bounty CSA — stable. ✔

**CORRECTION:** Market Match "double your money" — see correction #4.

### 6. /guides/findhelp — CLEAN (0)
findhelp.org (formerly Aunt Bertha) — CONFIRMED alive and accurately described ("free website where you type in your zip code… works in every county and state… no account"). Links OK. ✔

### 7. /guides/password-manager — CLEAN (0)
Bitwarden (bitwarden.com, 200) and Google Password Manager (passwords.google.com, 200) — both free, both live, accurately described. ✔

### 8. /guides/how-to-use-techempower — CLEAN (0)
211, Discord invite (discord.gg/7wDhAG3vYS → 200), internal links, 211connectingpoint.org — all resolve. ✔

---

## VERIFIED CORRECTIONS LIST (actionable — for Notion application)

### Correction #1 — free-internet — AT&T Access price STALE (2 locations)
- **Location A (intro paragraph). Old text:** `provider low-income plans (AT&T Access $10/mo, Comcast Internet Essentials $9.95/mo)`
  **New text:** `provider low-income plans (AT&T Access $15–$30/mo, Comcast Internet Essentials $9.95/mo)`
- **Location B (provider table row). Old text:** `AT&T Access ⭐ DSL/Fiber $10/mo (less with Lifeline) SNAP, NSLP, SSI (CA), or income ≤200% poverty.`
  **New text:** `AT&T Access ⭐ DSL/Fiber $30/mo (up to 100 Mbps) or $15/mo if the fastest speed available is under 50 Mbps — less with Lifeline. SNAP, NSLP, SSI (CA), or income ≤200% poverty.`
- **Why:** $10/mo is the 2021 price; the ACP subsidy that lowered it ended 2024. Current published tiers are $15/$30.
- **Source:** highspeedinternet.com/resources/att-low-income-internet; reviews.org/internet-service/att-low-income-internet (2026). **Primary att.com/internet/access is JS-rendered/bot-protected — JP should confirm the exact tier/price in a browser before publishing.** Verified 2026-07-18.

### Correction #2 — free-internet — Human-I-T broken link
- **Old text:** `Human-I-T (cellular hotspot) $15/month hitconnect.org`
- **New text:** `Human-I-T (cellular hotspot) $15/month human-i-t.org/low-cost-internet`
- **Why:** hitconnect.org resolves in DNS but the server is unresponsive (HTTP 000 on https+http); Human-I-T's own site no longer references it. Price ($15/mo) is still correct.
- **Source:** human-i-t.org/low-cost-internet (live; "unlimited 5G internet starting at $15/month"). Verified 2026-07-18.

### Correction #3 — free-internet — Optimum broken URL (404)
- **Old text:** `Optimum Advantage Internet $14.99/month optimum.com/internet/advantage`
- **New text:** `Optimum Advantage Internet $14.99/month optimum.com/internet/advantage-internet`
- **Why:** old URL 404s; program alive and price unchanged, URL gained the `-internet` suffix.
- **Source:** optimum.com/internet/advantage-internet (live; $14.99/50 Mbps). Verified 2026-07-18.

### Correction #4 — ebt-spending — Market Match overstatement (hedge, per Ep3)
- **Old text:** `Use Market Match at farmers markets to double your money on fruits and vegetables.`
- **New text:** `Ask at the market manager's booth whether Market Match is running this season — when it is, it doubles your money (up to $10/visit) on fresh fruits and vegetables.`
- **Why:** Ep3 fact-check (2026-07-01) found Market Match matching is OFF at the Nevada City farmers market (EBT itself on; last cycle ended 2026-02-28, no 2026-27 renewal announced). Unconditional "double your money" overpromises.
- **Gate:** tied to JP's pending Market Match phone call (Sierra Harvest / county DSS). If a live 2026-27 cycle is confirmed, the definite phrasing can stand.
- **Source:** Ecology Center Market Match finder (per Ep3 report); no web evidence of a live cycle as of 2026-07-18.

### Correction #5 — free-cell-service — flat $28,000 income figure IMPRECISE (soft; confirm intent)
- **Old text:** `Your tax return (cannot be handwritten; income must be under $28,000/year)`
- **New text (suggested):** `Your tax return (cannot be handwritten; income must be under your household's California LifeLine limit — about $24,600 for 1 person, $33,300 for 2, higher for larger households — see californialifeline.com)`
- **Why:** current CA LifeLine annual limits are $24,600(1)/$33,300(2)/$42,100(3)/$50,800(4); federal Lifeline uses 135% FPL per household size. A flat "$28,000" only matches ~135% FPL for a 2-person household — overstates eligibility for singles, understates it for larger families.
- **Source:** cpuc.ca.gov California LifeLine eligibility (corpus `lifeline-ca`, verified 2026-07-02). LOW-MED — a deliberate simplification; JP may keep it.

---

## COVERAGE CAVEATS (no silent gaps)
- **AT&T & Xfinity primary pages are JS-rendered/bot-protected** — their prices rest on consistent 2026 secondary sources; flagged for JP browser-confirm (corrections #1, and Comcast $9.95 verify).
- **Not every outbound link was HTTP-checked.** I checked all load-bearing program links + verified the two broken ones. The free-internet "local ISP directory" (~20 links: race.com, nevcofiber.com, vastnetworks.com, digitalpath.net, smarterbroadband.net, goskywest.com, colfax.net, succeed.net, exwire.com, starlink.com, viasat.com, hughesnet.com, verizon.com, etc.) was NOT individually checked — lower-stakes; recommend a periodic bulk link-check.
- **free-cell operational details** (Safelink service numbers, in-person tabling locations) aren't web-verifiable and change often — recommend local confirm, not scored here.
- **Peripheral ev-incentives figures** ($99 KeySavvy, $700/$75/$900 misc rebates, PG&E Empower EV $500/$2,000, $45,000 price cap) are plausible/standard and low-stakes; not independently re-verified this pass.

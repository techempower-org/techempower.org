<!--
PROPOSAL — companion resource page for Ep6 "Still Connected When the Power's Out."
STATUS: DRAFT / HOLD-FOR-APPROVAL. NOT published to the live Notion Resources DB.
Must clear the Ep6 adversarial fact-check gate (PIPELINE stage 4) before publishing.
Every load-bearing claim traces to the research brief:
  ~/.claude/projects/-home-jp/scratch/att-copper-landline/findings.md  (§ noted inline)
Tone: empowerment-education (warm, audience-centered, clear POV, non-combative).
When published: apply the site's dark/light theme + favicon per repo conventions;
this markdown is the content proposal only.
-->

# Staying Connected in the Foothills — When the Signal's Weak and the Power's Out

Living up a canyon or out a dirt road shouldn't mean you can't call for help. This guide is the companion to our bonus episode — a plain-language, do-it-yourself path to a phone and internet connection that **actually works where you live, and keeps working when the power goes out.**

**First, the reassuring part.** You may have heard that AT&T is retiring its old copper landlines. That's a real, slow, *statewide* shift — but **Nevada County is not on AT&T's list**, and even where it is happening, nothing changes before **June 2027**, with 90 days' written notice. So there's no emergency here. This guide is about taking control, not reacting to a deadline.

---

## Why this matters: the maps lie, and the power fails

Two hard truths drive everything below:

1. **Coverage maps are guesses, not measurements.** Every cell and "home internet" provider will show you a map that says you're covered. Those maps are built from computer models that **can't see the ridge behind your house, the canyon you live in, or the trees over your road.** When a provider isn't sure, it tends to claim coverage anyway. So both cell carriers *and* fixed-wireless internet providers routinely advertise service they can't actually deliver at your address. *(Brief §1C.)* **The only reliable answer is to measure it at your house.**
2. **Copper's real superpower was power.** The old landline drew its electricity from the phone company, so it worked in a multi-day outage. Cell, fiber, and internet-based phones all die when your house power dies — and cell towers themselves can go dark in a shutoff. Even AT&T's own filing admits its wireless replacement "will not work, including emergency 911" without power. *(Brief §1C, §4.)* Any modern setup has to solve the power problem on purpose (see Step 4).

---

## Step 1 — Find out which of the 3 networks actually works at YOUR house

There are only three big networks: **Verizon, T-Mobile, and AT&T.** Which one wins at your address is decided by your terrain, not the map.

**A. Borrow the library's LifeLine hotspot — a free way to test all three.**
The Nevada County library lends mobile internet hotspots, free, to adult and teen cardholders — and it stocks them on **Verizon, T-Mobile, and AT&T** (14-day loan). Borrow one, bring it home, and test it right where you live. Try a different network on your next loan and you've compared all three — at your kitchen table, before paying any carrier. *(Brief §2A; Nevada County Library "Hotspots" page: nevadacountyca.gov/3934.)* This is also the free "which network is my free LifeLine phone on?" test from our Getting-Connected episode.

**B. Read your true signal in "dBm" (not bars — bars are marketing).**
Signal strength is a negative number: **closer to zero is stronger** (about −80 dBm is strong; around −110 dBm is nearly unusable). *(Brief §2A.)*
- **iPhone:** open the phone dialer and enter `3001#12345#` then call → "Field Test" → look for the RSRP/dBm value.
- **Android (Samsung):** dial `*#0011#`; other Androids: Settings → About phone → SIM status → Signal strength. A free app like **Network Cell Info Lite** shows it live.

**C. Find the tower you're actually reaching.**
- **CellMapper** (free app/site) shows estimated tower locations, which carrier owns them, the direction, and the frequency — invaluable for aiming an antenna. **OpenSignal** has a compass that points at the nearest tower. *(Brief §2A, §2B-ADVANCED.)*

**D. About "challenging" the coverage map — worth knowing, but not a quick fix.**
If the federal map wrongly says you're "served," you *can* file a challenge at the FCC's National Broadband Map (broadbandmap.fcc.gov) — it's **open and rolling**, but it's **slow** (the provider gets ~60 days to respond, then up to 60 more to resolve with you, then the FCC decides within ~90) and the provider can push back. It's a long game, not an emergency remedy. *(Brief §2A #5.)* (Note: the separate, faster BEAD funding-map challenge that ran in 2023–24 has **closed** — its rebuttal phase ended Feb 20, so that window's gone.) **Bottom line: test at your address today; treat the map challenge as optional, slow civic housekeeping.**

---

## Step 2 — Make a weak signal stronger (cheapest → priciest)

**The one rule that governs all of this:** a booster or antenna can **amplify a signal that's already reaching your property — it cannot create one from nothing.** If you get *zero* signal even standing outside, skip to satellite (below). *(Brief §2A/§2B; FCC Consumer Signal Boosters.)* So **Step 1 comes first — always test before you buy.**

| Rung | What it is | Rough cost* | When it helps |
|---|---|---|---|
| 1 | **Directional antenna** (Yagi or log-periodic), aimed at your tower, feeding a phone/hotspot | ~$30–80 | Best cheap gain in rural areas; needs to know the tower direction and a clear-ish line to it |
| 2 | **LTE/5G hotspot or router with external-antenna ports**, plus the antenna above | router ~$150–400 | Puts the antenna's gain on a dedicated home device; two antennas ("MIMO") boost speed |
| 3 | **FCC-certified signal booster** (e.g., weBoost, Cel-Fi) | weBoost ~$570–1,000; Cel-Fi ~$1,100–1,700 | Whole-house boost of an existing weak outdoor signal; Cel-Fi is strongest for very weak signal |
| 4 | **Satellite (Starlink)** when no cell signal reaches you at all | hardware + monthly (verify current) | Terrain beats every antenna; needs clear sky and — importantly — power (see Step 4) |

*\*Prices drift — treat as ballpark and verify before buying. (Brief §2B.)*

**Two rules the law adds:** a consumer signal booster must be **FCC-certified**, and you must **register it (free) with your carrier** before turning it on. All four major carriers permit certified boosters. *(Brief §2B; FCC 47 CFR §20.21.)*

**Mounting:** point the directional antenna **at the tower** (from CellMapper), mount it **high with the clearest possible line over the ridge**, and pole-mount it solidly. Higher and clearer beats more expensive.

---

## Step 3 — The power-user tier (for the handy: find the tower's band, lock it, match the antenna)

If you like a project, this is the level that rescues a lot of "hopeless" foothill homes. The chain: **find your tower → learn its band → lock your device to that band → point a band-matched antenna at it.**

1. **Find the tower and its band.** In **CellMapper**, locate the tower that actually reaches you (often a *distant low-band* site, not the nearest one) and note its **band** — CellMapper's frequency calculator turns the channel number (EARFCN) into a band. You can cross-check tower locations against the FCC's free **ASR** (Antenna Structure Registration) and **ULS** license databases, or aggregators like **antennasearch.com**. *(Brief §2B-ADVANCED.)*
2. **Know which bands travel.** **Low band (under 1 GHz)** — **Band 71 (600 MHz, T-Mobile)** and **Bands 12/13/14 (700 MHz, AT&T/Verizon)** — goes the farthest and pushes through trees and walls: the rural workhorse. Mid/high band (1.7–2.5 GHz and up) is faster but far shorter-range — often useless deep in a canyon. **Chase the low band, not the fastest band.** *(Brief §2B-ADVANCED.)*
3. **Band-lock your device.** Many LTE/5G **home routers and hotspots let you lock to a specific band** (or force "4G-only") so the modem stops hopping to a closer-but-weaker signal. *(Brief §2B-ADVANCED; e.g., Waveform's Netgear Nighthawk band-lock guide.)* **Caveats:** confirm your plan/SIM supports the band; band-locking can break hand-off/roaming, so it's for a *fixed home device*, not a phone you carry around.
4. **Match the antenna to the band.**
   - **Yagi** = tuned to a narrow band, higher gain — best when you're locking to **one low band** (buy a 700 MHz Yagi for Band 12/13, or 600 MHz for Band 71).
   - **Log-periodic (LPDA)** = wideband (~600–4000 MHz), steadier across bands — best when you need several bands or aren't sure.
   - **MIMO:** two antennas oriented **+45° / −45°** for more speed on capable routers.
   - **Connectors:** antenna (N/SMA) → adapter → your device's port (**SMA or TS9**). Match them. *(Brief §2B-ADVANCED.)*

Skipping step 1 is why a generic antenna aimed at "wherever" so often disappoints.

---

## Step 4 — Keep it working when the power's out (the whole point)

Copper worked in a multi-day shutoff because it powered itself. Give your modern setup the same superpower:

- **Put your hotspot/router — and booster — on a battery backup (UPS)**, ideally topped up by a **small solar panel or a portable power station.** That's the difference between "my phone works" and "my phone works when I need it most." *(Brief §2C.)*
- If you're ever moved off copper onto a wireless replacement, the provider is **required to offer you a backup battery** — take it, and plan for **longer than 24 hours**, because our public-safety power shutoffs can run several days. *(Brief §1C/§2C; FCC 47 CFR §12.5.)*
- **Test it on a calm day:** flip your house power off for an hour and confirm you can still get online and call out. Practice before the emergency.

---

## What it costs — and the honest truth about help paying for it

We won't pretend there's a coupon for this hardware. There isn't, today. *(Brief §2D.)*

- **The Affordable Connectivity Program has ended** (it ran out of money in 2024) — the federal $30/month internet discount is gone, with no direct replacement yet.
- **LifeLine is still here and still worth getting** — a monthly discount (about $9.25 federal, plus up to ~$19 California) on phone **or** internet **service**. But it pays for *service, not equipment* — it won't buy an antenna or booster.
- **No subsidy exists for boosters or antennas.** So the reception gear above is out-of-pocket for now.

**The free and low-cost levers that DO exist:**
- **The library hotspot** — free to borrow, and it's also your test device (Step 1).
- **Device refurbishers** — local nonprofits that provide low-cost refurbished computers and phones (see our Getting-Connected episode/resources).
- **A community idea worth building:** a **"signal-kit" lending program** — an antenna, a hotspot, and a battery that neighbors could check out the way the library lends hotspots. Nobody's running one yet; it's a natural project for a service club, a library, or a mutual-aid group. *(Brief §2B/§2D — flagged as a pitch, not an existing program.)*

---

## Have your say (optional) — the bigger decision happening now

You don't have to do anything here. But if you want the people deciding to hear what wireless *really* does at a foothill house, you can weigh in — respectfully, factually. This is public comment on a rulemaking, which is a normal civic thing, not a lawsuit.

- **The California Public Utilities Commission** is running a proceeding — **Rulemaking R.24-06-012** — on whether and how phone companies must keep serving everyone (the "Carrier of Last Resort" rule that says a company can't cut you off unless someone else can actually serve you). *(Brief §1D/§1E.)*
- **To comment:** use the CPUC public-comment portal at **apps.cpuc.ca.gov/c/R2406012** ("Add Public Comment"), or call the **Public Advisor's Office toll-free at 1-866-849-8390** (they help with the process and with translation — call at least 5 days ahead for interpreter needs), or write CPUC Public Advisor's Office, 505 Van Ness Ave., San Francisco, CA 94102 (reference **R.24-06-012**).
- Helpful to mention: what your cell coverage is really like, whether you've had multi-day power shutoffs, and whether you rely on a phone that works without electricity.

*(Note: AT&T's federal petition on the same issue closed its public-comment window in July 2026, so the CPUC proceeding is the open, durable place to be heard. We're not telling you what to say — just that the door is open if you want to walk through it.)*

---

## Get one-on-one help

Stuck on any of this? That's literally why we exist. Go to **techempower.org** and click **"Join our Discord"** — real neighbors will help you test your signal, pick gear, or set it up, step by step. And if you have no internet at all tonight, every door into help still opens by phone: dial **2-1-1** (here, 2-1-1 Connecting Point — free, confidential, 24/7, English & Spanish), or find programs at **findhelp.org**.

---

### For the editor / publisher (not for the page)
- **Do not publish** until the Ep6 adversarial fact-check (PIPELINE stage 4) clears every claim here, especially: the ~184,000 / June-2027 / "not in Nevada County" scope; AT&T's 911 admission quote; the library-hotspot-on-3-networks fact; hardware prices (mark/verify); FCC map-challenge timelines; CPUC R.24-06-012 comment path.
- **Re-verify before publish:** hotspot program still on all 3 networks (nevadacountyca.gov/3934); booster prices; that R.24-06-012 is still open; LifeLine dollar figures.
- **Freshness after publish:** hardware/prices drift; the copper-retirement scope and the CPUC proceeding are moving targets — date-stamp the page and re-check quarterly.
- Apply site dark/light theme + favicon on publish; keep the "a booster can't create signal from nothing" caveat prominent (over-promising sends people to buy gear that won't work).

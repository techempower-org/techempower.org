# Which Cell Network Actually Works at YOUR House?

- **Est. length:** ~60 seconds (≈150 spoken words)
- **Source:** Ep6 research brief (`~/.claude/projects/-home-jp/scratch/att-copper-landline/findings.md` §2A + §1C), tracing to:
  - **3 major networks (Verizon, T-Mobile, AT&T)** + **coverage maps are modeled, not measured, and over-promise on foothill terrain** — §1C (FCC map wireless layer uses tower-radius models that ignore terrain/tree cover; providers over-claim under uncertainty). [SECONDARY: EFF/FCC BDC + JP ground-truth]
  - **County library lends LifeLine mobile hotspots on all three networks, free** — Nevada County Library Hotspots page (https://www.nevadacountyca.gov/3934/Hotspots) + Ep2 fact-check `library-hotspots` (VERIFIED: Verizon/T-Mobile/AT&T; 14-day loan; adult/teen cardholders). **Free way to test all 3 at your address.**
  - **Read true signal in dBm via Field Test** (iPhone `3001#12345#`; Android Settings→About phone) — §2A. **CellMapper** shows your tower + direction — §2A.
  - **Boost ladder + hard caveat:** directional antenna→hotspot→FCC-certified booster; **a booster only amplifies existing outside signal — it can't create one** — §2A/§2B (FCC Consumer Signal Boosters).
  - **Cross-link:** Ep2 "Getting Connected" + the LifeLine `/resources` page (which lists which of the 3 networks each free phone rides).
- **Freshness:** **Evergreen** — no dates, no politics. Re-verify before posting: (1) the county library still lends hotspots on all three networks (nevadacountyca.gov/3934); (2) hardware names/prices drift — keep the antenna/booster mention generic. **The "a booster can't create signal from nothing" caveat MUST survive edits** (over-promising here would send people to buy gear that won't work). HOLD-FOR-APPROVAL; uncommitted.

--- SCRIPT ---

There are only three big cell networks -- Verizon,
T-Mobile, and AT&T. Which one works at YOUR house is
often not what the coverage map claims. Those maps are
computer guesses -- not measured at your address -- and in
the canyons, they're regularly wrong.

So test it for free. The county library lends mobile
hotspots on all three networks. Borrow one, take it home,
and see which actually works where you live -- before you
pay for a plan.

Want the real number, not just bars? A hidden "field-test"
setting shows your true signal strength -- and a free app
called CellMapper shows which tower to aim at.

Weak signal? Point a directional antenna at your tower,
into a hotspot, and add a booster if needed. One honest
catch: a booster only amplifies a signal that's already
reaching you -- it can't create one from nothing.

The step-by-step -- and which network each free phone uses
-- is at techempower dot org. Join our Discord, we'll help
you test yours.

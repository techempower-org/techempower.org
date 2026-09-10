"""Per-episode content for the "Wait, I Qualify?!" Canva decks.

Every card below is a `[POST: PROGRAM CARD ...]` cue from
`show/epN/epN-teleprompter.txt`, split into on-screen lines. The verbatim cue
travels with the card as speaker notes so the editor can see the source.

Rules (from show/EDITOR-HANDOFF.md):
- Numbers/URLs come from the script cues, which already carry every fact-check
  fix. If the audio disagrees with `show/epN/fact-check-full-report.json`, the
  JSON wins -- flag it to JP.
- Never overstate reach or eligibility on a card.

A card `line` is either a plain string or a (label, detail) pair; pairs render
as a bold amber label with a smaller detail line under it.
"""

EPISODES = {
    2: {
        "title": "Getting Connected",
        "subtitle": "Internet + phones",
        "recorded": "Recorded Mon Jul 6, 2026",
        "guests": [],
        "thumb_hook": ["Free phone.", "$15 internet."],
        "end_lines": [
            "techempower.org",
            "techempower.org/qualify  ·  2-minute check",
            "Dial 2-1-1   |   findhelp.org",
        ],
        "cards": [
            {
                "title": "California LifeLine — free phone plans",
                "lines": [
                    "Apply: assurancewireless.com",
                    "Apply: safelinkwireless.com",
                    "Full provider list: californialifeline.com",
                ],
                "cue": "[POST: PROGRAM CARD -- California LifeLine free phone plans: apply at assurancewireless.com / safelinkwireless.com -- full provider list: californialifeline.com]",
            },
            {
                "title": "Low-cost home internet",
                "lines": [
                    ("Xfinity Internet Essentials", "$14.95 a month"),
                    ("AT&T Access", "$30 or less a month"),
                    ("NevCoFiber Community Assist", "$15 a month"),
                    "Check your address with each provider",
                ],
                "cue": "[POST: PROGRAM CARD -- Xfinity Internet Essentials $14.95 / AT&T Access $30 or less / NevCoFiber Community Assist $15 -- \"check your address\"]",
            },
            {
                "title": "CASF Line Extension Program",
                "lines": [
                    "State grant to extend the line to unserved homes",
                    "Income lines: LifeLine / CARE",
                    "Ask your provider to apply for you",
                ],
                "cue": "[POST: PROGRAM CARD -- CASF Line Extension Program: state grant to extend the line to unserved homes -- LifeLine/CARE income lines -- ask your provider to apply for you]",
            },
            {
                "title": "Nevada County Library",
                "lines": [
                    "Free hotspot lending",
                    "24/7 WiFi outside every branch",
                    "Free tech help",
                    "530-265-7050",
                ],
                "cue": "[POST: PROGRAM CARD -- Nevada County Library: free hotspot lending, 24/7 WiFi, free tech help -- 530-265-7050]",
            },
            {
                "title": "T-Mobile Project 10Million",
                "lines": [
                    "For K-12 student households",
                    "Free hotspot + 200 GB a year, up to 5 years",
                    "t-mobile.com/project-10-million",
                ],
                "cue": "[POST: PROGRAM CARD -- T-Mobile Project 10Million (K-12 student households): free hotspot + 200 GB a year, up to 5 years -- t-mobile.com/project-10-million]",
            },
            {
                "title": "Low-cost computers",
                "lines": [
                    ("Computers for Classrooms", "computersforclassrooms.org  ·  ships anywhere in California"),
                    ("human-I-T", "human-i-t.org"),
                ],
                "cue": "[POST: PROGRAM CARD -- Computers for Classrooms (ships in CA) / human-I-T -- numbers on screen]",
                "note": "Cue says 'numbers on screen' -- URLs taken from show/ep2/fact-check-full-report.json (computersforclassrooms.org, human-i-t.org). Add the current price only if the fact-check JSON has it.",
            },
            {
                "title": "More help getting online",
                "lines": [
                    ("Senior Planet hotline", "seniorplanet.org/hotline"),
                    ("California Connect", "caconnect.org"),
                    ("TechEMPOWER Discord", "techempower.org"),
                ],
                "cue": "[POST: PROGRAM CARD -- Senior Planet hotline / California Connect (caconnect.org) / TechEmpower Discord]",
                "note": "Senior Planet hotline phone number is not in the cue; the fact-check JSON lists seniorplanet.org/hotline. Add the number only from that source.",
            },
        ],
    },
    3: {
        "title": "Food",
        "subtitle": "Grocery money + no-paperwork help",
        "recorded": "Recorded Mon Jul 27, 2026",
        "guests": [("Clay", "Guest")],
        "thumb_hook": ["Grocery money", "you may be missing"],
        "end_lines": ["techempower.org", "Dial 2-1-1   |   findhelp.org"],
        "cards": [
            {
                "title": "CalFresh",
                "lines": [
                    "Apply: BenefitsCal.com",
                    "Statewide 1-877-847-3663  ·  Local 530-265-1340",
                    "950 Maidu Ave, Suite 120, Nevada City",
                    "10075 Levon Ave, Truckee (Joseph Center)",
                    "Or dial 2-1-1",
                ],
                "cue": "[POST: PROGRAM CARD -- CalFresh: BenefitsCal.com / statewide 1-877-847-3663 / county offices: 950 Maidu Ave, Suite 120, Nevada City + 10075 Levon Ave, Truckee (Joseph Center) / local 530-265-1340 / or dial 2-1-1]",
            },
            {
                "title": "WIC",
                "lines": [
                    "Grass Valley: 530-265-1454",
                    "Truckee: 530-582-7814",
                    "myfamily.wic.ca.gov",
                ],
                "cue": "[POST: PROGRAM CARD -- WIC: Grass Valley 530-265-1454 / Truckee 530-582-7814 / myfamily.wic.ca.gov]",
            },
            {
                "title": "Interfaith Food Ministry",
                "lines": [
                    "440 Henderson St, Grass Valley",
                    "530-273-8132",
                    "Mon · Wed · Fri, 10 to 1  (first hour by reservation)",
                    "Plus Saturdays",
                ],
                "cue": "[POST: PROGRAM CARD -- Interfaith Food Ministry: 440 Henderson St, Grass Valley / 530-273-8132 / Mon-Wed-Fri 10 to 1 (first hour by reservation) + Saturdays]",
            },
            {
                "title": "Food Bank of Nevada County",
                "lines": [
                    "530-272-3796",
                    "foodbankofnc.org",
                    "Mobile distribution days + sites listed online",
                ],
                "cue": "[POST: PROGRAM CARD -- Food Bank of Nevada County: 530-272-3796 / foodbankofnc.org -- mobile distribution days + sites]",
            },
            {
                "title": "Community Roots — FREE summer meals",
                "lines": [
                    "Any kid 18 & under  ·  no sign-up",
                    ("Lunch at the Library, weekdays 12–1 (thru Aug 7)", "Grass Valley + Madelyn Helling libraries, Memorial Park pool"),
                    ("Weekly meal bags, Thu 10–1", "Nevada Union HS + Oak Tree Preschool"),
                    "All sites + times: communityrootsnc.org",
                ],
                "cue": "[POST: PROGRAM CARD -- Community Roots FREE summer meals (any kid 18 & under, no sign-up): Lunch at the Library -- Grass Valley + Madelyn Helling libraries + Memorial Park pool, weekdays 12-1 (thru Aug 7) / weekly meal bags Thu 10-1 -- Nevada Union HS + Oak Tree Preschool / all sites + times: communityrootsnc.org]",
            },
            {
                "title": "SUN Bucks (Summer EBT)",
                "lines": [
                    "$120 per school-age child for the summer",
                    "Most kids are auto-enrolled — check your mail",
                    "Not enrolled? Apply at your child's school by Aug 31",
                    "Helpline 1-877-328-9677  ·  cdss.ca.gov/sun-bucks",
                ],
                "cue": "[POST: PROGRAM CARD -- SUN Bucks (Summer EBT): $120 per school-age child for the summer / most kids auto-enrolled -- check your mail / not enrolled? apply at your child's school by Aug 31 / helpline 1-877-328-9677 / cdss.ca.gov/sun-bucks]",
            },
            {
                "title": "Meals on Wheels + senior lunch",
                "lines": [
                    ("Gold Country Senior Services (west county)", "530-446-6853"),
                    ("Sierra Senior Services (Truckee)", "530-550-7600"),
                    ("Senior lunch — Sierra Gold Community Senior Center", "231 Colfax Ave, Grass Valley  ·  Mon/Tue/Thu at noon  ·  530-273-4961"),
                ],
                "cue": "[POST: PROGRAM CARD -- Meals on Wheels: Gold Country Senior Services 530-446-6853 (west county) / Sierra Senior Services 530-550-7600 (Truckee) -- Senior lunch: Sierra Gold Community Senior Center, 231 Colfax Ave, Grass Valley, Mon/Tue/Thu at noon -- 530-273-4961]",
            },
        ],
    },
    4: {
        "title": "Home + Transportation",
        "subtitle": "Bills, housing, the car, the bus",
        "recorded": "Recorded Mon Aug 3, 2026",
        "guests": [],
        "thumb_hook": ["Lower bills.", "Help with rent + rides."],
        "end_lines": ["techempower.org", "Dial 2-1-1   |   findhelp.org"],
        "cards": [
            {
                "title": "CARE / FERA + LIHEAP",
                "lines": [
                    ("CARE / FERA — PG&E bill discount", "pge.com  ·  1-877-660-6789"),
                    ("LIHEAP via Project GO", "1-888-524-5705, press 2 for Nevada County"),
                ],
                "cue": "[POST: PROGRAM CARD -- CARE / FERA: pge.com or 1-877-660-6789 -- LIHEAP via Project GO: 1-888-524-5705, press 2 for Nevada County]",
            },
            {
                "title": "Energy Savings Assistance + Weatherization",
                "lines": [
                    ("Energy Savings Assistance", "pge.com"),
                    ("Weatherization — Project GO", "1-888-524-5705, press 2"),
                ],
                "cue": "[POST: PROGRAM CARD -- Energy Savings Assistance: pge.com -- Weatherization: Project GO 1-888-524-5705, press 2]",
            },
            {
                "title": "Medical Baseline + battery help",
                "lines": [
                    "Medical Baseline: pge.com",
                    "Batteries: dial 2-1-1 or FREED 530-477-3333",
                    "Rebates up to $500 for CARE/FERA customers",
                ],
                "cue": "[POST: PROGRAM CARD -- Medical Baseline + battery help: pge.com -- batteries: dial 2-1-1 or FREED 530-477-3333 -- rebates up to $500 for CARE/FERA customers]",
            },
            {
                "title": "Regional Housing Authority",
                "lines": ["regionalha.org", "888-671-0220"],
                "cue": "[POST: PROGRAM CARD -- Regional Housing Authority: regionalha.org / 888-671-0220]",
            },
            {
                "title": "Housing crisis",
                "lines": [
                    "Dial 2-1-1",
                    ("Hospitality House shelter line — call first", "530-271-7144  ·  check-in 4:00–5:30 pm daily"),
                    ("Truckee Navigation Center referrals", "530-606-5457"),
                ],
                "cue": "[POST: PROGRAM CARD -- Housing crisis: dial 2-1-1 -- Hospitality House shelter line 530-271-7144 (call first; check-in 4:00-5:30 pm daily) -- Truckee Navigation Center referrals 530-606-5457]",
            },
            {
                "title": "Smog repair + vehicle retirement",
                "lines": ["bar.ca.gov/cap"],
                "cue": "[POST: PROGRAM CARD -- Smog repair + vehicle retirement: bar.ca.gov/cap]",
            },
            {
                "title": "California Low Cost Auto Insurance",
                "lines": ["mylowcostauto.com", "1-866-602-8861"],
                "cue": "[POST: PROGRAM CARD -- CA Low Cost Auto Insurance: mylowcostauto.com / 1-866-602-8861]",
            },
            {
                "title": "Driving Clean Assistance Program",
                "lines": [
                    "drivingcleanca.org",
                    ("PG&E used-EV rebate — income-qualified, $4,000", "evrebates.pge.com"),
                ],
                "cue": "[POST: PROGRAM CARD -- Driving Clean Assistance Program: drivingcleanca.org (verify open) -- PG&E used-EV rebate (income-qualified $4,000): evrebates.pge.com]",
                "note": "Cue says '(verify open)': confirm DCAP is accepting applications before this card airs (see show/ep4 week-of recheck).",
            },
            {
                "title": "NID Low Income Rate Assistance",
                "lines": ["530-273-6185"],
                "cue": "[POST: PROGRAM CARD -- NID Low Income Rate Assistance: 530-273-6185]",
            },
            {
                "title": "Getting around western Nevada County",
                "lines": [
                    ("Nevada County Connects", "530-477-0103"),
                    ("Nevada County Now — door-to-door", "530-271-7433  ·  book the day before"),
                ],
                "cue": "[POST: PROGRAM CARD -- Nevada County Connects: 530-477-0103 -- Nevada County Now (door-to-door): 530-271-7433, book the day before]",
            },
            {
                "title": "Truckee + medical rides",
                "lines": [
                    ("TART + TART Connect (Truckee)", "Free to ride"),
                    ("Medi-Cal rides — Partnership HealthPlan", "866-828-2303  ·  book 5+ days ahead"),
                ],
                "cue": "[POST: PROGRAM CARD -- TART + TART Connect (Truckee): free to ride -- Medi-Cal rides: Partnership HealthPlan 866-828-2303, book 5+ days ahead]",
            },
        ],
    },
    5: {
        "title": "Nonprofits + Farmers",
        "subtitle": "The local safety net + the growing kind  ·  season finale",
        "recorded": "Recorded Mon Aug 17, 2026",
        "guests": [("Lindsey Pratt", "Farm Institute Director, Sierra Harvest")],
        "thumb_hook": ["The local safety net", "(and the growing kind)"],
        "end_lines": ["techempower.org/show", "Dial 2-1-1   |   findhelp.org"],
        "cards": [
            {
                "title": "Help for small farms",
                "lines": [
                    ("Conservation cost-share (NRCS), Grass Valley", "113 Presley Way, Suite 1  ·  Valerie Bullard 530-798-5527"),
                    ("Farm microloans (FSA)", "farmers.gov/service-center-locator"),
                ],
                "cue": "[POST: PROGRAM CARD -- Conservation cost-share (NRCS), Grass Valley: 113 Presley Way, Suite 1 -- Valerie Bullard 530-798-5527 -- Farm microloans (FSA): find your farm-loan office at farmers.gov/service-center-locator]",
            },
            {
                "title": "Growing locally",
                "lines": [
                    ("Sierra Harvest Farm Institute", "sierraharvest.org  ·  530-265-2343"),
                    ("UCCE Foothill Farming", "530-273-4563  ·  office open Tue + Thu"),
                    ("Nevada County Dept of Agriculture", "530-470-2690"),
                ],
                "cue": "[POST: PROGRAM CARD -- Sierra Harvest Farm Institute: sierraharvest.org / 530-265-2343 -- UCCE Foothill Farming: 530-273-4563 (office open Tue + Thu) -- Nevada County Dept of Agriculture: 530-470-2690]",
            },
            {
                "title": "FREED + legal help",
                "lines": [
                    ("FREED — free medical equipment", "530-477-3333"),
                    ("Legal Services of Northern California", "530-823-7560  ·  evening intake 866-815-5990"),
                ],
                "cue": "[POST: PROGRAM CARD -- FREED (free medical equipment): 530-477-3333 -- Legal Services of Northern California: 530-823-7560 -- evening intake 866-815-5990]",
            },
        ],
    },
    6: {
        "title": "Still Connected When the Power's Out",
        "subtitle": "Rural connectivity resilience  ·  bonus episode",
        "recorded": "DRAFT — not yet fact-checked",
        "status": "DRAFT",
        "guests": [],
        "thumb_hook": ["Still connected", "when the power's out"],
        "end_lines": ["techempower.org", "Dial 2-1-1   |   findhelp.org"],
        "cards": [
            {
                "title": "Copper landlines",
                "lines": [
                    "Nothing changes in Nevada County",
                    "Statewide: no earlier than June 2027",
                ],
                "cue": "[POST: PROGRAM CARD -- \"Copper landlines: nothing changes in Nevada County; statewide, no earlier than June 2027.\"]",
            },
            {
                "title": "Test all 3 networks free",
                "lines": ["Borrow a library hotspot", "Nevada County Library — Hotspots"],
                "cue": "[POST: PROGRAM CARD -- \"Test all 3 networks free: borrow a library hotspot. Nevada County Library -- Hotspots.\"]",
            },
            {
                "title": "Boost a weak signal",
                "lines": [
                    "Directional antenna → hotspot/router → booster",
                    "A booster needs SOME outside signal — it can't create one",
                ],
                "cue": "[POST: PROGRAM CARD -- \"Boost weak signal: directional antenna -> hotspot/router -> booster. A booster needs SOME outside signal -- it can't create one.\"]",
            },
            {
                "title": "Power-user guide",
                "lines": [
                    "Find your tower + band, lock it, match the antenna",
                    "techempower.org",
                ],
                "cue": "[POST: PROGRAM CARD -- \"Power-user guide (find your tower + band, lock it, match the antenna): techempower.org\"]",
            },
            {
                "title": "Have your say (optional)",
                "lines": [
                    "CA Public Utilities Commission — Public Advisor",
                    "1-866-849-8390",
                    "Proceeding R.24-06-012",
                ],
                "cue": "[POST: PROGRAM CARD -- \"Have your say (optional): CA Public Utilities Commission -- Public Advisor 1-866-849-8390 -- proceeding R.24-06-012\"]",
            },
        ],
    },
}

# Thumbnail hooks for the published/finished episodes that have no deck here.
THUMB_ONLY = {
    1: {"title": "You Qualify for More Than You Think", "thumb_hook": ["You qualify for", "more than you think"]},
}

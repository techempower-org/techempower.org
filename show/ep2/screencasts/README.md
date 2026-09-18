# Ep2 screencast stills — captured 2026-09-17

1920x1080 viewport captures of the live pages, in script order, for the
`[POST: SCREENCAST …]` and `[POST: PROGRAM CARD …]` cues from Benefit 3
onward (the earlier cues — Assurance Wireless, California LifeLine, Xfinity
Internet Essentials, nevcofiber — were captured separately).

| File                                      | Script cue                                                             | Notes                                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `05a-library-hotspots-program.png`        | Benefit 3 — library hotspot program page                               | nevadacountyca.gov/3934/Hotspots hero. County "Emergency Alert" bar (Floriston Fire) is in frame at the top — crop or use the next still.                                        |
| `05a-library-hotspots-lending-policy.png` | Benefit 3 — "fourteen days" / "$200 charge" beat                       | Same page scrolled to Lending Policies: Verizon/T-Mobile/AT&T, 14-day loan, $200 replacement. Chat widget bottom-right, crop if needed.                                          |
| `05b-library-catalog-hotspot-search.png`  | `[POST: SCREENCAST -- library catalog: search "hotspot" … Place Hold]` | ⚠️ The Polaris catalog button is labelled **PLACE REQUEST**, not "Place Hold". 18 of 129 Verizon units available at capture time.                                                |
| `06-tmobile-project-10million.png`        | `[POST: PROGRAM CARD -- T-Mobile Project 10Million]`                   | t-mobile.com/brand/project-10-million hero. ⚠️ Card URL is **t-mobile.com/brand/project-10-million** (the short t-mobile.com/project-10-million 404s; script + handoff updated). |
| `06b-tmobile-200gb-5-years.png`           | same                                                                   | "Free 200GB of internet per year for 5 years · One free hotspot per household · No fees" — matches the card copy.                                                                |
| `07a-c4c-low-income-families.png`         | `[POST: SCREENCAST -- computersforclassrooms.org store page]`          | Eligibility page hero.                                                                                                                                                           |
| `07b-c4c-price-sheet-150-desktop.png`     | same — "~$150 desktop bundle with the warranty line visible"           | Price sheet: "$150 Core i5 – 9th Generation Desktop" + "one-year warranty" sentence in frame.                                                                                    |
| `08a-humanit-store-clean.png`             | `[POST: SCREENCAST -- human-I-T shop page]`                            | store.human-i-t.org hero: "$15/Month" 5G internet + Chromebook $104.99 (Gold member).                                                                                            |
| `08b-humanit-basic-chromebook.png`        | same                                                                   | "Get It Done" Chromebook product page: $149.99 / $104.99 Gold.                                                                                                                   |
| `08c-humanit-laptops-category.png`        | same — "refurbished Chromebook listings with prices"                   | Laptops category, sorted price low→high.                                                                                                                                         |
| `09a-seniorplanet-hotline.png`            | `[POST: PROGRAM CARD -- Senior Planet hotline]`                        | 888-713-3495, Mon–Fri 9–8 ET / Sat 9–2 ET.                                                                                                                                       |
| `09b-caconnect.png`                       | `[POST: PROGRAM CARD -- California Connect]`                           | caconnect.org home.                                                                                                                                                              |
| `09c-techempower-open-discord.png`        | `[POST: PROGRAM CARD -- TechEMPOWER Discord]`                          | techempower.org "Stuck? Talk to a real person" section with the Open Discord card + 2-1-1.                                                                                       |

Capture method: puppeteer-core driving the local Chrome, networkidle + 2.5 s
settle, consent banners auto-dismissed, chat widgets hidden where possible.

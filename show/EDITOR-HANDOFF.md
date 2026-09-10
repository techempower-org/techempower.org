# Wait, I Qualify?! — Editor handoff, Episodes 2 & 3

Shared via Box: `Jeff - ep2 ep3 handoff` (JP's TechEmpower Box, 2026-09-03).
The folder mirrors the portable drive `F:\` layout so DaVinci Resolve relinks
with one "Relink Media" pointed at the folder root.

| Episode | Recorded | Resolve project | Raw media |
|---------|----------|-----------------|-----------|
| Ep2 "Getting Connected" (internet + phone affordability) | Mon Jul 6, 2026 | `Jeff -/Project/Jeff 7-6-26 v1.drp` | `Jeff -/Media/7-6-26/` |
| Ep3 "Food" (grocery money + no-paperwork help) | Mon Jul 27, 2026 | `Jeff -/Project/Jeff 7-27-26 v1.drp` | `Jeff -/Media/7-27-26/` |

## What's in the folder

- **`Jeff -/Project/`** — the two Resolve `.drp` project exports (edit only, no media inside).
- **`Jeff -/Media/7-6-26/`** — Ep2 studio camera files `Jeff_WC_7-6-26_0..5.mp4` and the chart jpg.
  The Ep2 timeline uses `_5.mp4`; the others are the earlier takes.
- **`Jeff -/Media/7-27-26/`** — Ep3 studio camera files `Jeff_WC_7-27-26_0..2.mp4`, the levelled
  audio (`7-27-26 level.output.wav`, used on the timeline) plus the raw `level.wav`, and
  `Rough Export.mov` (JP's Ep3 rough cut, reference only).
- **`Jeff -/Xport/Jeff 7-6-26 _draft 1 .mov`** — JP's Ep2 draft export, reference only.
- **`show/ep2/`, `show/ep3/`** — scripts and research:
  - `epN-teleprompter-studio.txt` — exactly what was on the prompter at the shoot (best source for captions).
  - `epN-teleprompter.txt` — the full script with every `[POST: …]` cue: program cards, screencasts, intro/outro.
  - `fact-check-full-report.json` — every phone number and URL, verified against primary sources. Use these
    spellings/numbers on the cards, not what you hear in the audio.
  - `readme.md`, `weekof-recheck-*.md` — production notes and the week-of fact recheck.
  - `host-cards.html`, `teleprompter.html` — rehearsal artifacts, ignore.
- **`show/assets/logo/`** — `techempower-sun.png` (intro logo mark), `techempower-candela.png`,
  and `ep1-overlays/`: the series title card, lower thirds for Jeff and Shawna, end card, resources
  card. Reuse these so Ep2/Ep3 match Ep1.
- **`show/assets/jingles/`** — six jingle candidates, WAV + MP3. **Ep1 used `jingle_01_warm-piano`**;
  Ep2's project also has `jingle_03_hopeful-arp` in its media pool. Keep `jingle_01` unless JP says otherwise.
- **`show/assets/youtube/`** — channel avatar and banner PNGs, in case an end card wants them.
- **`show/assets/resolve-scripts/Add_Ep1_Intro_Logo.py`** — the Resolve script JP used to build the Ep1 intro.

## Episode 1 (done and published — here for reference and for the Ep2 logo intro)

- **`eps1/ep1-final-youtube.mp4`** — the published 1080p Ep1 (15:25). The style reference for Ep2/Ep3.
- **`eps1/ep1-final-720p-slack.mp4`** — small 720p copy of the same.
- **`eps1/Ep1 MASTER (logo intro).mov.split/`** — the 5.2 GB DNxHR master, which the Ep2 project pulls in
  for the logo intro. Box caps files at 2 GB, so it is in three parts. Download the folder, then run
  `JOIN-windows.bat` (or `JOIN-mac-linux.sh`) to rebuild `Ep1 MASTER (logo intro).mov` one level up;
  `SHA256SUM.txt` verifies the result. Or just relink that media pool item to `ep1-final-youtube.mp4`.
- **`show/ep1/`** — Ep1 script, fact-check, `edit-list.md` (the flub cuts and overlay timings JP used),
  whisper `transcript/` (srt/txt/tsv/json), `youtube-publish.md` (title, description, chapters), the two
  chart images, and `render/` (JP's ffmpeg build, only useful as a record of what the Ep1 cut did).
- **`show/assets/resolve-backups/`** — Resolve timeline backups from the Ep1 edit (Jun 17 – Jul 3).
- **`Jeff -/Project/Jeff - 6-15-26 v1.drp`** — the Ep1 Resolve project itself.
- **`Jeff -/originals_h264/`** — the three Ep1 studio H.264 originals from Jun 15 (the DNxHR transcodes
  you made from them are not on Box; you have those).
- **`Jeff -/Media/6-15-26/Audio - Jeff 6-15-26.wav`** — the Ep1 audio.

## Upcoming episodes and series context

- **`show/ep4/`, `show/ep5/`, `show/ep6/`** — scripts, fact-checks and briefs for the episodes still to be
  cut. Same `[POST: …]` cue convention as Ep2/Ep3.
- **`show/PIPELINE.md`** — how an episode is produced end to end; **`show/SEASON-OPS.md`** — the season calendar.
- **`show/assets/outreach/`** — press release (EN/ES), launch posts, media list, and the print poster/flyer
  PDFs, in case thumbnails or end cards want the same look.

## Not in this folder

- `Jeff Levelate 7-6-26.output.wav` — the Ep2 levelled audio. The Ep2 project points at
  `Z:\02 - PAID PROJECTS - KEEP\Jeff -\Media\7-6-26\Media\Audio\` on your side; it was never on JP's drive.
- The 128 GB of Ep1 DNxHR transcodes (`Jeff -/Media/6-15-26/DNxHR/`). You have those.

## Editable templates in Canva (added 2026-09-10)

Every graphic above now exists as an **editable Canva design**, in the folder
**https://www.canva.com/folder/FAHU07wYF-E** (TechEMPOWER's Canva for Nonprofits team):

- **WIQ — Series Template Kit** (Brand Template): intro title, lower thirds, three program-card
  layouts, URL strap for screencasts, book card, Find Help Today, outro end card, chart frame.
- **WIQ — Ep2 … Ep6 decks**: one design per episode with **every program card below already
  filled in** from the script cues, plus intro, lower thirds and the episode's end card.
  Each card's page notes carry the verbatim `[POST: PROGRAM CARD …]` cue and any verify-note.
- **WIQ — YouTube Thumbnails** (Brand Template), the channel banner/avatar, and the /qualify
  poster pack.

Overlay pages have no background: export as PNG with *Transparent background* ticked. Fonts are
Fraunces + DM Sans (in Canva's library). Source + rebuild instructions: `show/assets/templates/README.md`.

## Program cards to build

Every card below is a `[POST: PROGRAM CARD …]` cue in the full script; the fact-check JSON has the
verified source for each number.

### Ep2 "Getting Connected"
- California LifeLine free phone plans — apply at assurancewireless.com / safelinkwireless.com; full provider list: californialifeline.com
- Xfinity Internet Essentials $14.95 / AT&T Access $30 or less / NevCoFiber Community Assist $15 — "check your address"
- CASF Line Extension Program — state grant to extend the line to unserved homes; LifeLine/CARE income lines; ask your provider to apply for you
- Nevada County Library — free hotspot lending, 24/7 WiFi, free tech help — 530-265-7050
- T-Mobile Project 10Million (K-12 student households) — free hotspot + 200 GB a year, up to 5 years — t-mobile.com/project-10-million
- Computers for Classrooms (ships in CA) / human-I-T
- Senior Planet hotline / California Connect (caconnect.org) / TechEmpower Discord
- Outro end card: TECHEMPOWER.ORG / TECHEMPOWER.ORG/QUALIFY (2-minute check) / 211 / FINDHELP.ORG

Ep2 also has `[POST: SCREENCAST …]` cues (assurancewireless.com sign-up, californialifeline.com provider list,
Xfinity Internet Essentials page, nevcofiber.com coverage check, library catalog hotspot hold,
computersforclassrooms.org store, human-I-T shop). Capture these at edit time; durations are in the cues.

### Ep3 "Food"
- CalFresh — BenefitsCal.com / statewide 1-877-847-3663 / county offices: 950 Maidu Ave, Suite 120, Nevada City + 10075 Levon Ave, Truckee (Joseph Center) / local 530-265-1340 / or dial 2-1-1
- WIC — Grass Valley 530-265-1454 / Truckee 530-582-7814 / myfamily.wic.ca.gov
- Interfaith Food Ministry — 440 Henderson St, Grass Valley / 530-273-8132 / Mon-Wed-Fri 10 to 1 (first hour by reservation) + Saturdays
- Food Bank of Nevada County — 530-272-3796 / foodbankofnc.org — mobile distribution days + sites
- Community Roots FREE summer meals (any kid 18 & under, no sign-up) — Lunch at the Library: Grass Valley + Madelyn Helling libraries + Memorial Park pool, weekdays 12-1 (thru Aug 7) / weekly meal bags Thu 10-1: Nevada Union HS + Oak Tree Preschool / communityrootsnc.org
- SUN Bucks (Summer EBT) — $120 per school-age child for the summer / most kids auto-enrolled, check your mail / not enrolled? apply at your child's school by Aug 31 / helpline 1-877-328-9677 / cdss.ca.gov/sun-bucks
- Meals on Wheels — Gold Country Senior Services 530-446-6853 (west county) / Sierra Senior Services 530-550-7600 (Truckee) — Senior lunch: Sierra Gold Community Senior Center, 231 Colfax Ave, Grass Valley, Mon/Tue/Thu at noon — 530-273-4961
- Outro end card: TECHEMPOWER.ORG / 211 / FINDHELP.ORG

## Series invariants (please keep)

- Closing resources every episode: 211, findhelp.org, techempower.org, Discord.
- TechEmpower does **not** teach classes at Nevada County Media; its help channels are the website + Discord only.
- Never overstate reach or eligibility on a card; if a number in the audio disagrees with the fact-check JSON, the JSON wins. Flag it to JP.

# Wait, I Qualify?! — Episode Production Pipeline

The repeatable machine for producing an episode, proven end-to-end on Ep1 and
script-side on Ep2. The point of this doc: **any future episode (Ep3, Ep4, Ep5,
season 2) should be turnkey** — fill in the category, drain the research/script/
fact-check/edit stages to agents, and the only irreducible human jobs are
*showing up on camera* and *approving the facts*.

Legend for each stage:
🤖 drain to agents · 🔧 mechanical (a script does it) · 🎬 irreducible human (JP / Shawna / studio)

---

## Series invariants (do not drift)

- **Cadence:** record 1st & 3rd Mondays at **Nevada County Media** (NCM). Edit + publish ~3–7 days after the record date.
- **Hosts:** Shawna (interviewer) + Jeff (expert = JP). ~13–15 min dialogue.
- **Per-episode format:** jingle + logo intro → name the category → Shawna interviews Jeff on **2–4 benefits (1–2 California + 1–2 Nevada County)** → optional guest (default: none) → close.
- **The shoot needs only:** hosts + the studio-master script `.txt` on a portable drive + the studio. Every asset (jingle, logo, charts, on-screen program cards) is a **post-edit** deliverable — never let asset work block the calendar-locked studio slot.
- **Closing resources, every episode:** 211 (Connecting Point), findhelp.org, techempower.org, Discord.
- **Facts that must stay straight:** TechEmpower does **not** teach classes at NCM. TechEmpower's help channels are the **website + Discord only**. Never overstate reach or eligibility (see the fact-check gate).

---

## The stages

### 1. Plan 🎬🤖 — *Notion Show planning DB*
Pick the category and choose the 2–4 benefits (1–2 CA + 1–2 Nevada County); decide guest (default none). JP approves the lineup; an agent can propose it.
**Output:** an episode brief on the Notion Show planning DB (`370a4ee69520807793fee1cdda74d673`).

### 2. Research 🤖 — *fan-out, one agent per benefit*
Each agent researches one benefit: who qualifies (income thresholds + categorical eligibility), dollar amounts, deadlines, how to apply, and the **local Nevada County specifics** (branches, phone numbers, hours, providers). Primary sources only — `.gov` / `.ca.gov` / county / the program's official administrator.
**Output:** research notes per benefit (feed stage 3). Prompt template below.

### 3. Draft script 🤖 — *one agent, or JP*
Shawna question / Jeff answer dialogue in prompter format:
- plain ASCII, **CRLF** line endings (Windows prompter software), ALL-CAPS speaker tags, `[bracket]` cues (operator notes, not read aloud), numbers written out **as spoken** ("fourteen ninety-five," not "$14.95").
- Insert `[POST: PROGRAM CARD …]` cues wherever a phone number / URL should appear on screen — these become the edit's program cards.
**Output:** `show/epN/epN-teleprompter.txt` — the studio-delivery master.

### 4. Adversarial fact-check 🤖 — *fan-out, one agent per claim · THE QUALITY GATE*
This is the crown jewel and the reason the show can be trusted. Telling a low-income viewer "you qualify for X" when they don't (or vice-versa) sends a vulnerable person on a wasted trip or costs them a real benefit. So:
- **One agent per spoken claim**, tasked to *refute* it against primary sources.
- Each verdict records: `accurate` / `needs_fix`, the **primary-source URLs**, a **burn-risk** note (where a host ad-lib could mislead), and a concrete `scriptFix` string when needed.
- **Overstatement rule:** when a number is a range or uncertain, round *toward the conservative* claim. Never overstate reach ("a few hundred homes" when the source says "100+") or eligibility.
- Apply **every** `needs_fix` to the `.txt`.
- **Week-of recheck:** re-verify dates, prices, and hours the week of taping (a lighter parallel pass) — these drift. Record the recheck verdict in the same report.
**Output:** `show/epN/fact-check-full-report.json` (see Ep1/Ep2 for the schema). Prompt template below.

### 5. Generate prompter + cards 🔧
- `node scripts/sync-prompter.mjs epN` — rebuilds `show/epN/teleprompter.html` from the `.txt` (source of truth) and bakes a content-hash **sigil badge**; the badge changes iff the script changes, so you can tell a live prompter from a stale cache at a glance.
- `show/epN/host-cards.html` — printable backup cue cards (open → Ctrl+P; B&W-laser-friendly).
**Output:** rehearsal prompter (practice only — the studio runs the `.txt` on their rig) + printable cards.

### 6. Shoot 🎬 — *NCM studio, JP + Shawna*
Copy `epN-teleprompter.txt` to the portable drive → NCM. Record. (This is the calendar-locked step; everything above must be done before it, everything below can happen after.)

### 7. Ingest + find flubs 🔧🤖
- Get the interview export from the studio.
- Transcribe: `whisper-ctranslate2 --model medium.en --compute_type int8` (CPU, pipx-installed).
- Read the timestamped transcript; false starts/retakes show up as repeated or trailing-off lines. Cut in the **breath between** the flub and the clean restart.
**Output:** `show/epN/edit-list.md` — verified frame ranges to cut + overlay timings (see `show/ep1/edit-list.md` for the format: `frame = clip_start + seconds*fps`).

### 8. Edit + render 🔧 — *headless ffmpeg on katana*
- Adapt `~/Videos/episode.filtergraph` with this episode's cut/overlay times; run `~/Videos/render.sh`.
- **CRITICAL — earlyoom gotcha:** cut with a **single-pass `select`/`aselect`** filter (`[0:v]select='between(t,a,b)+…',setpts=N/FRAME_RATE/TB`), **never** `trim`+`concat` — the latter buffers GBs of raw frames and `earlyoom` SIGKILLs the render at ~2 min wall. The linear select pass keeps RSS tiny.
- Intro is built in-graph: color bg → logo overlay → fade → `concat` with the interview; chart overlays via `overlay=…:enable='between(t,…)'`; matched `aselect` + jingle `concat` on audio.
- If editing in DaVinci Resolve instead: free Resolve on Linux can't encode H.264 — export **DNxHR .mov**, then `ffmpeg -c:v libx264 -crf 18` to mp4.
**Output:** `~/Videos/epN_FINAL.mp4` (~6.5 min render for a 15-min 1080p episode).

### 9. Publish 🔧🎬
- YouTube + **techempower.org `/show`** (see W2) + Notion.
- Build the on-screen program cards from the `[POST: PROGRAM CARD …]` cues (phone numbers + URLs).
- Always include the closing resources: 211, findhelp.org, techempower.org, Discord.
**Output:** live episode + updated site episode entry.

---

## Series assets (one-time, reused every episode)

| Asset | Location | Notes |
|-------|----------|-------|
| Intro jingle | `~/Videos/jingles/jingle_01_warm-piano.wav` | Used in Ep1's render. 6 candidates exist (`jingle_01…06`); **W4 = lock the standing one.** |
| Logo / sun mark | `~/Videos/logo/techempower-sun.png` | Intro overlay |
| Intro title card | `~/Videos/logo/ep1-overlays/intro_title.png` | |
| Per-episode charts | `show/epN/chart-*.{png,jpg,webp}` | Versioned in git (per `.gitignore` show-assets rule); credit the source |
| Jingle working sources | `show/jingle/*.aup3` | Audacity projects — **git-ignored** (large binaries); only the `~/Videos/jingles/` exports ship |

---

## New-episode checklist (copy-paste)

```
Ep_ "____________" (category) — records Mon ____ at NCM
[ ] 1. Plan: benefits chosen (1-2 CA + 1-2 county), guest decided, Notion brief   🎬🤖
[ ] 2. Research: one agent per benefit, primary sources                            🤖
[ ] 3. Draft: show/epN/epN-teleprompter.txt (CRLF, caps tags, spoken numbers)      🤖
[ ] 4. Fact-check: one agent per claim (refute), apply all fixes → report.json     🤖  ← GATE
[ ] 5. node scripts/sync-prompter.mjs epN ; host-cards.html                         🔧
[ ] 6. Copy epN-teleprompter.txt to portable drive → shoot                          🎬
--- record date ---
[ ] 7. whisper transcript → show/epN/edit-list.md (flub cuts)                       🔧🤖
[ ] 8. edit episode.filtergraph + render.sh → epN_FINAL.mp4 (select-filter!)        🔧
[ ] 9. week-of fact recheck (dates/prices/hours)                                    🤖
[ ] 10. publish: YouTube + /show + Notion, program cards, closing resources         🔧🎬
```

Notice the balance: of ten steps, only **two are irreducibly JP/Shawna/studio** (plan-approval and the shoot). Everything else is a script or an agent. That's the sustainability win — the founder is a *host and an approver*, not the whole assembly line.

---

## Reusable agent prompts

**Research agent (stage 2), one per benefit:**
> You are researching one public-benefit program for a Nevada County, CA audience episode of "Wait, I Qualify?!". Program: `<NAME>`. Report, each backed by a primary source URL (`.gov`/`.ca.gov`/county/official administrator only): (1) who qualifies — income thresholds AND categorical eligibility; (2) dollar amounts / what you get; (3) deadlines or enrollment windows; (4) exactly how to apply (phone/URL/in-person); (5) Nevada County specifics — local branches, hours, providers, phone numbers. Flag anything that changes soon (prices, hours, program sunsets). Return structured notes, not prose.

**Fact-check agent (stage 4), one per claim:**
> Adversarially verify this spoken claim from the Ep`<N>` script: "`<CLAIM>`". Try to REFUTE it against primary sources; default to skepticism. Return: verdict (`accurate` | `needs_fix`); the primary-source URL(s) you checked; a `burnRisk` note (how a host ad-libbing around this could mislead a vulnerable viewer); and if `needs_fix`, a concrete `scriptFix` — the corrected spoken line, numbers written as spoken, rounded conservatively. Never let an overstatement of reach or eligibility stand.

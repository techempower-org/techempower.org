# Ep1 — YouTube publish package

Turnkey copy-paste for publishing Episode 1 once the cut is locked.
Source of truth for the content: `ep1-teleprompter.txt`. Chapters need
timestamps from the **final** edit (the rough cut is 15:19 / 919 s).

> Prereqs (one-time): confirm the **TechEmpower YouTube channel** exists (create if not);
> then set `youtube` in `site.config.ts` so the site links it (see W2).

---

## Title (pick one)

1. **You Qualify for More Than You Think — Busting 4 Myths About Getting Help | Wait, I Qualify?! Ep. 1**  ← recommended (benefit-forward + brand)
2. 4 Myths That Keep You From Help You've Earned | Wait, I Qualify?! Ep. 1
3. $60 Billion in Help Goes Unclaimed Every Year — Do You Qualify? | Wait, I Qualify?! Ep. 1

Keep it under ~70 chars visible; lead with the hook, end with the series name + episode number.

---

## Description (paste as-is)

```
Most people qualify for far more help than they think — and every year an estimated $60 BILLION in benefits goes unclaimed, because people who are eligible never apply. In this first episode of "Wait, I Qualify?!", Shawna and Jeff from the nonprofit TechEmpower bust the four myths that stop people in Nevada County — and everywhere — from getting the aid they've earned.

🆘 NEED HELP RIGHT NOW? START HERE:
• Dial 2-1-1 — free, confidential, 24/7, English & Spanish. In Nevada County that's 211 Connecting Point. A real person helps you find food, housing, and health care.
• findhelp.org — enter your ZIP code for free & reduced-cost programs near you.
• techempower.org — step-by-step guides, plus "Join our Discord" for free one-on-one help. We answer.

IN THIS EPISODE — the four myths:
• Myth 1 — "Benefits are only for the truly destitute." (A family of four here can earn $66k — sometimes over $100k for housing programs — and still qualify.)
• Myth 2 — "I'd be taking it from someone who needs it more." (For the big programs there's no fixed pot — the funding grows to cover everyone eligible.)
• Myth 3 — "Good people don't take handouts." (Tell that to the corporations, the banks, and the airlines.)
• Myth 4 — "It's scary — what if I do it wrong?" (Apply honestly and the worst thing that happens is somebody tells you no.)

📚 Mentioned: "Escape from Capitalism" by economist Clara Mattei.

ABOUT: TechEmpower is a 501(c)(3) nonprofit in Grass Valley, California, working on digital equity and helping people find the aid and incentives they're entitled to — from local, state, and federal sources. New episodes on the 1st & 3rd Mondays. Produced with Nevada County Media.

#WaitIQualify #PublicBenefits #CalFresh #MediCal #NevadaCounty
```

> Note: every number above is drawn from the fact-checked script (`fact-check-full-report.json`), so it's safe to state publicly. Don't ad-lib new figures into the description.

---

## Chapters (timestamps from the July 1 rough cut — re-derive only if the cut changes)

```
00:00 Intro — the secret of the show
0:42 Myth 1: "Benefits are only for the truly destitute"
3:26 Myth 2: "Taking it from someone who needs it more"
6:03 Myth 3: "Good people don't take handouts"
10:35 Myth 4: "What if I do it wrong?"
14:07 What to do next — 211, findhelp.org, techempower.org
```

(Derived from the whisper transcript of `~/Videos/ep1-rough-cut-720p.mp4` (15:19). If the final upload uses a different cut, shift accordingly — the transcript lives at `/tmp/claude-1000/ep1-transcribe/`, regenerate with whisper-ctranslate2 if gone. Transcript bonus flags for the description writer: Jeff ad-libs "Shawna's twin" at 0:08; whisper mishears "techandpower.org" at 0:10 — known transcription quirk, audio is fine per edit-list review.)

---

## Tags / keywords

```
wait i qualify, public benefits, unclaimed benefits, how to apply for benefits, do I qualify,
CalFresh, food stamps, Medi-Cal, Medicaid, EITC, earned income tax credit, SSI, Section 8, HUD,
low income help, Nevada County, Grass Valley California, findhelp, 211, TechEmpower nonprofit
```

---

## Upload settings

- **Category:** Nonprofits & Activism (or Education)
- **Playlist:** create "Wait, I Qualify?!" and add every episode
- **Audience:** "No, it's not made for kids"
- **Visibility:** **Unlisted first** → share the link for a final look → flip to Public
- **Captions:** the teleprompter txt is near word-for-word — generate an `.srt` from the locked video with the pipeline's whisper step and correct against the txt, rather than trusting auto-captions (accessibility matters for this audience). Add Spanish captions when available.
- **Language:** English

---

## Thumbnail

Text-forward, warm earth-tone brand (use the sun mark from `~/Videos/logo/`):
- Big line: **"YOU QUALIFY FOR MORE THAN YOU THINK"** — or the punchier **"$60 BILLION GOES UNCLAIMED"**
- Shawna + Jeff on one side; show logo corner.
- High contrast, ≤ 6 words, readable at phone size.

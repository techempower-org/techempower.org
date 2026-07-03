# Wait, I Qualify?! — Episode 2

"Getting Connected" (internet + phone affordability)
Record: **Mon July 6, 2026** at Nevada County Media. No guest planned; ~13 min dialogue.

Canonical script + production checklist + fact-check live on the
Notion script page (Show planning DB). Files here are the local
production artifacts, same system as `show/ep1/`.

## Props (staging pass added July 2, 2026)

Three props on the desk, in reach order. **Prop honesty rule** (in the
prompter notes): say "like this one" unless the object IS the real
article — props must never create a claim the fact-check didn't verify.

| Prop                          | Beat                                                                                     | Status                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Smartphone (stand-in)         | Benefit 1 — Jeff holds up at the zero-dollar reveal, hands to Shawna                     | HAVE                                                                                                                               |
| **Library hotspot (genuine)** | Benefit 3 — the trophy reveal; "we checked this one out this week" + "goes back Tuesday" | **Pick up from Madelyn Helling BEFORE Monday** (place a catalog hold now if out; `[FALLBACK]` lines in script if it falls through) |
| Chromebook (stand-in)         | Benefit 4 — human-I-T beat, "like this one"                                              | HAVE                                                                                                                               |

Pre-roll: props on desk, screens clean, hotspot powered OFF.

## Screencasts (editor inserts — capture at EDIT time, not before)

Application screens overlay the dialogue (hosts keep talking). Capture
the week of the edit so screens match air-date reality; re-check against
the fact-check report before rendering.

**Week-of re-verify (2026-07-03, all claims STILL-ACCURATE — zero script
changes; full report: `~/.claude/projects/-home-jp/scratch/ep2-weekof-and-e5/`):**

- ⚠️ Screencast #3: **internetessentials.com is RETIRED** (301 + broken cert on
  www) — capture `xfinity.com/learn/internet-service/internet-essentials`
  instead; the $14.95/75Mbps facts are in the FAQ there, not the hero.
- ⚠️ Until Aug 3 the Xfinity hero runs a limited-time CA promo (IE Plus
  $9.95/6mo) — fine if it appears in frame, but don't caption it (unverified
  for air date).
- Current post-July-1 per-branch library hours are captured in the report for
  the program-card graphic (MH/GV Sat 9–4 · Truckee Sat CLOSED · PV M/W/F ·
  BR Tu/Th).

1. assurancewireless.com sign-up start screen (the apply flow's first page) — ~6s
2. californialifeline.com provider list for a Nevada County zip — ~4s
   _(July 2: the "two forms side-by-side" insert was dropped with the two-applications claim — see prompter notes; carrier-first flow per JP)_
3. Xfinity Internet Essentials page (eligibility checklist + $14.95 tile + address box) — ~7s
4. nevcofiber.com address/coverage check — ~6s
5. Library catalog: search "hotspot" → Place Hold — ~6s
6. computersforclassrooms.org store page (~$150 desktop bundle, warranty line visible) — ~6s
7. human-I-T shop page (refurb Chromebook listings) — ~5s

End card: conditional `/qualify` addition if the screener is live by air date — confirm with JP.

| File                          | What it is                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ep2-teleprompter.txt`        | **Studio master — copy to the portable drive for NCM.** Plain ASCII, CRLF line endings, ALL-CAPS speaker tags, `[bracket]` cues incl. `[PROP:]` staging + `[POST: SCREENCAST]` overlays (props/screencast pass July 2). Built from 8-agent program research + adversarial fact-check (June 11, 2026). Re-verify carrier plan details and library hours the week of taping. |
| `teleprompter.html`           | **Practice/rehearsal only.** Same app as Ep1; sync with `node scripts/sync-prompter.mjs ep2` after editing the txt. Sigil badge bottom-left changes when the script changes.                                                                                                                                                                                               |
| `host-cards.html`             | Printable backup note cards (Ctrl+P): Shawna S1–S5, Jeff J1–J3 (myth card cut July 2).                                                                                                                                                                                                                                                                                     |
| `fact-check-full-report.json` | Full 11-claim adversarial verification: verdicts, primary-source URLs, ad-lib guardrails, week-of re-check flags. All fixes are applied in the txt.                                                                                                                                                                                                                        |

Post-edit assets (jingle/logo/outro + on-screen program cards with
phone numbers and URLs) are due with the edit, not the shoot — the
`[POST: PROGRAM CARD ...]` cues in the script list each card's contents.

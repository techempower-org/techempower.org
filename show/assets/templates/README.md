# "Wait, I Qualify?!" — editable show templates (Canva)

Every on-screen graphic the show uses, as **editable templates in Canva** so the
editor can fill in cards without rebuilding the look. Source of truth is this
folder; the Canva copies are imports of the PPTX files in `out/`.

**Canva folder:** https://www.canva.com/folder/FAHU07wYF-E
(TechEMPOWER's Canva for Nonprofits team — share the folder with the editor.)

## What's in the folder

| Canva design | Built from | Pages |
| --- | --- | --- |
| WIQ — Series Template Kit | `out/wiq-series-template-kit.pptx` | intro title, lower thirds (Jeff / Shawna / guest), 3 program-card layouts, URL strap, book card, Find Help Today, outro end card, chart frame |
| WIQ — Ep2 Getting Connected … Ep6 (draft) | `out/wiq-epN-*.pptx` | intro + lower thirds + **every program card pre-filled from the script cues** + end card |
| WIQ — YouTube thumbnails | `out/wiq-youtube-thumbnails.pptx` | one 16:9 page per episode (Ep1–Ep6), photo placeholder on the right |
| TechEMPOWER — YouTube banner / avatar | `out/techempower-youtube-*.pptx` | rebuilt from `../youtube/*.src.html` |
| /qualify poster · flyer · counter cards | `../outreach/posters/*.pdf` | the print pack, imported as-is |

## Editor notes

- **Overlays (lower thirds, program cards, URL strap, book card, Find Help)
  have no background.** Export those pages as PNG with *Transparent background*
  ticked and they drop straight over the interview footage. Title, end card,
  chart frame and thumbnails are full-frame.
- **Every program card carries its source cue in the page notes**, plus a
  "Note:" where the script left something for the editor to verify. Numbers and
  URLs come from `show/epN/epN-teleprompter.txt`, which already has every
  fact-check fix applied. **If the audio disagrees with
  `show/epN/fact-check-full-report.json`, the JSON wins — flag it to JP.**
  Never overstate reach or eligibility on a card.
- Fonts are **Fraunces** (display) and **DM Sans** (body) — both in Canva's
  library, mapped automatically on import.
- Closing resources on every episode: 211, findhelp.org, techempower.org (and
  the Discord, via the site). Ep2's end card also carries `techempower.org/qualify`.
- Ep6 is a **DRAFT** — not fact-checked yet (PIPELINE stage 4 gate pending).
  Don't air its cards until the script clears.

## Rebuilding / adding an episode

1. Add the episode to `episodes.py`: title, subtitle, guests, `thumb_hook`,
   `end_lines`, and one `cards` entry per `[POST: PROGRAM CARD …]` cue (keep the
   verbatim cue in `cue`; anything the editor must check goes in `note`).
2. `uv run --with python-pptx show/assets/templates/build_templates.py`
3. Commit `out/*.pptx`, push, and import the new deck into Canva from its raw
   GitHub URL (`https://raw.githubusercontent.com/techempower-org/techempower.org/<branch>/show/assets/templates/out/<file>.pptx`)
   — Canva's *import-design-from-url* accepts PPTX and keeps text/shapes editable.
   Move it into the folder above.

Geometry is 1920×1080 pixel space (144 px/in on a 13.333×7.5 in slide); colours
are the Ep1 overlay palette (`../generate-ep1-overlays.py`) and the site tokens
(`styles/global.css`). Speaker notes on each page explain how it's used.

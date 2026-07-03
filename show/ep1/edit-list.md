# Ep1 Edit List — Verified Frame Numbers

Timeline: "Jeff - 6-15-26 v1", Timeline 2, 30fps, 1920x1080
Interview clip starts at frame 108009 (TC 01:00:00:09)
Formula: frame = 108009 + (seconds * 30)

## Cuts (remove these frame ranges)

| # | What | Frames | Duration | SRT | Notes |
|---|------|--------|----------|-----|-------|
| 1 | False start "Since the last 70s" | 108922–109157 | 7.8s | #22 | Clean restart in #23 |
| 2 | Stumble "What people folks" | 115599–115674 | 2.5s | #34 | Surgical mid-sentence cut |
| 3 | SVB false start | 122936–123262 | 10.9s | #77–78 | Includes #77 to avoid duplicate intro (verified) |
| 4 | Stumble "Look up" | 123625–123729 | 3.5s | #81 | Clean restart in #82 |
| 5 | Redundant "It's our Discord" | 125018–125060 | 1.4s | #175 | False start before scripted line |

Total cut: ~26.1 seconds. No overlaps between any cuts.

## Overlays (add at these frame ranges)

| # | What | Frames | Duration | Notes |
|---|------|--------|----------|-------|
| 1 | Jingle + logo intro | pre-108009 | ~7s | Pre-roll before interview |
| 2 | Lower third: **"Shawna Hein"** | 108110–108260 | 5s | After "I'm Shawna" — full name, same style as Jeff's tag |
| 3 | Lower third: **"Jeff Hein"** | 108337–108487 | 5s | After "And I'm Jeff" |
| 4 | Chart graphic | 113542–113903 | 12s | "Look at this chart" beat |
| 5 | Book cover | 127202–127475 | 9.1s | "Escape from Capitalism" mention (CORRECTED from workflow) |
| 6 | Outro jingle + end card | 135899+ | 10s+ | After final "You might be surprised" |

No overlaps between any overlays or between cuts and overlays.

**Overlay assets** live in the repo at `show/assets/logo/ep1-overlays/`
(`~/Videos/logo` is a symlink there, so Resolve's media links still
resolve). July 3 corrections: Shawna's lower third now reads **Shawna
Hein** (matching Jeff's), and the book card credits the verified author
**Clara E. Mattei** (the June 29 render said Matthew Desmond — wrong
author). Regenerate any overlay with `show/assets/generate-ep1-overlays.py`.
If Resolve still shows the old text: Playback → Delete Render Cache.

## Audio review flags (check in Resolve)

- SRT #2: "techandpower.org" vs "TechEmpower.org" — transcription error or actual misspeak?
- SRT #54: "shooting the system" vs "cheating the system" — likely whisper error
- SRT #145: "you can ask" vs "they can ask" — reversed subject
- SRT #165: "Corey we go" vs "Before we go" — possible stumble
- SRT #167: "many phone" vs "any phone" — possible misspeak

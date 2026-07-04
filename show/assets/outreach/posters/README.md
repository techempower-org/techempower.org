# /qualify QR poster pack

Print outreach for the benefits screener — **[techempower.org/qualify](https://techempower.org/qualify)**
([issue #70](https://github.com/techempower-org/techempower.org/issues/70)). Bilingual EN/ES
line-for-line (one sheet serves both — food-bank convention), earth-tone brand,
designed to read from 6 feet **and survive a B&W laser printer**.

## Files

| File | What it is |
| --- | --- |
| `poster-letter.pdf` | US-letter poster (8.5×11") — walls, bulletin boards |
| `flyer-half.pdf` | Half-sheet flyer, 2-up on letter — cut once, hand out |
| `cards.pdf` | 3.5×2" counter cards, 10-up on letter — front desks |
| `poster.html` | Self-contained source (fonts + QR inlined) — open in a browser to preview all three |
| `poster.template.html` | Design source; `build.sh` injects fonts/QR into it |
| `qualify-qr.svg` | Standalone QR asset (error correction Q) |
| `previews/*-gray.png` | Grayscale proofs — what a partner's B&W laser will actually print |
| `build.sh` | Regenerates everything |

## Decisions baked in

- **QR is the clean URL — no `?src=` tracking param.** Issue #70 left this open;
  resolved against: the poster's whole promise is privacy, and page-view analytics
  already count visits. Verified by machine-decoding the rendered PDF
  (`zbarimg` → `https://techempower.org/qualify`, exact).
- Copy is the screener's own canonical strings (`lib/screener/data/strings.*.json`):
  hero = the `/qualify` page title ("Wait — do I qualify?" / "¿Y si sí califico?"),
  privacy = `page.promise` (phone-variant), formal *usted* throughout.
- Fonts are the repo's OG-card subsets (`lib/fonts/*.ts`) — real Fraunces 600 /
  DM Sans 500+700 with Spanish glyphs, embedded as data URIs. Print shops need nothing.
- White page background (no bleed required on office printers); every color chosen
  to hold contrast in grayscale (teal ≈ 30% gray; amber used only decoratively).

## Print specs

| | Paper | Notes |
| --- | --- | --- |
| Poster | 24–32 lb bright white, letter | Print at **100% / Actual size** (no fit-to-page), portrait |
| Flyer | 20–24 lb, letter | Cut on the dashed ✂ line → two 8.5×5.5" flyers |
| Cards | 65–80 lb cardstock **or Avery 5371** | Grid matches Avery 5371 exactly (0.75" side / 0.5" top margins, 2×5, no gutters); on plain stock cut on the hairlines |

Color when available; all three are designed for B&W lasers — check `previews/`
before a print run. Poster footer carries a run tag (`v1 · July 2026`) — bump it
in `poster.template.html` when copy changes so stale posters are identifiable.

## Distribution checklist — ask permission at every location first

Log who said yes and when in the Status column.

| Location | Bring | Status |
| --- | --- | --- |
| Interfaith Food Ministry — check-in | poster + counter cards | |
| Food Bank of Nevada County — distribution days | flyers (hand out in line) + poster | |
| Library branches (all 6) — community boards | poster (ask at the desk) | |
| Laundromats (Grass Valley / Nevada City) | poster, eye level near folding tables | |
| Project GO office | poster + cards (they run WAP — natural partner) | |
| DSS lobbies | poster — **ask first** (issue #70 note) | |
| NCM bulletin board | poster | |

## Regenerate

```bash
./build.sh
```

Deps: `qrencode`, `google-chrome` (or chromium), `python3`, `pdftoppm`
(poppler-utils). The script rebuilds the QR, re-inlines fonts from
`lib/fonts/*.ts`, renders the three PDFs via headless Chrome
(`?sheet=poster|flyer|cards` selects the format), and refreshes the grayscale
proofs. Edit copy/layout in `poster.template.html` only — `poster.html` and the
PDFs are build artifacts, committed so partners and JP can grab them directly.

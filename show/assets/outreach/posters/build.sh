#!/usr/bin/env bash
# Rebuild the /qualify poster pack (issue #70).
#   poster.template.html ──(inject fonts + QR + cards)──▶ poster.html
#   poster.html ──(headless Chrome)──▶ poster-letter.pdf / flyer-half.pdf / cards.pdf
#   PDFs ──(pdftoppm -gray)──▶ previews/*.png   (grayscale proofs — most partner
#                                                printers are B&W lasers)
# Deps: qrencode, google-chrome (or chromium), python3, pdftoppm (poppler-utils).
# Fonts come from the repo's own OG-card subsets (lib/fonts/*.ts) — real
# Fraunces 600 / DM Sans 500+700, Spanish glyphs included.
set -euo pipefail
cd "$(dirname "$0")"
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Clean URL by design: no ?src= tracking param. Page-view analytics already
# count visits; the poster carries the privacy brand (decision on issue #70).
URL='https://techempower.org/qualify'

command -v qrencode >/dev/null || { echo 'missing qrencode (sudo apt-get install -y qrencode)' >&2; exit 1; }
command -v pdftoppm >/dev/null || { echo 'missing pdftoppm (sudo apt-get install -y poppler-utils)' >&2; exit 1; }
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
  || { echo 'missing google-chrome / chromium' >&2; exit 1; }

# 1 · QR (SVG, error-correction Q — survives grime and low-end phone cameras)
qrencode -t SVG -l Q -m 4 -o qualify-qr.svg "$URL"

# 2 · assemble self-contained poster.html
REPO_ROOT="$REPO_ROOT" python3 - <<'PYEOF'
import os, pathlib, re

root = pathlib.Path(os.environ['REPO_ROOT'])
tpl = pathlib.Path('poster.template.html').read_text()

def font_b64(name: str) -> str:
    src = (root / 'lib' / 'fonts' / f'{name}.ts').read_text()
    m = re.search(r"'([A-Za-z0-9+/=\s]{1000,})'", src)
    if not m:
        raise SystemExit(f'could not extract base64 from lib/fonts/{name}.ts')
    return ''.join(m.group(1).split())

qr = pathlib.Path('qualify-qr.svg').read_text()
inner = qr[qr.index('<g id="QRcode">'):qr.rindex('</svg>')]

card = '''<div class="card">
  <svg class="qr" viewBox="0 0 37 37" role="img" aria-label="QR code for techempower.org/qualify"><use href="#qr-mark"/></svg>
  <div class="txt">
    <h3>Wait &mdash; do I qualify?</h3>
    <p class="facts">2 min &middot; anonymous &middot; free<br><span class="es" lang="es">2 min &middot; an&oacute;nimo &middot; gratis</span></p>
    <span class="url">techempower.org/qualify</span>
  </div>
</div>'''

out = (tpl
       .replace('__FRAUNCES600__', font_b64('fraunces-600'))
       .replace('__DMSANS500__', font_b64('dmsans-500'))
       .replace('__DMSANS700__', font_b64('dmsans-700'))
       .replace('__QR_INNER__', inner)
       .replace('__CARDS__', '\n'.join([card] * 10)))
pathlib.Path('poster.html').write_text(out)
print(f'poster.html written ({len(out) // 1024} KB, self-contained)')
PYEOF

# 3 · render PDFs (one sheet per run via ?sheet=)
for pair in poster:poster-letter flyer:flyer-half cards:cards; do
  sheet="${pair%%:*}" out="${pair##*:}"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --no-pdf-header-footer \
    --virtual-time-budget=4000 --print-to-pdf="$out.pdf" \
    "file://$PWD/poster.html?sheet=$sheet" 2>/dev/null
  echo "$out.pdf"
done

# 4 · grayscale proofs (what a partner B&W laser will actually produce)
mkdir -p previews
for f in poster-letter flyer-half cards; do
  pdftoppm -png -r 72 -gray -singlefile "$f.pdf" "previews/$f-gray"
done
echo "previews/ refreshed — check legibility before printing"

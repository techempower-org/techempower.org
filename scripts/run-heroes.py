#!/usr/bin/env python3
"""
Drive scripts/generate-cover.py over scripts/heroes.json, sequentially, and
write {page_id, title, url} results to scripts/heroes-results.json so the
next step (Notion cover update) can pick them up.

Skips entries flagged with `_status: "already_generated"`.
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
HEROES = HERE / "heroes.json"
RESULTS = HERE / "heroes-results.json"
PUB = "https://pub-f94e62ffd9ac4b6888afd6948c4ccb5e.r2.dev"


def main() -> int:
    items = json.loads(HEROES.read_text())
    print(f"Processing {len(items)} hero pages…", file=sys.stderr)

    results: list[dict] = []
    for i, item in enumerate(items, 1):
        pid = item["page_id"]
        label = f"[{i}/{len(items)}] {pid[:8]} ({item['title'][:50]})"
        if item.get("_status") == "already_generated":
            url = f"{PUB}/covers/{pid}.png"
            print(f"{label}  reusing {url}", file=sys.stderr)
        else:
            payload = json.dumps(
                {
                    "page_id": pid,
                    "title": item["title"],
                    "summary": item.get("summary", ""),
                    "quality": item.get("quality", "ultra"),
                }
            )
            t0 = time.time()
            proc = subprocess.run(
                ["python3", str(HERE / "generate-cover.py")],
                input=payload,
                capture_output=True,
                text=True,
                cwd=ROOT,
            )
            dt = time.time() - t0
            if proc.returncode != 0:
                print(f"{label}  FAIL ({dt:.1f}s): {proc.stderr.strip().splitlines()[-1] if proc.stderr else ''}", file=sys.stderr)
                continue
            url = proc.stdout.strip()
            print(f"{label}  {dt:.1f}s → {url}", file=sys.stderr)

        results.append(
            {
                "page_id": pid,
                "title": item["title"],
                "url": url,
            }
        )

    RESULTS.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {len(results)} results to {RESULTS}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Run scripts/generate-cover.py over a JSON batch file of resources, writing
{page_id, title, url} results to <batch>.results.json. Title-only prompting
(no Notion fetch) — fast, rich enough for resource directory entries.

Usage:
    python3 scripts/run-batch.py scripts/resource-batches/batch-1.json

Default quality: core. Override with QUALITY=ultra env var.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def main(batch_path_str: str) -> int:
    batch_path = Path(batch_path_str)
    items = json.loads(batch_path.read_text())
    quality = os.environ.get("QUALITY", "core")
    print(f"Batch {batch_path.name}: {len(items)} items (quality={quality})", file=sys.stderr)

    results: list[dict] = []
    failures: list[dict] = []
    for i, item in enumerate(items, 1):
        pid = item["page_id"].replace("-", "")
        title = item.get("title", "(untitled)")
        summary = item.get("summary", "")
        label = f"  [{i:2d}/{len(items)}] {pid[:8]} ({title[:55]})"
        payload = json.dumps(
            {"page_id": pid, "title": title, "summary": summary, "quality": quality}
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
            tail = (proc.stderr.strip().splitlines() or [""])[-1]
            print(f"{label}  FAIL ({dt:.1f}s): {tail}", file=sys.stderr)
            failures.append({"page_id": pid, "title": title, "error": tail})
            continue
        url = proc.stdout.strip()
        print(f"{label}  {dt:.1f}s", file=sys.stderr)
        results.append({"page_id": pid, "title": title, "url": url})

    out = batch_path.with_suffix(".results.json")
    out.write_text(json.dumps(results, indent=2))
    print(f"\n{len(results)} ok, {len(failures)} failed → {out}", file=sys.stderr)
    if failures:
        fail_path = batch_path.with_suffix(".failures.json")
        fail_path.write_text(json.dumps(failures, indent=2))
        print(f"  failures → {fail_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: run-batch.py <batch.json>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

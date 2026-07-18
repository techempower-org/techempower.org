#!/usr/bin/env python3
"""
Apply generated cover URLs to Notion pages — the final pipeline step after
scripts/run-batch.py. Reads a results JSON ({page_id, title, url} rows) and
PATCHes each page's cover via the official Notion API.

Usage:
    NOTION_TOKEN=ntn_… python3 scripts/apply-covers.py \
        scripts/resource-batches/batch-6-missing-covers.results.json

The integration behind NOTION_TOKEN must be added to the Resources DB
(Notion: ••• → Connections). Exit 0 only if every page succeeded.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request

API = "https://api.notion.com/v1/pages/"
VERSION = "2022-06-28"


def apply_cover(token: str, page_id: str, url: str) -> tuple[bool, str]:
    body = json.dumps(
        {"cover": {"type": "external", "external": {"url": url}}}
    ).encode()
    req = urllib.request.Request(
        API + page_id,
        data=body,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": VERSION,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:200]
        return False, f"HTTP {e.code}: {detail}"
    except OSError as e:
        return False, str(e)


def main() -> int:
    token = os.environ.get("NOTION_TOKEN", "").strip()
    if not token:
        print("NOTION_TOKEN not set", file=sys.stderr)
        return 2
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2

    rows = json.loads(open(sys.argv[1]).read())
    failures = 0
    for i, row in enumerate(rows, 1):
        ok, msg = apply_cover(token, row["page_id"], row["url"])
        mark = "ok" if ok else f"FAIL ({msg})"
        print(f"  [{i:2d}/{len(rows)}] {row['page_id'][:8]} {row['title'][:50]:50s} {mark}")
        if not ok:
            failures += 1
        time.sleep(0.4)  # stay under Notion's 3 req/s
    print(f"{len(rows) - failures} ok, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

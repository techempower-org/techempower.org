#!/usr/bin/env python3
"""
Single-page cover generator: Claude refines article → Stable Image renders
→ wrangler uploads to R2 → prints the public r2.dev URL on stdout.

Usage (JSON on stdin):
    echo '{"page_id":"…","title":"…","summary":"…","quality":"core"}' | \
        python3 scripts/generate-cover.py

Output: public PNG URL on stdout, log lines on stderr.
Exit: 0 success, non-zero on any failure (R2 upload, model call, etc.).

Requirements:
- AWS credentials configured (~/.aws/credentials), us-west-2 access
- `pnpm exec wrangler` reachable from cwd
- Cloudflare wrangler OAuth authenticated to TechEmpower account
"""

from __future__ import annotations

import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import boto3
from botocore.config import Config

REGION = "us-west-2"
TEXT_MODEL = "us.anthropic.claude-opus-4-7"
IMAGE_MODEL_CORE = "stability.stable-image-core-v1:1"
IMAGE_MODEL_ULTRA = "stability.stable-image-ultra-v1:1"

BUCKET = "techempower-covers"
PUBLIC_BASE = "https://pub-f94e62ffd9ac4b6888afd6948c4ccb5e.r2.dev"

# Locked style (round 2 winner: warm photo-illustration, no people, no text).
# Empirically Stable Image often ignores style suffix when the subject sentence
# is rich, which gave us the desirable photo-realistic illustrations in tests.
STYLE_SUFFIX = (
    "warm photographic illustration in golden-hour light, cozy and inviting, "
    "edge-to-edge horizontal banner composition, no people, no human figures, "
    "no faces, no text, no logos, accessible and hopeful atmosphere, "
    "consistent visual identity for a nonprofit guide collection"
)
NEGATIVE = (
    "person, people, human, face, body, portrait, hands, text, words, "
    "letters, logo, watermark, dark, scary, harsh contrast, busy clutter"
)


def distill_scene(client: object, title: str, summary: str) -> str:
    """Use Claude Opus to distill article title+summary into a concrete visual scene."""
    sys_prompt = (
        "You write 1-sentence visual prompts for an image generator. The "
        "image is a book-cover-style banner. Your job: read an article "
        "title and summary, then describe ONE concrete, simple visual scene "
        "(objects, setting, atmosphere) that conveys the article's "
        "subject. NO people, NO faces, NO text. Be specific and visual. "
        "Use 15-30 words. Example for a cooking article: 'A wooden kitchen "
        "table with a bowl of fresh tomatoes, a wooden spoon, and a sprig "
        "of basil, soft morning light through a window.'"
    )
    user_prompt = (
        f"Article title: {title}\n"
        f"Article summary: {summary or '(no summary; use the title only)'}\n\n"
        f"Write the 1-sentence visual scene now."
    )
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 200,
            "system": sys_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
    )
    response = client.invoke_model(modelId=TEXT_MODEL, body=body)
    payload = json.loads(response["body"].read())
    scene = payload["content"][0]["text"].strip().strip('"').strip("'")
    return scene


def generate_image(client: object, model_id: str, prompt: str) -> bytes:
    body = json.dumps(
        {
            "prompt": prompt[:1500],
            "negative_prompt": NEGATIVE[:500],
            "aspect_ratio": "16:9",
            "output_format": "png",
            "seed": 0,
        }
    )
    response = client.invoke_model(modelId=model_id, body=body)
    payload = json.loads(response["body"].read())
    return base64.b64decode(payload["images"][0])


def upload_to_r2(png_bytes: bytes, page_id: str) -> str:
    """Upload PNG to R2 via wrangler; return public URL."""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(png_bytes)
        tmp_path = tmp.name
    try:
        # `--remote` forces upload to the actual remote bucket
        # (default in some wrangler versions writes to local simulation).
        # `--content-type` so the public URL serves the right MIME.
        result = subprocess.run(
            [
                "pnpm", "exec", "wrangler", "r2", "object", "put",
                f"{BUCKET}/covers/{page_id}.png",
                "--file", tmp_path,
                "--remote",
                "--content-type", "image/png",
            ],
            capture_output=True, text=True, cwd=Path(__file__).resolve().parent.parent,
        )
        if result.returncode != 0:
            raise RuntimeError(f"wrangler r2 put failed: {result.stderr or result.stdout}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    return f"{PUBLIC_BASE}/covers/{page_id}.png"


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        print("error: empty stdin (expected JSON {page_id, title, summary, quality})", file=sys.stderr)
        return 2
    req = json.loads(raw)
    page_id = req["page_id"].replace("-", "")
    title = req.get("title", "").strip() or "(untitled)"
    summary = req.get("summary", "").strip()
    quality = req.get("quality", "core").lower()
    model_id = IMAGE_MODEL_ULTRA if quality == "ultra" else IMAGE_MODEL_CORE

    boto_config = Config(read_timeout=180, retries={"max_attempts": 3})
    client = boto3.client("bedrock-runtime", region_name=REGION, config=boto_config)

    try:
        scene = distill_scene(client, title, summary)
        print(f"[{page_id[:8]}] scene: {scene}", file=sys.stderr)
    except Exception as e:
        print(f"[{page_id[:8]}] distill failed: {e}", file=sys.stderr)
        return 3

    prompt = f"{scene} {STYLE_SUFFIX}"
    try:
        png = generate_image(client, model_id, prompt)
        print(f"[{page_id[:8]}] generated {len(png) // 1024} KB via {quality}", file=sys.stderr)
    except Exception as e:
        print(f"[{page_id[:8]}] gen failed: {e}", file=sys.stderr)
        return 4

    try:
        url = upload_to_r2(png, page_id)
        print(f"[{page_id[:8]}] uploaded → {url}", file=sys.stderr)
    except Exception as e:
        print(f"[{page_id[:8]}] upload failed: {e}", file=sys.stderr)
        return 5

    # Stdout gets ONLY the URL — easy for callers to capture.
    print(url)
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Round 2 of cover-test gen: lock style to paper-collage and use Claude
(via Bedrock) to first distill each article into a concrete visual
scene sentence. Goal is to actually convey what the article is ABOUT,
which round 1 totally failed to do (every style drew a Nevada-County
landscape no matter what the article topic was).

Output:
    ~/.claude/projects/-home-jp-Projects-techempower/scratch/cover-tests/
    v2__{article-slug}.png

Run:
    python3 scripts/generate-cover-test-v2.py
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

import boto3
from botocore.config import Config

OUT_DIR = Path.home() / ".claude/projects/-home-jp-Projects-techempower/scratch/cover-tests"
OUT_DIR.mkdir(parents=True, exist_ok=True)

REGION = "us-west-2"
IMAGE_MODEL = "stability.stable-image-core-v1:1"
# Claude Opus 4.7 in us-west-2 via inference profile
TEXT_MODEL = "us.anthropic.claude-opus-4-7"

ARTICLES = [
    {
        "slug": "free-internet",
        "title": "Free Internet for Low-Income Households",
        "summary": (
            "How low-income families in Nevada County, California can get "
            "free or $10/month internet. Lifeline subsidy, AT&T Access, "
            "Comcast Internet Essentials, free Wi-Fi hotspots from the "
            "library. Step-by-step guidance for people on CalFresh, "
            "Medi-Cal, or SNAP."
        ),
    },
    {
        "slug": "ebt-spending",
        "title": "My Favorite Places to Spend EBT",
        "summary": (
            "Stretching CalFresh EBT benefits at the Nevada City Farmers "
            "Market and Mountain Bounty Farm. Market Match doubles your "
            "fresh-produce dollars. Online EBT at Amazon, Walmart, "
            "Instacart. Fresh local food for low-income families."
        ),
    },
    {
        "slug": "candela",
        "title": "Candela: TechEmpower Guides as Audiobooks",
        "summary": (
            "A free Android audiobook app that reads digital-equity guides "
            "aloud using offline neural text-to-speech. Built for "
            "accessibility — visually impaired users, low literacy, "
            "audio-while-driving. Open source, no ads, no tracking."
        ),
    },
]

# Locked style — paper-collage. Style words appended AFTER the visual scene.
STYLE_SUFFIX = (
    "torn-paper collage illustration, layered cut paper with subtle paper "
    "texture and soft drop shadows, warm earth-tone palette (kraft brown, "
    "cream, terracotta, sage, soft amber), tactile and crafty, edge-to-edge "
    "horizontal banner composition, no people, no human figures, no faces, "
    "no text, no logos"
)
NEGATIVE = (
    "person, people, human, face, body, portrait, hands, text, words, "
    "letters, logo, watermark, photograph, photorealistic, dark, scary, "
    "harsh contrast"
)


def distill_scene(client, article: dict) -> str:
    """Use Claude to convert article title+summary into a concrete visual scene."""
    sys_prompt = (
        "You write 1-sentence visual prompts for an image generator. The "
        "image is a book-cover-style banner. Your job: read an article "
        "title and summary, then describe ONE concrete, simple visual scene "
        "(objects, setting, atmosphere) that conveys the article's "
        "subject. NO people, NO faces, NO text. Be specific and visual. "
        "Use 15-30 words. Example for an article about cooking: 'A wooden "
        "kitchen table with a bowl of fresh tomatoes, a wooden spoon, "
        "and a sprig of basil, soft morning light through a window.'"
    )
    user_prompt = (
        f"Article title: {article['title']}\n"
        f"Article summary: {article['summary']}\n\n"
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
    scene = payload["content"][0]["text"].strip()
    # Strip surrounding quotes if Claude added any
    scene = scene.strip('"').strip("'")
    return scene


def generate_image(client, prompt: str, negative: str) -> bytes:
    body = json.dumps(
        {
            "prompt": prompt[:1500],
            "negative_prompt": negative[:500],
            "aspect_ratio": "16:9",
            "output_format": "png",
            "seed": 0,
        }
    )
    response = client.invoke_model(modelId=IMAGE_MODEL, body=body)
    payload = json.loads(response["body"].read())
    return base64.b64decode(payload["images"][0])


def main() -> int:
    boto_config = Config(read_timeout=120, retries={"max_attempts": 3})
    client = boto3.client("bedrock-runtime", region_name=REGION, config=boto_config)

    for article in ARTICLES:
        print(f"\n=== {article['slug']} ===", flush=True)
        try:
            scene = distill_scene(client, article)
            print(f"  scene: {scene}", flush=True)
        except Exception as e:
            print(f"  ERROR distilling: {e}", flush=True)
            continue
        prompt = f"{scene} {STYLE_SUFFIX}"
        try:
            png = generate_image(client, prompt, NEGATIVE)
            out = OUT_DIR / f"v2__{article['slug']}.png"
            out.write_bytes(png)
            print(f"  saved → {out.name} ({len(png) // 1024} KB)", flush=True)
        except Exception as e:
            print(f"  ERROR generating: {e}", flush=True)

    print(f"\nDone. Output: {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

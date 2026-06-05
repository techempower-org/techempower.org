#!/usr/bin/env python3
"""
Generate a small grid of candidate cover images via AWS Bedrock Nova Canvas
to compare style prompts before committing to a full-catalog batch.

Per article × per style = 1 image. Saved to:
    ~/.claude/projects/-home-jp-Projects-techempower/scratch/cover-tests/
    {article-slug}__{style-slug}.png

Run:
    python3 scripts/generate-cover-test.py

Requirements:
    - AWS_REGION + credentials configured (~/.aws/credentials)
    - Nova Canvas model access enabled in the region
    - boto3 installed
"""

from __future__ import annotations

import base64
import json
import os
import re
import sys
from pathlib import Path

import boto3
from botocore.config import Config

OUT_DIR = Path.home() / ".claude/projects/-home-jp-Projects-techempower/scratch/cover-tests"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Amazon's Nova Canvas + Titan Image are both Legacy now. The active
# text-to-image models in Bedrock are Stability AI's Stable Image Core
# (fast, ~$0.04/img) and Ultra (high quality, ~$0.08/img), available
# only in us-west-2 at time of writing.
REGION = "us-west-2"
MODEL_ID = "stability.stable-image-core-v1:1"

# Test articles: title + the 1-paragraph summary we want the cover to evoke.
# Keep summaries short — Nova Canvas prompts work best at ~60-100 words.
ARTICLES = [
    {
        "slug": "free-internet",
        "title": "Free Internet for Low-Income Households",
        "summary": (
            "How low-income families in Nevada County, California can get free "
            "or $10/month internet. Lifeline subsidy, AT&T Access, Comcast "
            "Internet Essentials, free Wi-Fi hotspots from the library. "
            "Step-by-step guidance for people on CalFresh, Medi-Cal, or SNAP."
        ),
    },
    {
        "slug": "ebt-spending",
        "title": "My Favorite Places to Spend EBT",
        "summary": (
            "Stretching CalFresh EBT benefits at the Nevada City Farmers "
            "Market and Mountain Bounty Farm. Market Match doubles "
            "your fresh-produce dollars. Online EBT at Amazon, Walmart, "
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

# 4 candidate style prefixes. Each pairs with the article's title+summary.
STYLES = [
    {
        "slug": "watercolor-warm",
        "label": "Soft watercolor, warm earth tones",
        "prefix": (
            "warm watercolor illustration in soft earth tones (terracotta, "
            "cream, amber, sage), painterly with visible brushwork, "
            "edge-to-edge composition, no human faces, gentle and hopeful "
            "atmosphere, accessible nonprofit aesthetic, subject:"
        ),
        "negative": "logo, text, watermark, person face, photograph, harsh contrast, dark, scary",
    },
    {
        "slug": "flat-bold",
        "label": "Flat illustration, bold color blocks",
        "prefix": (
            "flat vector illustration with bold color blocks (warm "
            "amber, teal, cream, soft coral), geometric and modern, clean "
            "lines, edge-to-edge composition, no human faces, friendly and "
            "approachable, accessible nonprofit aesthetic, subject:"
        ),
        "negative": "logo, text, watermark, person face, photograph, gradient mesh",
    },
    {
        "slug": "lineart-wash",
        "label": "Editorial line art with muted watercolor wash",
        "prefix": (
            "editorial illustration: confident black ink line art over muted "
            "watercolor wash (sage, amber, terracotta), New Yorker magazine "
            "feel, sophisticated and calm, edge-to-edge composition, no human "
            "faces, accessible nonprofit aesthetic, subject:"
        ),
        "negative": "logo, text, watermark, person face, photograph, sketch lines, child-like",
    },
    {
        "slug": "paper-collage",
        "label": "Warm paper-collage with subtle texture",
        "prefix": (
            "torn-paper collage illustration with subtle paper texture and "
            "soft drop shadows, warm palette (kraft brown, cream, terracotta, "
            "soft green), tactile and crafty, edge-to-edge composition, no "
            "human faces, accessible nonprofit aesthetic, friendly and human, "
            "subject:"
        ),
        "negative": "logo, text, watermark, person face, photograph, harsh edges, dark",
    },
]


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def generate(client, model_id: str, prompt: str, negative: str) -> bytes:
    """Call Bedrock Stable Image Core; returns PNG bytes."""
    body = json.dumps(
        {
            # Stability's hard limit on the prompt is 10,000 chars, but
            # quality drops past ~500. The negative_prompt has the same
            # limit. Trim conservatively.
            "prompt": prompt[:1500],
            "negative_prompt": negative[:500],
            # Notion banners crop to a wide aspect — 16:9 fits cleanly.
            "aspect_ratio": "16:9",
            "output_format": "png",
            "seed": 0,
        }
    )
    response = client.invoke_model(modelId=model_id, body=body)
    payload = json.loads(response["body"].read())
    return base64.b64decode(payload["images"][0])


def main() -> int:
    boto_config = Config(read_timeout=120, retries={"max_attempts": 3})
    client = boto3.client("bedrock-runtime", region_name=REGION, config=boto_config)

    total = len(ARTICLES) * len(STYLES)
    done = 0
    failures: list[str] = []

    for article in ARTICLES:
        # Compose subject text from title + summary; let style prefix do styling.
        subject = f"{article['title']}. {article['summary']}"
        for style in STYLES:
            done += 1
            out = OUT_DIR / f"{article['slug']}__{style['slug']}.png"
            label = f"[{done}/{total}] {article['slug']} × {style['slug']}"
            print(label, flush=True)
            prompt = style["prefix"] + " " + subject
            try:
                png = generate(client, MODEL_ID, prompt, style["negative"])
                out.write_bytes(png)
                print(f"    saved → {out.name} ({len(png) // 1024} KB)", flush=True)
            except Exception as e:
                failures.append(f"{article['slug']}/{style['slug']}: {e}")
                print(f"    ERROR: {e}", flush=True)

    print(f"\nDone: {done - len(failures)}/{total} succeeded")
    print(f"Output dir: {OUT_DIR}")
    if failures:
        print("Failures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

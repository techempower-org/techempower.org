#!/usr/bin/env bash
# Deploy to Cloudflare Workers using Cloudflare secrets pulled from Bitwarden.
#
# Prereqs:
#   - Bitwarden CLI (`bw`) installed and logged in.
#   - `jq` installed.
#   - Vault unlocked: `export BW_SESSION=$(bw unlock --raw)`
#   - Bitwarden item "techempower cloudflare api" (secure note) with:
#       - notes       -> CLOUDFLARE_API_TOKEN
#       - custom "id" -> CLOUDFLARE_ACCOUNT_ID

set -euo pipefail

ITEM_NAME="techempower cloudflare api"

if ! command -v bw >/dev/null 2>&1; then
  echo "error: bw (Bitwarden CLI) not found on PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq not found on PATH" >&2
  exit 1
fi

bw_status="$(bw status 2>/dev/null || true)"
if ! printf '%s' "$bw_status" | grep -q '"status":"unlocked"'; then
  echo "error: Bitwarden vault is locked (or bw is not logged in)." >&2
  echo "       run: export BW_SESSION=\$(bw unlock --raw)" >&2
  exit 1
fi

item_json="$(bw get item "$ITEM_NAME")"
CLOUDFLARE_API_TOKEN="$(printf '%s' "$item_json" | jq -r '.notes // ""')"
CLOUDFLARE_ACCOUNT_ID="$(printf '%s' "$item_json" | jq -r '.fields[]? | select(.name=="id") | .value')"

if [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ACCOUNT_ID" ]]; then
  echo "error: could not read CLOUDFLARE_API_TOKEN (notes) or CLOUDFLARE_ACCOUNT_ID (custom field 'id')" >&2
  echo "       from Bitwarden item '$ITEM_NAME'" >&2
  exit 1
fi

export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

exec pnpm cf:deploy

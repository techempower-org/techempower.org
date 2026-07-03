#!/usr/bin/env bash
# Encode a Resolve master (DNxHR .mov) into the two distribution files:
#   <prefix>-youtube.mp4       1080p H.264, ~11-12 Mb/s  (upload tier)
#   <prefix>-720p-slack.mp4    720p,       ~1.1 Mb/s     (share tier, ~8 MB/min)
#
# Usage:
#   show/assets/encode-episode.sh "/home/jp/Videos/Ep1 MASTER (logo intro).mov" [out-prefix]
#
# out-prefix defaults to ~/Videos/<master-basename-slugged>; pass e.g.
# "~/Videos/ep2-final" to control the names. Uses the GPU (h264_nvenc)
# when available, falls back to libx264. Free Resolve on Linux can't
# export H.264 itself — this is the second half of the deliver pipeline.
set -euo pipefail

MASTER="${1:?usage: encode-episode.sh <master.mov> [out-prefix]}"
[ -f "$MASTER" ] || { echo "no such file: $MASTER" >&2; exit 1; }

if [ "${2:-}" ]; then
  PREFIX="$2"
else
  base=$(basename "${MASTER%.*}" | tr 'A-Z ' 'a-z-' | tr -cd 'a-z0-9._-')
  PREFIX="$HOME/Videos/${base}"
fi

if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q h264_nvenc; then
  V_HQ=(-c:v h264_nvenc -preset p7 -rc vbr -cq 20 -b:v 0 -maxrate 15M -bufsize 30M)
  V_SM=(-c:v h264_nvenc -preset p6 -rc vbr -cq 32 -b:v 0 -maxrate 1.5M -bufsize 3M)
else
  V_HQ=(-c:v libx264 -preset slow -crf 19 -maxrate 15M -bufsize 30M)
  V_SM=(-c:v libx264 -preset medium -crf 28 -maxrate 1.5M -bufsize 3M)
fi

echo "== youtube tier -> ${PREFIX}-youtube.mp4"
ffmpeg -hide_banner -y -i "$MASTER" "${V_HQ[@]}" -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "${PREFIX}-youtube.mp4"

echo "== slack tier   -> ${PREFIX}-720p-slack.mp4"
ffmpeg -hide_banner -y -i "$MASTER" -vf "scale=1280:720" "${V_SM[@]}" -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart "${PREFIX}-720p-slack.mp4"

echo "== done:"
du -h "${PREFIX}-youtube.mp4" "${PREFIX}-720p-slack.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "${PREFIX}-youtube.mp4" \
  | awk '{printf "duration: %d:%05.2f\n", $1/60, $1%60}'

#!/usr/bin/env bash
cd /home/jp/Videos
rm -f episode1_FINAL.mp4 /tmp/te_render_done
ffmpeg -y -i techempower-eps1.mp4 -loop 1 -t 12 -i logo/chart_housing.png -loop 1 -t 7.4 -i logo/techempower-sun.png -i jingles/jingle_01_warm-piano.wav \
 -filter_complex_script episode.filtergraph -map "[fv]" -map "[fa]" \
 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart \
 episode1_FINAL.mp4
rc=$?
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 episode1_FINAL.mp4 2>/dev/null)
sz=$(ls -la episode1_FINAL.mp4 2>/dev/null | awk '{print int($5/1048576)}')
echo "exit=$rc dur=${dur}s size=${sz}MB" > /tmp/te_render_done

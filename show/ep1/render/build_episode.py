#!/usr/bin/env python
import sys
from moviepy import (VideoFileClip, ImageClip, ColorClip, AudioFileClip,
                     CompositeVideoClip, concatenate_videoclips, vfx, afx)

SRC    = "/home/jp/Videos/techempower-eps1.mp4"
LOGO   = "/home/jp/Videos/logo/techempower-sun.png"
JINGLE = "/home/jp/Videos/jingles/jingle_01_warm-piano.wav"
CHART  = "/home/jp/Videos/logo/chart_housing.png"
OUT    = "/home/jp/Videos/episode1_FINAL.mp4"

mode = sys.argv[1] if len(sys.argv) > 1 else "full"

# --- flubs to REMOVE (original source seconds) ---
REMOVE = [(152.90, 158.26), (497.30, 510.36), (520.20, 524.92)]

src = VideoFileClip(SRC)
dur = src.duration
print("source duration:", round(dur, 2))

# keep-segments = complement of REMOVE
keeps, prev = [], 0.0
for a, b in REMOVE:
    keeps.append((prev, a)); prev = b
keeps.append((prev, dur))
print("keep segments:", [(round(a,2), round(b,2)) for a, b in keeps])
interview = concatenate_videoclips([src.subclipped(a, b) for a, b in keeps], method="chain")
print("cleaned interview duration:", round(interview.duration, 2))

# --- chart overlay (time is relative to the CLEANED interview) ---
removed_before_chart = 158.26 - 152.90          # only R1 precedes the chart
chart_in  = 185.8 - removed_before_chart
chart_out = 197.3 - removed_before_chart
chart = (ImageClip(CHART).with_start(chart_in).with_duration(chart_out - chart_in)
         .with_position("center").with_effects([vfx.CrossFadeIn(0.5), vfx.CrossFadeOut(0.5)]))
interview = CompositeVideoClip([interview, chart])
interview = interview.with_effects([vfx.FadeIn(0.4)])
interview = interview.with_audio(interview.audio.with_effects([afx.AudioFadeIn(0.3)]))

# --- intro: warm-near-black bg + sun logo (fade in) + jingle, with dip-to-black ---
jingle = AudioFileClip(JINGLE)
intro_dur = jingle.duration
print("intro duration:", round(intro_dur, 2))
bg = ColorClip((1920, 1080), color=(13, 10, 7), duration=intro_dur)
logo = (ImageClip(LOGO).with_duration(intro_dur).resized(height=480)
        .with_position("center").with_effects([vfx.CrossFadeIn(1.2)]))
intro = CompositeVideoClip([bg, logo], size=(1920, 1080)).with_duration(intro_dur)
jingle = jingle.with_effects([afx.AudioFadeIn(1.0), afx.AudioFadeOut(1.2)])
intro = intro.with_audio(jingle).with_effects([vfx.FadeIn(0.5), vfx.FadeOut(0.6)])

# --- assemble + final fades ---
final = concatenate_videoclips([intro, interview], method="compose")
final = final.with_effects([vfx.FadeOut(1.5)])
final = final.with_audio(final.audio.with_effects([afx.AudioFadeOut(1.5)]))
print("FINAL duration:", round(final.duration, 2))

common = dict(codec="libx264", audio_codec="aac", fps=30, threads=8)
if mode == "full":
    final.write_videofile(OUT, preset="medium",
                          ffmpeg_params=["-crf", "18", "-pix_fmt", "yuv420p"],
                          audio_bitrate="192k", **common)
    print("WROTE", OUT)
else:
    final.subclipped(0, 10).write_videofile("/tmp/test_intro.mp4", preset="ultrafast",
                          audio_bitrate="128k", **common)
    cs = intro_dur + chart_in
    final.subclipped(cs - 2.5, cs + 12).write_videofile("/tmp/test_chart.mp4", preset="ultrafast",
                          audio_bitrate="128k", **common)
    print("TEST clips: /tmp/test_intro.mp4 , /tmp/test_chart.mp4  (chart starts ~%.1fs in final)" % cs)
print("DONE", mode)

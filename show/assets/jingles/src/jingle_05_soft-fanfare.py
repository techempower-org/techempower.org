#!/usr/bin/env python3
"""
jingle_05_soft-fanfare.py

Intro jingle for "Wait, I Qualify?!" (TechEmpower).
Style #5: Gentle warm brass/horn mini-fanfare with one soft timpani hit.
Welcoming, a touch triumphant but soft and inviting.

Key: F major. Feel: I - IV - V - I, resolving on F major.
Motif: a rising horn call (C - F - A - C) over warm sustained brass pads,
capped by a soft low timpani thump under the final F major chord.

Stereo, 48 kHz, 16-bit. ~7 s. Pure numpy synthesis + Schroeder reverb.
Normalized to ~ -1.0 dBFS, no clipping, no clicks (ADSR per note).
"""

import numpy as np
from scipy.io import wavfile

SR = 48000

# ---------------------------------------------------------------------------
# Pitch helpers
# ---------------------------------------------------------------------------
def hz(semitones_from_a4: float) -> float:
    """Frequency from semitone offset relative to A4 = 440 Hz."""
    return 440.0 * 2.0 ** (semitones_from_a4 / 12.0)

# Notes we need (semitone offsets from A4)
# A4 = 0. Going down: G#=-1, G=-2, ... A3 = -12, etc.
NOTE = {
    "F2":  hz(-28),  # low timpani-ish fundamental anchor
    "F3":  hz(-16),
    "C4":  hz(-9),
    "F4":  hz(-4),
    "A4":  hz(0),
    "Bb3": hz(-11),
    "Bb4": hz(1),
    "C5":  hz(3),
    "D4":  hz(-7),
    "A3":  hz(-12),
    "C3":  hz(-21),
    "G3":  hz(-14),
}

# ---------------------------------------------------------------------------
# Envelope
# ---------------------------------------------------------------------------
def adsr(n_samples, attack, decay, sustain_level, release, sr=SR):
    """Linear-ish ADSR with smooth curves; lengths in seconds."""
    a = max(1, int(attack * sr))
    d = max(1, int(decay * sr))
    r = max(1, int(release * sr))
    s = max(1, n_samples - a - d - r)
    if a + d + s + r != n_samples:
        s = max(1, n_samples - a - d - r)
    env = np.zeros(a + d + s + r)
    # attack: smooth (sine ease-in) to avoid clicks
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 1.2
    # decay to sustain
    env[a:a + d] = np.linspace(1.0, sustain_level, d)
    # sustain
    env[a + d:a + d + s] = sustain_level
    # release: smooth cosine fade to 0
    env[a + d + s:] = sustain_level * (np.cos(np.linspace(0, np.pi / 2, r)) ** 1.2)
    return env[:n_samples] if len(env) >= n_samples else np.pad(env, (0, n_samples - len(env)))

# ---------------------------------------------------------------------------
# Brass/horn voice: fundamental + decaying harmonic stack, gentle vibrato
# ---------------------------------------------------------------------------
def brass_note(freq, dur, amp=1.0, attack=0.045, decay=0.12, sustain=0.7,
               release=0.25, vibrato_hz=5.0, vibrato_depth=0.004,
               bright=1.0, sr=SR):
    n = int(dur * sr)
    t = np.arange(n) / sr

    # gentle vibrato that fades in (horns swell, don't shimmer instantly)
    vib_env = np.clip(t / 0.5, 0, 1)
    vib = 1.0 + vibrato_depth * vib_env * np.sin(2 * np.pi * vibrato_hz * t)
    phase = 2 * np.pi * freq * np.cumsum(vib) / sr

    # Harmonic amplitudes shaped for a warm horn (strong fundamental,
    # softening upper partials; a little odd/even balance for "brass" body).
    harm_amps = np.array([1.00, 0.55, 0.42, 0.22, 0.16, 0.09, 0.05]) * bright
    # taper top partials more as a function of brightness so it stays soft
    sig = np.zeros(n)
    for i, ha in enumerate(harm_amps, start=1):
        # very slight per-harmonic detune for organic body
        sig += ha * np.sin(i * phase + 0.0)

    # soft "air"/breath: a touch of filtered noise rising with the swell
    rng = np.random.default_rng(50 + int(freq))
    breath = rng.standard_normal(n)
    # one-pole lowpass on the breath
    a_lp = 0.02
    lp = np.zeros(n)
    acc = 0.0
    for k in range(n):
        acc = acc + a_lp * (breath[k] - acc)
        lp[k] = acc
    sig += 0.015 * lp * vib_env

    env = adsr(n, attack, decay, sustain, release, sr)
    return amp * sig * env

# ---------------------------------------------------------------------------
# Soft timpani / low drum hit: pitched low fundamental + noise transient
# ---------------------------------------------------------------------------
def timpani_hit(freq, dur=1.2, amp=1.0, sr=SR):
    n = int(dur * sr)
    t = np.arange(n) / sr
    # pitched body: fundamental + slight inharmonic partials, fast decay
    body = (np.sin(2 * np.pi * freq * t)
            + 0.5 * np.sin(2 * np.pi * freq * 1.58 * t)
            + 0.3 * np.sin(2 * np.pi * freq * 2.65 * t))
    body_env = np.exp(-t * 3.2)
    body *= body_env

    # soft mallet thump: short filtered-noise transient
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n)
    acc = 0.0
    lp = np.zeros(n)
    a_lp = 0.06
    for k in range(n):
        acc = acc + a_lp * (noise[k] - acc)
        lp[k] = acc
    thump = lp * np.exp(-t * 18.0)

    sig = 0.85 * body + 0.4 * thump
    # gentle attack to remove the very first sample click
    atk = int(0.004 * sr)
    sig[:atk] *= np.linspace(0, 1, atk)
    return amp * sig

# ---------------------------------------------------------------------------
# Schroeder reverb (4 combs + 2 allpass) — tasteful hall warmth
# ---------------------------------------------------------------------------
def comb(x, delay_ms, gain, sr=SR):
    d = int(delay_ms * sr / 1000.0)
    y = np.copy(x)
    if d <= 0:
        return y
    for i in range(d, len(x)):
        y[i] = x[i] + gain * y[i - d]
    return y

def allpass(x, delay_ms, gain, sr=SR):
    d = int(delay_ms * sr / 1000.0)
    y = np.zeros_like(x)
    if d <= 0:
        return np.copy(x)
    for i in range(len(x)):
        xd = x[i - d] if i - d >= 0 else 0.0
        yd = y[i - d] if i - d >= 0 else 0.0
        y[i] = -gain * x[i] + xd + gain * yd
    return y

def schroeder_reverb(x, sr=SR):
    combs = [(29.7, 0.78), (37.1, 0.74), (41.1, 0.70), (43.7, 0.66)]
    wet = np.zeros_like(x)
    for dly, g in combs:
        wet += comb(x, dly, g, sr)
    wet /= len(combs)
    wet = allpass(wet, 5.0, 0.7, sr)
    wet = allpass(wet, 1.7, 0.7, sr)
    return wet

# ---------------------------------------------------------------------------
# Sequence helper
# ---------------------------------------------------------------------------
TOTAL = 7.3  # seconds
buf = np.zeros(int(TOTAL * SR))

def place(sig, start_s):
    s = int(start_s * SR)
    e = s + len(sig)
    if e > len(buf):
        sig = sig[:len(buf) - s]
        e = len(buf)
    buf[s:e] += sig

# ---------------------------------------------------------------------------
# ARRANGEMENT (F major, ~7s)
#
#  Pad chords beneath a horn-call motif, resolving to F major:
#    Bar feel:  F (I)  ->  Bb (IV)  ->  C (V)  ->  F (I, final)
#  Motif (lead horn): C4 -> F4 -> A4 ... -> C5  (rising call)
#  Final: full F-major brass chord + soft low-F timpani thump.
# ---------------------------------------------------------------------------

# --- Warm sustained pad chords (mid horns) ---
# I  (F major): F3 A3 C4   at t=0.0
for f, a in [("F3", 0.55), ("A3", 0.42), ("C4", 0.40)]:
    place(brass_note(NOTE[f], 2.1, amp=a, attack=0.12, decay=0.3,
                     sustain=0.72, release=0.45, bright=0.85), 0.0)

# IV (Bb major): Bb3 D4 F4  at t=2.0
for f, a in [("Bb3", 0.50), ("D4", 0.40), ("F4", 0.38)]:
    place(brass_note(NOTE[f], 1.7, amp=a, attack=0.10, decay=0.25,
                     sustain=0.72, release=0.40, bright=0.85), 2.0)

# V (C major): C3 G3 C4  at t=3.6
for f, a in [("C3", 0.48), ("G3", 0.42), ("C4", 0.36)]:
    place(brass_note(NOTE[f], 1.4, amp=a, attack=0.09, decay=0.22,
                     sustain=0.70, release=0.38, bright=0.9), 3.6)

# I final (F major, fuller): F3 A3 C4 F4 at t=5.0 — held to the end
for f, a in [("F3", 0.55), ("A3", 0.44), ("C4", 0.42), ("F4", 0.34)]:
    place(brass_note(NOTE[f], 2.2, amp=a, attack=0.07, decay=0.35,
                     sustain=0.74, release=0.7, bright=0.95), 5.0)

# --- Lead horn-call MOTIF (bright, on top) ---
# Rising call landing across the progression, finishing on the high tonic.
lead = 0.62
place(brass_note(NOTE["C4"], 0.55, amp=lead, attack=0.05, decay=0.1,
                 sustain=0.7, release=0.18, bright=1.15), 0.35)
place(brass_note(NOTE["F4"], 0.65, amp=lead, attack=0.05, decay=0.1,
                 sustain=0.72, release=0.2, bright=1.15), 0.95)
place(brass_note(NOTE["A4"], 0.95, amp=lead * 0.95, attack=0.05, decay=0.12,
                 sustain=0.72, release=0.3, bright=1.1), 1.7)
# little lift over IV/V
place(brass_note(NOTE["Bb4"], 0.55, amp=lead * 0.9, attack=0.05, decay=0.1,
                 sustain=0.7, release=0.2, bright=1.1), 2.9)
place(brass_note(NOTE["C5"], 0.7, amp=lead * 0.95, attack=0.05, decay=0.12,
                 sustain=0.72, release=0.25, bright=1.1), 3.7)
# final resolved high tonic, broad
place(brass_note(NOTE["C5"], 1.9, amp=lead, attack=0.06, decay=0.25,
                 sustain=0.7, release=0.7, bright=1.05), 5.0)
# add the high F over the final chord for a brighter major sparkle
place(brass_note(hz(8), 1.9, amp=lead * 0.55, attack=0.07, decay=0.25,
                 sustain=0.65, release=0.7, bright=1.0), 5.0)  # F5

# --- Soft timpani / low-drum hit under the final chord ---
place(timpani_hit(NOTE["F2"], dur=1.6, amp=0.7), 4.98)
# a gentle pickup thump just before the final hit (very soft) on V
place(timpani_hit(NOTE["C3"], dur=0.9, amp=0.32), 3.58)

# ---------------------------------------------------------------------------
# Mix: stereo with slight width, light reverb, normalize
# ---------------------------------------------------------------------------
dry = buf

# stereo: very slight Haas-ish width by tiny L/R delay + reverb spread
left = np.copy(dry)
right = np.copy(dry)

# reverb computed once (mono) then panned slightly differently for width
wet = schroeder_reverb(dry)
# small independent delay on right wet for spaciousness (~12 ms)
rd = int(0.012 * SR)
wet_r = np.concatenate([np.zeros(rd), wet])[:len(wet)]

wet_mix = 0.22
left = dry + wet_mix * wet
right = dry + wet_mix * wet_r

# slight pan width: nudge dry signal a hair (keep mostly centered/mono-safe)
# (lead is centered; pads get a touch of width via the differing wet tails)

stereo = np.stack([left, right], axis=1)

# Gentle global fade-in/out to be safe at edges
fi = int(0.02 * SR)
fo = int(0.18 * SR)
stereo[:fi] *= np.linspace(0, 1, fi)[:, None]
stereo[-fo:] *= np.linspace(1, 0, fo)[:, None]

# Normalize peak to -1.0 dBFS
peak = np.max(np.abs(stereo))
target = 10 ** (-1.0 / 20.0)  # -1 dBFS
if peak > 0:
    stereo = stereo * (target / peak)

# 16-bit PCM
stereo_i16 = np.clip(stereo, -1.0, 1.0)
stereo_i16 = (stereo_i16 * 32767.0).astype(np.int16)

out_wav = "/home/jp/Videos/jingles/jingle_05_soft-fanfare.wav"
wavfile.write(out_wav, SR, stereo_i16)
print("Wrote", out_wav, "samples:", stereo_i16.shape, "dur:", stereo_i16.shape[0] / SR)

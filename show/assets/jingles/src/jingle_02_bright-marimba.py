#!/usr/bin/env python3
"""
Jingle #2 — "Wait, I Qualify?!" intro
Style: Playful marimba / xylophone melody with light woodblock + shaker pulse.
Friendly, bouncy, smile-inducing. Warm public-media community-show vibe.

Key: C major. Progression feel: I - V - vi - IV, resolving to C major (tonic).
Sample rate 48000, STEREO, 16-bit. Self-contained (numpy only).
"""

import numpy as np
from scipy.io import wavfile

SR = 48000

# ----------------------------------------------------------------------------
# Pitch helpers
# ----------------------------------------------------------------------------
def midi_to_freq(m):
    # A4 = MIDI 69 = 440 Hz
    return 440.0 * 2.0 ** ((m - 69) / 12.0)

# Note-name -> MIDI for convenience
NOTE_BASE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
def note(name):
    # e.g. "C5", "G4", "A#4"
    letter = name[0].upper()
    idx = 1
    semis = NOTE_BASE[letter]
    if len(name) > 1 and name[1] in "#b":
        semis += 1 if name[1] == "#" else -1
        idx = 2
    octave = int(name[idx:])
    return 12 * (octave + 1) + semis  # MIDI

# ----------------------------------------------------------------------------
# Marimba / xylophone voice
# ----------------------------------------------------------------------------
def adsr(n, attack, decay, sustain, release, sr=SR):
    a = max(1, int(attack * sr))
    d = max(1, int(decay * sr))
    r = max(1, int(release * sr))
    s = max(0, n - a - d - r)
    env = np.concatenate([
        np.linspace(0.0, 1.0, a, endpoint=False),
        np.linspace(1.0, sustain, d, endpoint=False),
        np.full(s, sustain),
        np.linspace(sustain, 0.0, r, endpoint=True),
    ])
    if len(env) < n:
        env = np.concatenate([env, np.zeros(n - len(env))])
    return env[:n]

def marimba(freq, dur, sr=SR, amp=1.0, bright=1.0):
    """
    Marimba timbre: fundamental + odd-ish harmonics that decay quickly.
    Real marimbas have a strong partial near the 4th harmonic (2 octaves)
    plus a 10th. We approximate with a tuned harmonic stack and a short
    'mallet' transient for the woody attack.
    """
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)

    # Partials: (harmonic ratio, relative amp, decay rate per sec)
    partials = [
        (1.0,  1.00, 6.0),   # fundamental
        (3.0,  0.55, 9.0),   # bar quasi-harmonic (strong in marimba)
        (4.0,  0.30, 11.0),  # 2 octaves up, bright
        (6.0,  0.18, 14.0),
        (10.0, 0.10 * bright, 18.0),  # the signature high partial
    ]
    sig = np.zeros(n)
    for ratio, ramp, dec in partials:
        f = freq * ratio
        if f > sr * 0.45:
            continue
        # each partial has its own exponential decay -> percussive woody tone
        decay = np.exp(-dec * t)
        sig += ramp * decay * np.sin(2 * np.pi * f * t)

    # Mallet click: very short filtered noise burst gives the "tok" of a mallet
    click_len = int(0.004 * sr)
    click = np.random.default_rng(int(freq) % 9973).standard_normal(click_len)
    click *= np.exp(-np.linspace(0, 8, click_len))
    sig[:click_len] += 0.18 * click

    # Percussive amplitude envelope: fast attack, natural exponential decay,
    # short release to avoid clicks at the tail.
    env = adsr(n, attack=0.006, decay=0.10, sustain=0.0, release=0.012, sr=sr)
    # marimba decays naturally even during "sustain"; blend an exp decay so
    # longer notes still ring then fade smoothly
    exp_tail = np.exp(-3.2 * t)
    env = np.maximum(env, exp_tail * (t < dur - 0.02))
    # ensure clean fade to zero at the very end (no click)
    fade = int(0.012 * sr)
    env[-fade:] *= np.linspace(1.0, 0.0, fade)

    return amp * sig * env

# ----------------------------------------------------------------------------
# Percussion: woodblock + shaker
# ----------------------------------------------------------------------------
def woodblock(dur, sr=SR, amp=1.0, pitch=900.0):
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    # two close resonant sines + tiny noise -> hollow "tok"
    body = (np.sin(2 * np.pi * pitch * t)
            + 0.6 * np.sin(2 * np.pi * pitch * 1.5 * t))
    env = np.exp(-55.0 * t)
    rng = np.random.default_rng(42)
    noise = rng.standard_normal(n) * np.exp(-120.0 * t)
    sig = (body * env + 0.25 * noise)
    return amp * sig

def shaker(dur, sr=SR, amp=1.0, seed=7):
    n = int(dur * sr)
    t = np.linspace(0, dur, n, endpoint=False)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n)
    # high-pass-ish by differencing -> bright "tss"
    noise = np.diff(noise, prepend=0.0)
    env = np.exp(-38.0 * t)
    return amp * noise * env

# ----------------------------------------------------------------------------
# Reverb: Schroeder (comb + allpass), tasteful short room
# ----------------------------------------------------------------------------
def comb(x, delay_ms, gain, sr=SR):
    # Feedback comb filter: y[n] = x[n] + gain * y[n-d]   (0 < gain < 1 => stable)
    d = max(1, int(delay_ms * 0.001 * sr))
    y = np.copy(x)
    for i in range(d, len(x)):
        y[i] += gain * y[i - d]
    return y

def allpass(x, delay_ms, gain, sr=SR):
    # Schroeder allpass:
    #   buf[n] = x[n] + gain * buf[n-d]
    #   y[n]   = -gain * buf[n] + buf[n-d]
    # Uses a separate buffer so feedback stays bounded for |gain| < 1.
    d = max(1, int(delay_ms * 0.001 * sr))
    buf = np.copy(x)
    y = np.zeros_like(x)
    for i in range(len(x)):
        bprev = buf[i - d] if i - d >= 0 else 0.0
        buf[i] = x[i] + gain * bprev
        y[i] = -gain * buf[i] + bprev
    return y

def reverb(x, wet=0.22, sr=SR):
    combs = [(29.7, 0.78), (37.1, 0.74), (41.1, 0.70), (43.7, 0.68)]
    acc = np.zeros_like(x)
    for dms, g in combs:
        acc += comb(x, dms, g, sr)
    acc /= len(combs)
    acc = allpass(acc, 5.0, 0.7, sr)
    acc = allpass(acc, 1.7, 0.7, sr)
    return (1.0 - wet) * x + wet * acc

# ----------------------------------------------------------------------------
# Compose
# ----------------------------------------------------------------------------
def main():
    rng = np.random.default_rng(2)

    BPM = 132
    beat = 60.0 / BPM           # ~0.4545 s
    eighth = beat / 2.0

    total_dur = 7.4
    n_total = int(total_dur * SR)
    left = np.zeros(n_total)
    right = np.zeros(n_total)

    def place(buf_l, buf_r, sig, t_start, pan=0.0):
        i = int(t_start * SR)
        end = min(i + len(sig), n_total)
        seg = sig[: end - i]
        # equal-power pan
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        buf_l[i:end] += seg * l
        buf_r[i:end] += seg * r

    # ---- Chord pads (soft marimba rolls for harmonic bed) ----
    # Progression: C (I) - G (V) - Am (vi) - F (IV) ... resolve to C (I)
    # We keep it light so the melody sings on top.
    chords = [
        (0.0,            ["C3", "E3", "G3"]),   # I
        (2 * beat,       ["G2", "B2", "D3"]),   # V
        (4 * beat,       ["A2", "C3", "E3"]),   # vi
        (6 * beat,       ["F2", "A2", "C3"]),   # IV
        (8 * beat,       ["C3", "E3", "G3", "C4"]),  # I (resolve)
    ]
    for t0, names in chords:
        for j, nm in enumerate(names):
            f = midi_to_freq(note(nm))
            dur = 2 * beat if t0 < 8 * beat else 2.6
            pan = (j - (len(names) - 1) / 2) * 0.18
            sig = marimba(f, dur, amp=0.16, bright=0.6)
            # tiny roll spread for warmth
            place(left, right, sig, t0 + j * 0.012, pan)

    # ---- Bouncy marimba MELODY (the hook / motif) ----
    # Motif: an upward friendly bounce that lands on the tonic.
    # Built in C major. Rhythms are skippy (dotted/eighth) for "bounce".
    mel = [
        # (note, start_in_beats, dur_in_beats, amp, pan)
        ("G4", 0.0,  0.5, 0.85, -0.10),
        ("C5", 0.5,  0.5, 0.90,  0.10),
        ("E5", 1.0,  0.5, 0.92, -0.10),
        ("G5", 1.5,  0.5, 0.95,  0.10),   # bright top — the smile
        ("E5", 2.0,  0.5, 0.80, -0.06),
        ("D5", 2.5,  0.5, 0.82,  0.06),
        ("B4", 3.0,  0.5, 0.78, -0.06),
        ("D5", 3.5,  0.5, 0.80,  0.06),
        # vi (Am) - playful little turn
        ("C5", 4.0,  0.5, 0.84, -0.10),
        ("E5", 4.5,  0.5, 0.86,  0.10),
        ("A5", 5.0,  0.75, 0.92, 0.0),    # peak lift
        ("G5", 5.75, 0.25, 0.70, 0.08),
        # IV (F) - step down, set up resolution
        ("F5", 6.0,  0.5, 0.86, -0.10),
        ("A5", 6.5,  0.5, 0.88,  0.10),
        ("G5", 7.0,  0.5, 0.84, -0.06),
        ("E5", 7.5,  0.5, 0.82,  0.06),
        # Resolve to tonic C — uplifting major arrival (arpeggio C-E-G-C)
        ("C5", 8.0,  0.5, 0.95, -0.12),
        ("E5", 8.5,  0.5, 0.95,  0.0),
        ("G5", 9.0,  0.5, 0.95,  0.12),
        ("C6", 9.0,  2.4, 0.98,  0.0),    # ring out the high tonic
        ("E5", 9.0,  2.4, 0.55, -0.18),   # add the third under it
        ("G5", 9.0,  2.4, 0.55,  0.18),   # and the fifth -> full C major
    ]
    for nm, sb, db, amp, pan in mel:
        f = midi_to_freq(note(nm))
        t0 = sb * beat
        dur = db * beat
        sig = marimba(f, dur, amp=amp, bright=1.0)
        place(left, right, sig, t0, pan)

    # ---- Light woodblock pulse on the beat (friendly tick) ----
    n_beats = int(total_dur / beat) + 1
    for b in range(n_beats):
        t0 = b * beat
        if t0 > 9.0:
            break
        # accent downbeats slightly
        amp = 0.10 if (b % 2 == 0) else 0.06
        wb = woodblock(0.12, amp=amp, pitch=820.0 + (b % 4) * 30)
        place(left, right, wb, t0, pan=0.22)

    # ---- Shaker on the off-beats (light groove) ----
    t = 0.0
    si = 0
    while t < 9.2:
        amp = 0.07 if (si % 2 == 1) else 0.045  # off-beats a touch louder
        sh = shaker(0.10, amp=amp, seed=si + 11)
        place(left, right, sh, t, pan=-0.25)
        t += eighth
        si += 1

    # ---- Reverb (tasteful short room) ----
    left = reverb(left, wet=0.20)
    right = reverb(right, wet=0.20)

    # ---- Stereo width (subtle Haas + mid/side lift) ----
    mid = (left + right) * 0.5
    side = (left - right) * 0.5
    side *= 1.25
    left = mid + side
    right = mid - side

    # ---- Final fade out so the tail rings then settles cleanly ----
    stereo = np.vstack([left, right])
    fade_n = int(0.5 * SR)
    fade = np.linspace(1.0, 0.0, fade_n)
    stereo[:, -fade_n:] *= fade
    # tiny fade-in to guarantee zero start
    fin = int(0.005 * SR)
    stereo[:, :fin] *= np.linspace(0.0, 1.0, fin)

    # ---- Normalize to -1.0 dBFS, no clipping ----
    peak = np.max(np.abs(stereo))
    target = 10 ** (-1.0 / 20.0)  # -1 dBFS
    if peak > 0:
        stereo *= target / peak

    # safety clip guard (should be unnecessary)
    stereo = np.clip(stereo, -1.0, 1.0)

    out = (stereo.T * 32767.0).astype(np.int16)
    wavfile.write("/home/jp/Videos/jingles/jingle_02_bright-marimba.wav", SR, out)
    print("wrote WAV, peak before norm =", peak, "samples =", out.shape)

if __name__ == "__main__":
    main()

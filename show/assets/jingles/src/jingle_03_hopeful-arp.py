#!/usr/bin/env python3
"""
Jingle 03 — "Hopeful Arpeggio"
For: "Wait, I Qualify?!" (TechEmpower)

Style: Modern uplifting plucked-synth arpeggio that builds into a bright
sustained pad chord. Optimistic, contemporary, clean.

Key: D major. Progression feel: I (D) -> V (A) -> vi (Bm) -> IV (G),
resolving onto a sustained D-major tonic chord with an added 9th sparkle.

48 kHz, stereo, 16-bit. numpy only (no internet / soundfonts).
"""

import numpy as np

SR = 48000

# ---------------------------------------------------------------------------
# Pitch helpers
# ---------------------------------------------------------------------------
def hz(semitones_from_a4: float) -> float:
    """Frequency for n semitones relative to A4 (440 Hz)."""
    return 440.0 * 2.0 ** (semitones_from_a4 / 12.0)

# Named notes (semitones relative to A4). D major scale neighborhood.
# A4 = 0.  D4 = -7,  E4 = -5, F#4 = -3, G4 = -2, A4 = 0, B4 = 2,
# C#5 = 4, D5 = 5, E5 = 7, F#5 = 9, A5 = 12, B5 = 14, D6 = 17
NOTE = {
    "D3": -19, "A3": -12,
    "D4": -7, "E4": -5, "Fs4": -3, "G4": -2, "A4": 0, "B4": 2,
    "Cs5": 4, "D5": 5, "E5": 7, "Fs5": 9, "G5": 10, "A5": 12, "B5": 14,
    "Cs6": 16, "D6": 17, "Fs6": 21,
}

# ---------------------------------------------------------------------------
# Envelopes
# ---------------------------------------------------------------------------
def adsr(n_samples, attack, decay, sustain, release, sr=SR):
    """Classic ADSR. Times in seconds; sustain is a level 0..1."""
    a = int(attack * sr)
    d = int(decay * sr)
    r = int(release * sr)
    s = max(0, n_samples - a - d - r)
    env = np.zeros(n_samples, dtype=np.float64)
    idx = 0
    # attack: 0 -> 1
    if a > 0:
        env[idx:idx + a] = np.linspace(0.0, 1.0, a, endpoint=False)
        idx += a
    # decay: 1 -> sustain
    if d > 0:
        env[idx:idx + d] = np.linspace(1.0, sustain, d, endpoint=False)
        idx += d
    # sustain
    if s > 0:
        env[idx:idx + s] = sustain
        idx += s
    # release: sustain -> 0 (smooth, with slight curve)
    if r > 0:
        rel = np.linspace(1.0, 0.0, r) ** 1.5
        env[idx:idx + r] = sustain * rel
        idx += r
    if idx < n_samples:
        env[idx:] = 0.0
    return env

def pluck_env(n_samples, attack=0.006, decay=0.55, sr=SR):
    """Fast-attack exponential-decay envelope for a plucked synth note.
    Short attack + release ramps guarantee no clicks at the edges."""
    env = np.zeros(n_samples, dtype=np.float64)
    a = max(1, int(attack * sr))
    a = min(a, n_samples)
    env[:a] = np.linspace(0.0, 1.0, a, endpoint=False)
    rest = n_samples - a
    if rest > 0:
        t = np.arange(rest) / sr
        env[a:] = np.exp(-t / decay)
    # micro-fade at the very end to kill any residual DC / click
    fade = min(int(0.012 * sr), n_samples // 4)
    if fade > 0:
        env[-fade:] *= np.linspace(1.0, 0.0, fade) ** 1.2
    return env

# ---------------------------------------------------------------------------
# Voices
# ---------------------------------------------------------------------------
def pluck(freq, dur, sr=SR, decay=0.5, detune=0.0):
    """A bright bell-pluck: fundamental + a handful of decaying harmonics.
    Higher partials decay faster -> a natural, pinging pluck."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    f = freq * (1.0 + detune)
    # partial amplitudes (slightly inharmonic shimmer on top)
    partials = [
        (1.0, 1.00, 1.00),   # (ratio, amp, decay-scale)
        (2.0, 0.45, 0.75),
        (3.0, 0.22, 0.55),
        (4.0, 0.12, 0.42),
        (5.01, 0.07, 0.32),  # tiny inharmonic sparkle
    ]
    sig = np.zeros(n, dtype=np.float64)
    for ratio, amp, dscale in partials:
        partial = np.sin(2 * np.pi * f * ratio * t)
        # each partial gets its own faster decay for the higher ones
        penv = pluck_env(n, attack=0.005, decay=decay * dscale, sr=sr)
        sig += amp * partial * penv
    # gentle overall pluck shaping
    sig *= pluck_env(n, attack=0.006, decay=decay, sr=sr)
    return sig

def pad_note(freq, dur, sr=SR, attack=0.4, release=0.6, detune_cents=7.0):
    """Soft, warm sustained pad voice. Two slightly-detuned saw-ish stacks
    (built from summed harmonics, low-passed by amplitude rolloff) for width
    and a gentle chorused shimmer."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    cents = detune_cents / 1200.0
    voices = [freq * 2 ** (-cents), freq * 2 ** (cents)]
    sig = np.zeros(n, dtype=np.float64)
    # a soft saw = sum of harmonics with 1/k amplitude, rolled off so it's mellow
    n_harm = 8
    for vf in voices:
        for k in range(1, n_harm + 1):
            amp = (1.0 / k) * np.exp(-0.35 * (k - 1))  # mellow rolloff
            # tiny slow vibrato-ish drift for life
            sig += amp * np.sin(2 * np.pi * vf * k * t)
    sig /= np.max(np.abs(sig)) + 1e-9
    env = adsr(n, attack=attack, decay=0.3, sustain=0.85,
               release=release, sr=sr)
    return sig * env

# ---------------------------------------------------------------------------
# Stereo placement
# ---------------------------------------------------------------------------
def place(mono, pan=0.0):
    """Equal-power pan. pan in [-1 (L) .. +1 (R)]."""
    pan = float(np.clip(pan, -1.0, 1.0))
    angle = (pan + 1.0) * (np.pi / 4.0)  # 0..pi/2
    l = np.cos(angle)
    r = np.sin(angle)
    return mono * l, mono * r

# ---------------------------------------------------------------------------
# Schroeder reverb (comb + allpass), tasteful short space
# ---------------------------------------------------------------------------
def comb(x, delay_s, gain, sr=SR):
    d = int(delay_s * sr)
    y = np.copy(x)
    if d <= 0:
        return y
    for i in range(d, len(x)):
        y[i] = x[i] + gain * y[i - d]
    return y

def allpass(x, delay_s, gain, sr=SR):
    d = int(delay_s * sr)
    y = np.zeros_like(x)
    if d <= 0:
        return x
    for i in range(len(x)):
        xd = x[i - d] if i - d >= 0 else 0.0
        yd = y[i - d] if i - d >= 0 else 0.0
        y[i] = -gain * x[i] + xd + gain * yd
    return y

def reverb(mono, sr=SR):
    """Light Schroeder reverb: 4 parallel combs -> 2 series allpass."""
    combs = [
        (0.0297, 0.78),
        (0.0371, 0.75),
        (0.0411, 0.72),
        (0.0437, 0.70),
    ]
    acc = np.zeros_like(mono)
    for d, g in combs:
        acc += comb(mono, d, g, sr)
    acc /= len(combs)
    acc = allpass(acc, 0.0050, 0.7, sr)
    acc = allpass(acc, 0.0017, 0.7, sr)
    return acc

# ---------------------------------------------------------------------------
# Compose
# ---------------------------------------------------------------------------
def main():
    total = 7.2  # seconds
    N = int(total * SR)
    left = np.zeros(N, dtype=np.float64)
    right = np.zeros(N, dtype=np.float64)

    def add(mono, start_s, pan=0.0, gain=1.0):
        s = int(start_s * SR)
        l, r = place(mono * gain, pan)
        end = min(N, s + len(mono))
        ln = end - s
        if ln <= 0:
            return
        left[s:end] += l[:ln]
        right[s:end] += r[:ln]

    bpm = 132.0
    beat = 60.0 / bpm          # ~0.4545 s
    step = beat / 2.0          # eighth-note arpeggio step ~0.227 s

    # --- Plucked arpeggio motif -------------------------------------------
    # Rising hopeful run outlining D -> A -> Bm -> G then a final tonic ping.
    # Each note panned subtly L<->R for movement; brightness rises as it
    # climbs ("you might qualify for MORE than you think").
    arp = [
        # (note, start_step, pan, gain, decay)
        ("D4",  0,  -0.35, 0.90, 0.55),
        ("Fs4", 1,  -0.10, 0.92, 0.55),
        ("A4",  2,   0.10, 0.95, 0.55),
        ("D5",  3,   0.35, 1.00, 0.60),
        # lift to the V color
        ("Cs5", 4,   0.20, 0.95, 0.55),
        ("E5",  5,   0.00, 0.98, 0.55),
        ("A5",  6,  -0.20, 1.00, 0.62),
        # vi shimmer, then the peak
        ("Fs5", 7,   0.25, 0.95, 0.55),
        ("B5",  8,  -0.25, 1.00, 0.62),
        ("D6",  9,   0.00, 1.05, 0.70),   # peak ping right before the bloom
    ]
    for name, st, pan, g, dec in arp:
        f = hz(NOTE[name])
        note = pluck(f, dur=1.1, decay=dec)
        add(note, start_s=st * step, pan=pan, gain=g * 0.5)

    # A soft low D pulse under the run to give a hopeful foundation
    add(pluck(hz(NOTE["D3"]), dur=1.6, decay=0.9), start_s=0.0, pan=0.0, gain=0.32)
    add(pluck(hz(NOTE["A3"]), dur=1.4, decay=0.9), start_s=4 * step, pan=0.0, gain=0.26)

    # --- Sustained bloom pad (the resolved D-major chord) ------------------
    # Pad swells in as the arp peaks (~step 8) and sustains to the end,
    # arriving fully on the tonic D major (D-F#-A) with an added 9th (E) and
    # an octave D on top for sparkle.
    pad_start = 8 * step          # ~1.82 s
    pad_dur = total - pad_start - 0.05
    chord = [
        ("D4",  -0.30, 0.85),
        ("Fs4", -0.10, 0.80),
        ("A4",   0.10, 0.80),
        ("D5",   0.30, 0.78),
        ("E5",   0.00, 0.42),   # gentle add-9 sparkle (soft)
        ("Fs5",  0.20, 0.40),   # high third shimmer (soft)
    ]
    for name, pan, g in chord:
        f = hz(NOTE[name])
        voice = pad_note(f, dur=pad_dur, attack=0.45, release=1.1)
        add(voice, start_s=pad_start, pan=pan, gain=g * 0.16)

    # A final resolved tonic ping on D5 right as the pad locks in, for a clean
    # "landed" feeling on the title card.
    add(pluck(hz(NOTE["D5"]), dur=1.8, decay=1.0),
        start_s=pad_start + step, pan=0.0, gain=0.40)
    add(pluck(hz(NOTE["A5"]), dur=1.6, decay=1.0),
        start_s=pad_start + step, pan=0.15, gain=0.22)

    # --- Reverb (light, applied to a mono send, mixed back in stereo) ------
    send = (left + right) * 0.5
    wet = reverb(send)
    wet /= (np.max(np.abs(wet)) + 1e-9)
    # widen the wet a touch by slight L/R delay offset
    wet_l = wet
    wet_r = np.concatenate([np.zeros(int(0.008 * SR)), wet])[:N]
    rev_gain = 0.18
    left += wet_l * rev_gain
    right += wet_r * rev_gain

    # --- Master: gentle stereo glue + soft fade tail + normalize ----------
    # Final overall fade-out tail so the pad releases cleanly (no abrupt cut).
    tail = int(0.6 * SR)
    fade = np.ones(N)
    fade[-tail:] = np.linspace(1.0, 0.0, tail) ** 1.4
    left *= fade
    right *= fade

    # tiny global fade-in to be safe against any onset transient
    fin = int(0.004 * SR)
    left[:fin] *= np.linspace(0.0, 1.0, fin)
    right[:fin] *= np.linspace(0.0, 1.0, fin)

    stereo = np.stack([left, right], axis=1)

    # Normalize peak to -1.0 dBFS
    peak = np.max(np.abs(stereo))
    target = 10 ** (-1.0 / 20.0)  # -1 dBFS
    if peak > 0:
        stereo *= (target / peak)

    # Safety clip guard (should not trigger after normalize)
    stereo = np.clip(stereo, -1.0, 1.0)

    # 16-bit PCM
    pcm = (stereo * 32767.0).astype(np.int16)

    # --- Write WAV (stdlib wave to avoid scipy dependency on output) ------
    import wave
    out = "/home/jp/Videos/jingles/jingle_03_hopeful-arp.wav"
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", out, "frames", pcm.shape[0], "dur", pcm.shape[0] / SR)

if __name__ == "__main__":
    main()

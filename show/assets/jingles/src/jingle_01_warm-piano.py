#!/usr/bin/env python3
"""
"Wait, I Qualify?!" — Intro Jingle #01
Style: Gentle warm grand-piano arpeggio with a soft sustained string pad.
Tender, intimate, hopeful. Warm public-media / community-show vibe.

Key: F major. Progression: F (I) -> C (V) -> Dm (vi) -> Bb (IV) -> F (I) resolve.
Ends on a resolved F-major chord. ~7 seconds.

Output: STEREO, 48000 Hz, 16-bit WAV. Normalized to ~-1.0 dBFS, no clipping.
"""

import numpy as np

SR = 48000

# ----------------------------------------------------------------------------
# Pitch helpers: f = 440 * 2**(n/12), n = semitones from A4.
# ----------------------------------------------------------------------------
A4 = 440.0

def semis(n):
    return A4 * (2.0 ** (n / 12.0))

# Note names relative to A4 (n semitones). F major scale region.
# F3=-16, A3=-12, C4=-9, D4=-7, F4=-4, G4=-2, A4=0, Bb4=1, C5=3, D5=5, F5=8
NOTE = {
    "F2": -28, "C3": -21, "F3": -16, "A3": -12, "Bb3": -11, "C4": -9,
    "D4": -7, "E4": -5, "F4": -4, "G4": -2, "A4": 0, "Bb4": 1,
    "C5": 3, "D5": 5, "E5": 7, "F5": 8, "A5": 12,
}

def hz(name):
    return semis(NOTE[name])

# ----------------------------------------------------------------------------
# ADSR envelope (short attack & release to avoid clicks).
# ----------------------------------------------------------------------------
def adsr(n, attack, decay, sustain_level, release, sustain_len=None):
    """Build an ADSR envelope of total length n samples."""
    a = int(attack * SR)
    d = int(decay * SR)
    r = int(release * SR)
    a = max(a, 1)
    r = max(r, 1)
    # sustain fills whatever is left
    s = n - a - d - r
    if s < 0:
        # shrink decay/release proportionally for very short notes
        s = 0
        budget = n
        a = min(a, max(1, budget // 4))
        budget -= a
        r = min(r, max(1, budget // 3))
        budget -= r
        d = max(0, budget)
    env = np.zeros(n, dtype=np.float64)
    idx = 0
    # attack: raised-cosine for smoothness (no click)
    if a > 0:
        env[idx:idx + a] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
        idx += a
    # decay to sustain level
    if d > 0:
        env[idx:idx + d] = np.linspace(1.0, sustain_level, d)
        idx += d
    # sustain
    if s > 0:
        env[idx:idx + s] = sustain_level
        idx += s
    # release: smooth cosine fade to zero
    if r > 0:
        end = min(idx + r, n)
        rr = end - idx
        env[idx:end] = sustain_level * (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, rr)))
        idx = end
    if idx < n:
        env[idx:] = 0.0
    return env

# ----------------------------------------------------------------------------
# Grand-piano-ish note: fundamental + decaying harmonics, each partial
# with its own exponential decay (higher partials decay faster). Slight
# inharmonicity for warmth. Soft hammer attack.
# ----------------------------------------------------------------------------
def piano_note(freq, dur, amp=1.0, attack=0.008, release=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    # partial amplitudes (gentle, warm — not too bright)
    partials = [
        (1.0, 1.00, 0.0),
        (2.0, 0.42, 0.0),
        (3.0, 0.22, 0.0),
        (4.0, 0.12, 0.0),
        (5.0, 0.06, 0.0),
        (6.0, 0.030, 0.0),
    ]
    B = 0.0004  # mild inharmonicity coefficient
    sig = np.zeros(n, dtype=np.float64)
    for k, (mult, pamp, phase) in enumerate(partials):
        # inharmonic stretch
        f = freq * mult * np.sqrt(1.0 + B * (mult ** 2))
        # per-partial decay: higher partials fade faster
        decay_rate = 1.6 + 0.9 * mult
        partial_env = np.exp(-decay_rate * t)
        sig += pamp * partial_env * np.sin(2 * np.pi * f * t + phase)
    # overall ADSR (piano: quick attack, long sustain via decaying partials, soft release)
    env = adsr(n, attack=attack, decay=0.05, sustain_level=0.55, release=release)
    sig *= env
    # soft saturation for body/warmth
    sig = np.tanh(1.3 * sig) / np.tanh(1.3)
    return amp * sig

# ----------------------------------------------------------------------------
# Soft sustained string pad: detuned saw-ish stack lowpassed, slow attack.
# Built from a few low harmonics with slow swell.
# ----------------------------------------------------------------------------
def string_pad(freqs, dur, amp=1.0, attack=0.35, release=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n, dtype=np.float64)
    for f in freqs:
        # gentle detune for chorus/ensemble warmth
        for det, dgain in [(-0.15, 0.5), (0.0, 1.0), (0.18, 0.5)]:
            ff = f * (2.0 ** (det / 100.0))
            # warm spectrum: fundamental + a few soft harmonics
            for h, hg in [(1, 1.0), (2, 0.35), (3, 0.16), (4, 0.07)]:
                sig += dgain * hg * np.sin(2 * np.pi * ff * h * t)
    sig /= len(freqs) * 3
    # slow swell ADSR
    env = adsr(n, attack=attack, decay=0.2, sustain_level=0.8, release=release)
    sig *= env
    # gentle one-pole lowpass to remove fizz
    a = 0.08
    out = np.zeros_like(sig)
    acc = 0.0
    for i in range(n):
        acc = acc + a * (sig[i] - acc)
        out[i] = acc
    return amp * out

# ----------------------------------------------------------------------------
# Place a mono signal into a stereo buffer at a sample offset, with pan.
# pan: -1 (L) .. 0 (center) .. +1 (R). Equal-power.
# ----------------------------------------------------------------------------
def place(buf, sig, start, pan=0.0, gain=1.0):
    ang = (pan + 1.0) * 0.25 * np.pi  # 0..pi/2
    gl = np.cos(ang) * gain
    gr = np.sin(ang) * gain
    n = len(sig)
    end = start + n
    if end > buf.shape[0]:
        sig = sig[:buf.shape[0] - start]
        end = buf.shape[0]
    buf[start:end, 0] += gl * sig
    buf[start:end, 1] += gr * sig

# ----------------------------------------------------------------------------
# Schroeder reverb (4 comb + 2 allpass), tasteful short tail.
# ----------------------------------------------------------------------------
def comb(x, delay, fb, damp=0.25):
    n = len(x)
    out = np.zeros(n)
    buf = np.zeros(delay)
    idx = 0
    filt = 0.0
    for i in range(n):
        d = buf[idx]
        filt = d * (1 - damp) + filt * damp
        y = x[i] + fb * filt
        buf[idx] = y
        out[i] = d
        idx += 1
        if idx >= delay:
            idx = 0
    return out

def allpass(x, delay, g=0.5):
    n = len(x)
    out = np.zeros(n)
    buf = np.zeros(delay)
    idx = 0
    for i in range(n):
        d = buf[idx]
        y = -g * x[i] + d
        buf[idx] = x[i] + g * d
        out[i] = y
        idx += 1
        if idx >= delay:
            idx = 0
    return out

def reverb(mono, mix=0.22):
    combs = [
        (int(0.0297 * SR), 0.78),
        (int(0.0371 * SR), 0.76),
        (int(0.0411 * SR), 0.74),
        (int(0.0437 * SR), 0.72),
    ]
    acc = np.zeros_like(mono)
    for d, fb in combs:
        acc += comb(mono, d, fb, damp=0.28)
    acc /= len(combs)
    acc = allpass(acc, int(0.0050 * SR), 0.5)
    acc = allpass(acc, int(0.0017 * SR), 0.5)
    return (1 - mix) * mono + mix * acc

# ----------------------------------------------------------------------------
# COMPOSE
# ----------------------------------------------------------------------------
def main():
    total_dur = 7.4
    N = int(total_dur * SR)
    dry = np.zeros((N, 2), dtype=np.float64)

    def at(sec):
        return int(sec * SR)

    # Tempo: gentle. Arpeggio eighth-ish spacing.
    # Chord plan (each ~1.5s region), arpeggio rises tenderly:
    #   bar1 0.00s  F   : F3 A3 C4 F4
    #   bar2 1.55s  C   : C3? -> use C-rooted: C4 E4 G4 C5  (V)
    #   bar3 3.10s  Dm  : D4 F4 A4 D5   (vi)
    #   bar4 4.65s  Bb  : Bb3 D4 F4 Bb4 (IV)
    #   final 5.9s  F   : full F-major resolve chord (low + mid + motif top)

    step = 0.205  # arpeggio note spacing
    notedur = 1.5  # individual piano note duration (rings through)

    # ---- Arpeggio sequences per chord ----
    arps = [
        (0.00, ["F3", "A3", "C4", "F4"]),     # I
        (1.55, ["C4", "E4", "G4", "C5"]),     # V
        (3.10, ["D4", "F4", "A4", "D5"]),     # vi
        (4.65, ["Bb3", "D4", "F4", "Bb4"]),   # IV
    ]

    pans = [-0.35, -0.1, 0.12, 0.35]  # subtle L->R sweep across arpeggio
    for base, notes in arps:
        for i, nm in enumerate(notes):
            tstart = base + i * step
            amp = 0.30 - 0.012 * i  # slight emphasis on first note
            note = piano_note(hz(nm), notedur, amp=amp, attack=0.007, release=0.18)
            place(dry, note, at(tstart), pan=pans[i % 4], gain=1.0)

    # ---- Memorable melodic motif (sings over the chords, higher register) ----
    # Motif: F5 . A5 G5 . F5  -> a hopeful little rise & settle ("you qual-i-fy")
    motif = [
        (0.62, "F5", 0.9, 0.5),
        (1.05, "A5", 0.32, 0.95),
        (2.00, "G4", 0.45, 0.8),   # answer in C chord (G is the 5th)
        (3.55, "A4", 0.5, 0.85),   # over Dm
        (5.00, "D5", 0.5, 0.9),    # over Bb (D = 3rd of Bb)
    ]
    for tstart, nm, dur, a in motif:
        note = piano_note(hz(nm), dur + 0.7, amp=0.22 * a, attack=0.010, release=0.25)
        place(dry, note, at(tstart), pan=0.0, gain=1.0)

    # ---- Soft sustained STRING PAD underneath each chord ----
    pad_plan = [
        (0.00, ["F2", "C4", "F4"], 1.7),      # F
        (1.55, ["C3", "G4", "C5"], 1.7),      # C
        (3.10, ["D4", "A4", "F4"], 1.7),      # Dm
        (4.65, ["Bb3", "F4", "D4"], 1.55),    # Bb
    ]
    for base, ns, dur in pad_plan:
        freqs = [hz(n) for n in ns]
        pad = string_pad(freqs, dur, amp=0.16, attack=0.30, release=0.40)
        place(dry, pad, at(base), pan=-0.25, gain=1.0)
        # widen: slightly delayed copy on the right
        place(dry, pad, at(base) + int(0.012 * SR), pan=0.25, gain=0.9)

    # ---- FINAL RESOLVED F-MAJOR CHORD (the uplifting arrival) ----
    fin = 5.95
    # rolled chord: low to high, arriving together, ringing out to the end
    final_dur = total_dur - fin + 0.05
    chord_notes = ["F3", "A3", "C4", "F4", "A4", "C5", "F5"]
    roll = 0.028
    fpans = [-0.3, -0.18, -0.05, 0.05, 0.15, 0.25, 0.32]
    for i, nm in enumerate(chord_notes):
        amp = 0.27 if i < 4 else 0.20
        note = piano_note(hz(nm), final_dur - i * roll, amp=amp, attack=0.006, release=0.9)
        place(dry, note, at(fin) + int(i * roll * SR), pan=fpans[i % 7], gain=1.0)
    # warm pad bed under the final chord
    fpad = string_pad([hz("F2"), hz("C4"), hz("F4"), hz("A4")], final_dur,
                      amp=0.18, attack=0.18, release=0.6)
    place(dry, fpad, at(fin), pan=-0.2, gain=1.0)
    place(dry, fpad, at(fin) + int(0.013 * SR), pan=0.2, gain=0.9)

    # ----------------------------------------------------------------
    # Reverb (apply per channel on a mono-summed send, then blend)
    # ----------------------------------------------------------------
    wetL = reverb(dry[:, 0], mix=0.20)
    wetR = reverb(dry[:, 1], mix=0.20)
    mix = np.stack([wetL, wetR], axis=1)

    # ----------------------------------------------------------------
    # Master: gentle global fade-in (no click at t=0) + fade-out tail,
    # then peak-normalize to -1.0 dBFS.
    # ----------------------------------------------------------------
    # tiny global fade-in over 12 ms
    fi = int(0.012 * SR)
    mix[:fi, :] *= np.linspace(0, 1, fi)[:, None]
    # smooth fade-out over last 0.5 s
    fo = int(0.5 * SR)
    fade = (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fo)))[:, None]
    mix[-fo:, :] *= fade

    # soft master saturation to glue (very light)
    mix = np.tanh(1.05 * mix) / np.tanh(1.05)

    # normalize to -1.0 dBFS
    peak = np.max(np.abs(mix))
    if peak <= 0:
        raise SystemExit("ERROR: silent mix")
    target = 10 ** (-1.0 / 20.0)  # -1 dBFS
    mix *= target / peak

    # to 16-bit PCM
    pcm = np.clip(mix, -1.0, 1.0)
    pcm16 = (pcm * 32767.0).astype(np.int16)

    out_path = "/home/jp/Videos/jingles/jingle_01_warm-piano.wav"
    import wave
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm16.tobytes())
    print("wrote", out_path)
    print("samples", pcm16.shape, "dur", N / SR)
    print("peak (pre-norm) ", peak, " -> normalized to -1 dBFS")

if __name__ == "__main__":
    main()

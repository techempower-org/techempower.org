#!/usr/bin/env python3
"""
Jingle #6 for "Wait, I Qualify?!" (TechEmpower)
Style: Cheerful ukulele-style plucks under a simple whistled/flute-like melody.
       Sunny, sincere, approachable. Warm public-media community-show vibe.

Key: C major. Progression: C - G - Am - F  -> resolve to C major (I-V-vi-IV feel).
SR 48000, stereo, 16-bit. Normalized to ~ -1.0 dBFS. Tasteful Schroeder reverb.
"""

import numpy as np
from scipy.io import wavfile

SR = 48000

# ---------------------------------------------------------------------------
# Pitch helpers
# ---------------------------------------------------------------------------
def hz(semitones_from_a4: float) -> float:
    return 440.0 * 2.0 ** (semitones_from_a4 / 12.0)

# Semitone offsets from A4 for the notes we need (C major world)
NOTE = {
    "C3": -21, "E3": -17, "G3": -14, "A3": -12,
    "C4": -9,  "D4": -7,  "E4": -5,  "F4": -4, "G4": -2, "A4": 0, "B4": 2,
    "C5": 3,   "D5": 5,   "E5": 7,   "G5": 10, "A5": 12, "C6": 15,
}

def freq(name: str) -> float:
    return hz(NOTE[name])

# ---------------------------------------------------------------------------
# Envelope
# ---------------------------------------------------------------------------
def adsr(n, attack, decay, sustain_level, release, sustain_hold=None):
    """Build an ADSR envelope of n samples. Times in seconds."""
    a = int(attack * SR)
    d = int(decay * SR)
    r = int(release * SR)
    a = max(a, 1); d = max(d, 1); r = max(r, 1)
    s = n - (a + d + r)
    if s < 0:
        # Note too short for full ADSR: shrink sustain to zero, clamp others.
        s = 0
        total = a + d + r
        if total > n:
            scale = n / total
            a = max(int(a * scale), 1)
            d = max(int(d * scale), 1)
            r = max(n - a - d, 1)
    env = np.zeros(n, dtype=np.float64)
    idx = 0
    # Attack: 0 -> 1 (raised-cosine for click-free edge)
    att = 0.5 * (1 - np.cos(np.linspace(0, np.pi, a)))
    env[idx:idx + a] = att; idx += a
    # Decay: 1 -> sustain_level
    env[idx:idx + d] = np.linspace(1.0, sustain_level, d); idx += d
    # Sustain
    if s > 0:
        env[idx:idx + s] = sustain_level; idx += s
    # Release: sustain_level -> 0 (raised-cosine)
    rel = sustain_level * (0.5 * (1 + np.cos(np.linspace(0, np.pi, r))))
    env[idx:idx + r] = rel
    return env

# ---------------------------------------------------------------------------
# Voices
# ---------------------------------------------------------------------------
def ukulele(freq_hz, dur, amp=0.5):
    """
    Plucked nylon-string ukulele-ish tone: bright harmonic stack that decays
    quickly, plus a tiny noisy pluck transient at the onset. Short sustain.
    """
    n = int(dur * SR)
    t = np.arange(n) / SR

    # Harmonic series with a plucked, slightly inharmonic-flavored brightness.
    # Amplitudes fall off; higher harmonics decay faster (plucked string).
    partials = [
        (1.0, 1.00, 3.0),
        (2.0, 0.55, 4.5),
        (3.0, 0.32, 6.0),
        (4.0, 0.18, 8.0),
        (5.0, 0.10, 10.0),
        (6.0, 0.05, 12.0),
    ]
    sig = np.zeros(n, dtype=np.float64)
    for mult, pamp, pdecay in partials:
        # Per-partial exponential decay (plucked: bright then mellow).
        decay_env = np.exp(-pdecay * t)
        sig += pamp * decay_env * np.sin(2 * np.pi * freq_hz * mult * t)

    # Pluck transient: short filtered noise burst (the "tick" of the string).
    tlen = int(0.006 * SR)
    if tlen > 0:
        rng = np.random.default_rng(int(freq_hz) * 7 + 13)
        noise = rng.standard_normal(tlen)
        # simple one-pole lowpass to take harsh edge off
        for i in range(1, tlen):
            noise[i] = 0.6 * noise[i] + 0.4 * noise[i - 1]
        trans = np.zeros(n)
        trans[:tlen] = noise * np.exp(-np.linspace(0, 6, tlen))
        sig += 0.12 * trans

    # Overall plucked amplitude shape: very short attack, mostly natural decay.
    body = np.exp(-3.2 * t)
    env = adsr(n, attack=0.004, decay=0.05, sustain_level=0.0,
               release=0.04)
    # Blend natural string decay with the ADSR release so the tail is clean.
    env = np.maximum(env, 0)
    sig = sig * (0.7 * body + 0.3) * env

    # Normalize this note then scale.
    peak = np.max(np.abs(sig)) or 1.0
    return (sig / peak) * amp

def whistle(freq_hz, dur, amp=0.5, vib_rate=5.2, vib_depth=0.006):
    """
    Whistle / soft flute: near-sine fundamental with a light breathy 2nd/3rd
    harmonic and gentle vibrato. Smooth ADSR, no clicks. The 'melody' voice.
    """
    n = int(dur * SR)
    t = np.arange(n) / SR

    # Vibrato (slow onset so the note starts steady then warms up).
    vib_onset = np.clip(t / max(dur * 0.4, 1e-3), 0, 1)
    vib = 1.0 + vib_depth * vib_onset * np.sin(2 * np.pi * vib_rate * t)
    phase = 2 * np.pi * freq_hz * np.cumsum(vib) / SR

    sig = (1.00 * np.sin(phase)
           + 0.14 * np.sin(2 * phase)
           + 0.05 * np.sin(3 * phase))

    # Tiny breath noise for the "whistle" air, very low level, gated by env.
    rng = np.random.default_rng(int(freq_hz) * 3 + 5)
    breath = rng.standard_normal(n)
    for i in range(1, n):
        breath[i] = 0.05 * breath[i] + 0.95 * breath[i - 1]  # low rumble lowpass
    breath = breath / (np.max(np.abs(breath)) or 1.0)
    sig += 0.025 * breath

    env = adsr(n, attack=0.012, decay=0.04, sustain_level=0.82,
               release=0.06)
    sig = sig * env

    peak = np.max(np.abs(sig)) or 1.0
    return (sig / peak) * amp

# ---------------------------------------------------------------------------
# Sequencer: place a mono note into a stereo buffer with pan.
# ---------------------------------------------------------------------------
def place(buf, mono, start_sec, pan=0.0):
    """pan: -1 = full left, +1 = full right, 0 = center (equal-power)."""
    start = int(start_sec * SR)
    n = len(mono)
    end = start + n
    if end > buf.shape[0]:
        end = buf.shape[0]
        mono = mono[:end - start]
        n = len(mono)
    # Equal-power pan
    angle = (pan + 1) * 0.25 * np.pi  # maps -1..1 -> 0..pi/2
    gl = np.cos(angle)
    gr = np.sin(angle)
    buf[start:end, 0] += mono * gl
    buf[start:end, 1] += mono * gr

# ---------------------------------------------------------------------------
# Schroeder reverb (4 combs + 2 allpass), tasteful short space.
# ---------------------------------------------------------------------------
def comb(x, delay_ms, gain):
    d = int(delay_ms * 0.001 * SR)
    y = np.copy(x)
    if d <= 0:
        return y
    for i in range(d, len(x)):
        y[i] = x[i] + gain * y[i - d]
    return y

def allpass(x, delay_ms, gain):
    d = int(delay_ms * 0.001 * SR)
    y = np.zeros_like(x)
    if d <= 0:
        return x
    for i in range(len(x)):
        xin = x[i]
        delayed = y[i - d] if i - d >= 0 else 0.0
        # Standard allpass: use buffered input as well
        prev_in = x[i - d] if i - d >= 0 else 0.0
        y[i] = -gain * xin + prev_in + gain * delayed
    return y

def reverb_channel(x, wet=0.22):
    combs = [(29.7, 0.78), (37.1, 0.74), (41.1, 0.70), (43.7, 0.68)]
    acc = np.zeros_like(x)
    for dly, g in combs:
        acc += comb(x, dly, g)
    acc /= len(combs)
    acc = allpass(acc, 5.0, 0.7)
    acc = allpass(acc, 1.7, 0.7)
    # Normalize wet path to avoid runaway, then mix.
    p = np.max(np.abs(acc)) or 1.0
    acc = acc / p * (np.max(np.abs(x)) or 1.0)
    return x * (1 - wet) + acc * wet

# ---------------------------------------------------------------------------
# Compose
# ---------------------------------------------------------------------------
def main():
    bpm = 116.0
    beat = 60.0 / bpm          # ~0.517 s
    eighth = beat / 2.0

    total_sec = 7.4
    buf = np.zeros((int(total_sec * SR), 2), dtype=np.float64)

    # Chord plan (one bar each-ish), I-V-vi-IV then back to I (resolve).
    # C major, G major, A minor, F major, C major.
    chords = {
        "C": ["C3", "G3", "C4", "E4", "G4"],
        "G": ["G3", "D4", "G4", "B4", "D5"],
        "Am": ["A3", "E4", "A4", "C5", "E5"],
        "F": ["C3", "F4", "A4", "C5", "F4"],
    }

    # --- Ukulele arpeggio / strum pattern --------------------------------
    # Each chord gets a gentle rolled strum (notes staggered a few ms) plus
    # a couple of arpeggio plucks for forward motion. Pan slightly per string.
    def strum(chord_notes, t0, amp=0.42, roll=0.012, pan_spread=0.35):
        nN = len(chord_notes)
        for i, nm in enumerate(chord_notes):
            note = ukulele(freq(nm), dur=beat * 1.15, amp=amp)
            pan = pan_spread * ((i / (nN - 1)) * 2 - 1)  # low->left, high->right
            place(buf, note, t0 + i * roll, pan=pan)

    def pluck(nm, t0, dur, amp=0.36, pan=0.0):
        place(buf, ukulele(freq(nm), dur=dur, amp=amp), t0, pan=pan)

    # Bar timing
    bar = beat * 2.0  # 2 beats per chord here for a brisk 7s arc
    t = 0.10          # small lead-in silence

    seq = ["C", "G", "Am", "F", "C"]
    bar_starts = []
    for bi, ch in enumerate(seq):
        t0 = t + bi * bar
        bar_starts.append(t0)

    for bi, ch in enumerate(seq[:-1]):  # first four chords get strum + arps
        t0 = bar_starts[bi]
        strum(chords[ch], t0)
        # Two arpeggio plucks on the off-beats for bounce (top two strings).
        top = chords[ch][-2:]
        pluck(top[0], t0 + beat * 1.0, beat * 0.7, amp=0.30, pan=0.18)
        pluck(top[1], t0 + beat * 1.5, beat * 0.6, amp=0.30, pan=0.28)

    # Final chord: a fuller, slightly louder rolled C-major strum (resolution).
    t_final = bar_starts[4]
    strum(chords["C"] + ["C5"], t_final, amp=0.50, roll=0.014, pan_spread=0.40)
    # Add a low root reinforcement for warmth.
    pluck("C3", t_final, beat * 2.6, amp=0.34, pan=0.0)

    # --- Whistle / flute melody (the memorable motif) --------------------
    # Motif rises hopefully then lands on the tonic. Sits on top, center-ish.
    # Phrasing (note, start beat offset within its bar, duration in beats):
    #   Bar C : E4 (pickup feel)  G4
    #   Bar G : D5            B4
    #   Bar Am: C5            A4 -> E5 little lift
    #   Bar F : A4            G4
    #   Bar C : C5 (held, resolved tonic) with a soft G5 sparkle above
    mel = [
        # (note, bar_index, beat_offset, dur_beats, amp, pan)
        ("E4", 0, 0.5, 0.9, 0.44, -0.05),
        ("G4", 0, 1.4, 1.0, 0.46, -0.05),
        ("D5", 1, 0.4, 0.8, 0.45,  0.05),
        ("B4", 1, 1.3, 1.0, 0.44,  0.05),
        ("C5", 2, 0.4, 0.7, 0.46, -0.05),
        ("E5", 2, 1.2, 1.1, 0.47, -0.05),
        ("A4", 3, 0.4, 0.8, 0.44,  0.05),
        ("G4", 3, 1.3, 1.0, 0.45,  0.05),
        ("C5", 4, 0.2, 2.3, 0.50,  0.00),  # resolved tonic, held
    ]
    for nm, bidx, boff, bdur, amp, pan in mel:
        t0 = bar_starts[bidx] + boff * beat
        w = whistle(freq(nm), dur=bdur * beat, amp=amp)
        place(buf, w, t0, pan=pan)

    # A gentle high sparkle on the final tonic (G5) for the uplifting shimmer.
    place(buf, whistle(freq("G5"), dur=beat * 2.0, amp=0.26, vib_depth=0.004),
          bar_starts[4] + beat * 0.5, pan=0.12)

    # ---------------------------------------------------------------------
    # Reverb (per channel), then mix-down.
    # ---------------------------------------------------------------------
    left = reverb_channel(buf[:, 0], wet=0.20)
    right = reverb_channel(buf[:, 1], wet=0.20)
    out = np.stack([left, right], axis=1)

    # Gentle master fade-out on the very end so the tail doesn't cut.
    fade_n = int(0.25 * SR)
    fade = np.linspace(1.0, 0.0, fade_n)
    out[-fade_n:, 0] *= fade
    out[-fade_n:, 1] *= fade
    # Tiny fade-in to guarantee no boundary click.
    fin = int(0.005 * SR)
    out[:fin, 0] *= np.linspace(0, 1, fin)
    out[:fin, 1] *= np.linspace(0, 1, fin)

    # Normalize to -1.0 dBFS peak.
    peak = np.max(np.abs(out))
    target = 10 ** (-1.0 / 20.0)  # -1 dBFS
    if peak > 0:
        out = out / peak * target

    # Safety clamp.
    out = np.clip(out, -1.0, 1.0)

    # 16-bit PCM.
    pcm = (out * 32767.0).astype(np.int16)
    wavfile.write("/home/jp/Videos/jingles/jingle_06_uke-whistle.wav", SR, pcm)
    dur_actual = pcm.shape[0] / SR
    print(f"Wrote WAV: {dur_actual:.3f}s, peak target -1.0 dBFS")

if __name__ == "__main__":
    main()

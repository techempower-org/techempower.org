#!/usr/bin/env python3
"""
Jingle 04 — "Wait, I Qualify?!" intro
Style: Fingerpicked acoustic-guitar (synth plucked-string approximation) + soft shaker.
Cozy Americana / community warmth. Key of G major. ~7 seconds.
Progression: G - D - Em - C  (I - V - vi - IV), resolving to a bright G major.

Builds plucked-string notes as fundamental + decaying harmonics with a
fast pluck attack and natural exponential decay, plays a Travis-style
fingerpicking pattern (alternating bass + treble), layers a soft filtered-noise
shaker on the offbeats, adds a tasteful Schroeder reverb, and mixes to
stereo normalized to about -1 dBFS.
"""

import numpy as np
from scipy.signal import butter, lfilter

SR = 48000


# ----------------------------------------------------------------------------
# Pitch helpers
# ----------------------------------------------------------------------------
def hz(semitones_from_a4: float) -> float:
    return 440.0 * 2.0 ** (semitones_from_a4 / 12.0)


# Note name -> semitones from A4 (we only need what's in this piece)
NOTE = {
    "E2": -29, "G2": -26, "A2": -24, "B2": -22, "C3": -21, "D3": -19, "E3": -17,
    "G3": -14, "A3": -12, "B3": -10, "C4": -9, "D4": -7, "E4": -5, "G4": -2,
    "A4": 0, "B4": 2, "C5": 3, "D5": 5, "E5": 7, "G5": 10,
}


def n(name: str) -> float:
    return hz(NOTE[name])


# ----------------------------------------------------------------------------
# Plucked string voice: fundamental + decaying harmonics, ADSR, pluck character
# ----------------------------------------------------------------------------
def pluck(freq: float, dur: float, amp: float = 0.5, kind: str = "treble") -> np.ndarray:
    nsamp = int(dur * SR)
    t = np.arange(nsamp) / SR

    # Harmonic structure — nylon/steel-ish: strong fundamental, gently rolling-off
    # partials. Bass notes are a touch warmer (fewer bright harmonics).
    if kind == "bass":
        partials = [(1, 1.00), (2, 0.45), (3, 0.20), (4, 0.10), (5, 0.05)]
        decay = 5.5  # quicker damping for low strings
    else:
        partials = [(1, 1.00), (2, 0.50), (3, 0.30), (4, 0.18), (5, 0.10), (6, 0.05)]
        decay = 4.2

    sig = np.zeros(nsamp)
    for k, ph_amp in partials:
        # Higher partials decay faster (string damping) -> natural pluck timbre.
        env_k = np.exp(-decay * (1.0 + 0.6 * (k - 1)) * t)
        # tiny per-partial inharmonicity for realism
        detune = 1.0 + 0.0006 * (k - 1)
        sig += ph_amp * env_k * np.sin(2 * np.pi * freq * k * detune * t)

    # Pluck "pick" transient: a very short bright noise burst at onset.
    pick_len = int(0.006 * SR)
    if pick_len > 0:
        burst = np.random.randn(pick_len) * np.linspace(1.0, 0.0, pick_len)
        sig[:pick_len] += 0.18 * burst

    # ADSR with fast attack & short release so there are no clicks at edges.
    atk = int(0.006 * SR)   # 6 ms attack
    rel = int(0.012 * SR)   # 12 ms release
    env = np.ones(nsamp)
    if atk > 0:
        env[:atk] = np.linspace(0.0, 1.0, atk)
    if rel > 0:
        env[-rel:] *= np.linspace(1.0, 0.0, rel)
    sig *= env

    # Overall plucked amplitude decay shape on top (body resonance settle).
    sig *= np.exp(-1.4 * t)

    return (amp * sig).astype(np.float64)


# ----------------------------------------------------------------------------
# Soft shaker: short band-passed noise with a fast percussive envelope
# ----------------------------------------------------------------------------
def shaker(dur: float = 0.09, amp: float = 0.10) -> np.ndarray:
    nsamp = int(dur * SR)
    noise = np.random.randn(nsamp)
    # band-pass around ~6-9 kHz for a soft "sh" texture
    b, a = butter(2, [5000 / (SR / 2), 9500 / (SR / 2)], btype="band")
    filt = lfilter(b, a, noise)
    t = np.arange(nsamp) / SR
    env = np.exp(-55.0 * t)             # snappy decay
    env[: int(0.002 * SR)] *= np.linspace(0.0, 1.0, int(0.002 * SR))  # de-click attack
    return (amp * filt * env).astype(np.float64)


# ----------------------------------------------------------------------------
# Schroeder reverb (4 comb + 2 allpass) — tasteful small room
# ----------------------------------------------------------------------------
def comb(x, delay_ms, g):
    d = int(delay_ms / 1000.0 * SR)
    y = np.zeros(len(x) + d)
    buf = x.copy()
    y[:len(x)] = buf
    for i in range(d, len(y)):
        src = y[i - d]
        if i < len(x):
            y[i] = x[i] + g * src
        else:
            y[i] = g * src
    return y


def allpass(x, delay_ms, g):
    d = int(delay_ms / 1000.0 * SR)
    y = np.zeros(len(x) + d)
    for i in range(len(y)):
        xn = x[i] if i < len(x) else 0.0
        yd = y[i - d] if i - d >= 0 else 0.0
        xd = x[i - d] if (i - d >= 0 and i - d < len(x)) else 0.0
        y[i] = -g * xn + xd + g * yd
    return y


def reverb(x, wet=0.22):
    combs = [(29.7, 0.78), (37.1, 0.74), (41.1, 0.70), (43.7, 0.68)]
    acc = np.zeros(len(x) + int(0.05 * SR))
    for dly, g in combs:
        c = comb(x, dly, g)
        acc[: len(c)] += c
    acc /= len(combs)
    a1 = allpass(acc, 5.0, 0.7)
    a2 = allpass(a1, 1.7, 0.7)
    out = np.zeros(max(len(x), len(a2)))
    out[: len(a2)] += a2
    dry = np.zeros(len(out))
    dry[: len(x)] = x
    return (1 - wet) * dry + wet * out


# ----------------------------------------------------------------------------
# Arrange the piece
# ----------------------------------------------------------------------------
def main():
    tempo = 96.0                 # gentle, walkable
    beat = 60.0 / tempo          # ~0.625 s per quarter
    eighth = beat / 2.0

    # Total length generous; we trim/pad later.
    total = int(8.0 * SR)
    L = np.zeros(total)
    R = np.zeros(total)

    def place(buf, sig, start_t, pan=0.0):
        i0 = int(start_t * SR)
        i1 = i0 + len(sig)
        gl = np.sqrt((1 - pan) / 2.0)  # equal-power pan, pan in [-1,1]
        gr = np.sqrt((1 + pan) / 2.0)
        if i1 > len(buf[0]):
            sig = sig[: len(buf[0]) - i0]
            i1 = len(buf[0])
        buf[0][i0:i1] += gl * sig
        buf[1][i0:i1] += gr * sig

    stereo = (L, R)

    # Chords as (bass root note, [treble chord tones]). One bar each (~2.5 s? no:
    # 4 beats/bar). We use a faster pattern: each chord lasts 2 beats so the whole
    # 4-chord phrase + tag fits ~7 s.
    # G:  bass G2, treble {D4, G4, B4}
    # D:  bass D3, treble {A4, D5, F#... use A4,D5} (keep diatonic, bright)
    # Em: bass E3, treble {G4, B4, E5}
    # C:  bass C3, treble {G4, C5, E5}
    chords = [
        ("G2", ["D4", "G4", "B4"]),
        ("D3", ["A4", "D5", "E5"]),
        ("E3", ["G4", "B4", "E5"]),
        ("C3", ["G4", "C5", "E5"]),
    ]

    # Travis pattern per chord (2 beats = 4 eighths):
    #   e0: bass (root)
    #   e1: treble[1]
    #   e2: bass alt (fifth, an octave detail) / treble[0]
    #   e3: treble[2]
    # offsets in eighths
    bar_beats = 2.0
    bar_dur = bar_beats * beat
    t = 0.20  # small lead-in so it doesn't start dead on zero

    melody_motif_times = []  # remember treble-top hits for the motif accent

    for (broot, ttones) in chords:
        bfreq = n(broot)
        # bass notes
        place(stereo, pluck(bfreq, bar_dur * 0.9, amp=0.50, kind="bass"),
              t + 0 * eighth, pan=-0.18)
        place(stereo, pluck(bfreq * 1.5, bar_dur * 0.5, amp=0.30, kind="bass"),
              t + 2 * eighth, pan=-0.10)  # fifth as alternating bass

        # treble plucks (the fingerpicked top), panned slightly right
        place(stereo, pluck(n(ttones[1]), bar_dur * 0.7, amp=0.42, kind="treble"),
              t + 1 * eighth, pan=0.22)
        place(stereo, pluck(n(ttones[0]), bar_dur * 0.6, amp=0.34, kind="treble"),
              t + 2 * eighth, pan=0.12)
        place(stereo, pluck(n(ttones[2]), bar_dur * 0.8, amp=0.46, kind="treble"),
              t + 3 * eighth, pan=0.28)
        melody_motif_times.append(t + 3 * eighth)

        # soft shaker on each eighth, alternating slight pan, quieter on downbeat
        for e in range(4):
            amp = 0.07 if e % 2 == 0 else 0.10
            place(stereo, shaker(0.085, amp=amp), t + e * eighth,
                  pan=0.05 if e % 2 else -0.05)

        t += bar_dur

    # --- Resolving tag: a clear, ringing G MAJOR chord on the downbeat ---
    tag_t = t
    # full open-G voicing, let it ring (long decay)
    g_chord = [("G2", -0.18, 0.50, "bass"),
               ("D3", -0.10, 0.34, "bass"),
               ("G3",  0.00, 0.40, "treble"),
               ("B3",  0.12, 0.40, "treble"),
               ("D4",  0.20, 0.40, "treble"),
               ("G4",  0.28, 0.46, "treble")]
    ring = 2.6
    for name, pan, amp, kind in g_chord:
        place(stereo, pluck(n(name), ring, amp=amp, kind=kind), tag_t, pan=pan)
    # a sweet high motif note to button it (B then up to D, landing on the chord)
    place(stereo, pluck(n("B4"), 0.45, amp=0.30, kind="treble"), tag_t, pan=0.25)
    place(stereo, pluck(n("D5"), 1.6, amp=0.34, kind="treble"), tag_t + eighth, pan=0.20)
    # gentle final shaker, then let reverb tail breathe
    place(stereo, shaker(0.10, amp=0.06), tag_t, pan=0.0)

    # ------------------------------------------------------------------
    # Reverb (apply per channel), mix, normalize
    # ------------------------------------------------------------------
    Lw = reverb(L, wet=0.20)
    Rw = reverb(R, wet=0.20)
    m = max(len(Lw), len(Rw))
    Lw = np.pad(Lw, (0, m - len(Lw)))
    Rw = np.pad(Rw, (0, m - len(Rw)))

    # Trim to a clean 7.0 s with a soft fade-out tail so the reverb doesn't cut.
    end = int(7.0 * SR)
    if m < end:
        Lw = np.pad(Lw, (0, end - m))
        Rw = np.pad(Rw, (0, end - m))
    Lw = Lw[:end]
    Rw = Rw[:end]

    # Soft fade-out over last 600 ms (no abrupt cut -> no click)
    fade = int(0.6 * SR)
    win = np.linspace(1.0, 0.0, fade) ** 1.5
    Lw[-fade:] *= win
    Rw[-fade:] *= win
    # tiny fade-in to be safe
    fi = int(0.005 * SR)
    Lw[:fi] *= np.linspace(0, 1, fi)
    Rw[:fi] *= np.linspace(0, 1, fi)

    stereo_out = np.stack([Lw, Rw], axis=1)

    # Normalize peak to -1.0 dBFS
    peak = np.max(np.abs(stereo_out))
    target = 10 ** (-1.0 / 20.0)
    if peak > 0:
        stereo_out *= target / peak

    # 16-bit PCM
    pcm = np.clip(stereo_out, -1.0, 1.0)
    pcm16 = (pcm * 32767.0).astype(np.int16)

    import wave
    out = "/home/jp/Videos/jingles/jingle_04_acoustic-folk.wav"
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm16.tobytes())
    print("wrote", out, "frames", pcm16.shape)


if __name__ == "__main__":
    np.random.seed(7)
    main()

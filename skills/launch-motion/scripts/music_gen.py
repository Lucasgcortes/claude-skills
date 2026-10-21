"""Synthesizes a simple, license-free background track (no samples, pure numpy).
Good enough for drafts, demos and when nobody has a licensed track. A real licensed track sounds better.

usage: python3 music_gen.py out.wav [--bpm 112] [--dur 40] [--mood bright|warm|dark|calm] [--seed 3]
Structure: 1-bar intro (pad + hats) → groove (kick, clap, bass, pluck) → lift every 8 bars → soft last bar.
Bars start on the beat grid, so beats.py analyze/sync works on it like on any track.
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

a = sys.argv[1:]
if not a: print(__doc__); sys.exit(1)
OUT = a[0]
opt = lambda k, d: type(d)(a[a.index('--' + k) + 1]) if '--' + k in a else d
BPM, DUR, MOOD, SEED = opt('bpm', 112.0), opt('dur', 40.0), opt('mood', 'bright'), opt('seed', 3)
SR = 48000; rng = np.random.default_rng(SEED)
beat = 60 / BPM; bar = 4 * beat; nbars = int(np.ceil(DUR / bar)) + 1
N = int(nbars * bar * SR); L = np.zeros(N); R = np.zeros(N)

# chord progressions (semitones from A2 = 110 Hz root)
PROG = {
    'bright': [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]],   # Imaj7 IVmaj7 vi V
    'warm':   [[0, 4, 7, 14], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]],
    'dark':   [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -1, 2, 5]],         # i VI VII v
    'calm':   [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [5, 8, 12, 15]],
}[MOOD]
ROOT = 110.0 if MOOD != 'dark' else 98.0
f = lambda st: ROOT * 2 ** (st / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i + n] += sig[:n] * gain * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + n] += sig[:n] * gain * np.sqrt((1 + pan) / 2) * 1.414


def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x)


def kick():
    t = np.arange(int(.35 * SR)) / SR; fr = 48 + 110 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 9) + .3 * np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 60)


def clap():
    n = int(.25 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    env = np.exp(-t * 22) + .6 * np.exp(-((t - .012) * 300) ** 2) + .5 * np.exp(-((t - .024) * 300) ** 2)
    return sosfilt(butter(2, [900, 4200], 'band', fs=SR, output='sos'), x) * env


def hat(open_=False):
    n = int((.18 if open_ else .05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 90))


def bass(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + .35 * np.sin(2 * np.pi * 2 * freq * t) + .15 * np.sign(np.sin(2 * np.pi * freq * t))
    env = np.minimum(1, t / .005) * np.exp(-t * 3.2)
    return lp(x * env, 420)


def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for fr in freqs:
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * fr * 2 ** (det / 12) * t
            x += (2 * ((ph / (2 * np.pi)) % 1) - 1) * .5  # saw
    x = lp(x, 1600 if MOOD != 'calm' else 1100, 2)
    env = np.minimum(1, t / .4) * np.minimum(1, (dur - t) / .3)
    return x * env / len(freqs)


def pluck(freq, dur=.32):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + .5 * np.sin(2 * np.pi * 2 * freq * t) + .2 * np.sin(2 * np.pi * 3 * freq * t)
    return lp(x * np.exp(-t * 11), 3500)


K, C, HH, HO = kick(), clap(), hat(), hat(True)
for b in range(nbars):
    t0 = b * bar; ch = PROG[b % len(PROG)]
    intro = b == 0; last = b == nbars - 1; lift = (b % 8) >= 4
    add(pad([f(s + 12) for s in ch], bar + .3), t0, .32 if not intro else .4, 0)
    for k in range(8):  # eighth-note hats
        add(HH if k % 2 == 0 else HO * .5, t0 + k * beat / 2, .16 if not intro else .1, .3 if k % 2 else -.3)
    if intro or last: continue
    for k in range(4):
        add(K, t0 + k * beat, .9)
        if k in (1, 3): add(C, t0 + k * beat, .35, .1)
    # bass: root on 1, octave pickups
    pat = [(0, 0, .45), (1.5, 0, .3), (2, 0, .45), (3.5, 12, .25)]
    for pos, oct_, dur in pat: add(bass(f(ch[0] - 12 + oct_) , dur * beat * 2), t0 + pos * beat, .55)
    # pluck arpeggio, busier on lift bars
    steps = 8 if lift else 4
    for k in range(steps):
        note = ch[[0, 2, 1, 3, 2, 1, 3, 2][k % 8]] + 24
        add(pluck(f(note)), t0 + k * bar / steps, .13 if lift else .1, [-.4, .4][k % 2])

mix = np.stack([L, R], 1)[: int((DUR + .5) * SR)]
# gentle bus compression + limiter
peak = np.max(np.abs(mix)); mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * .85
fade = int(.02 * SR); mix[:fade] *= np.linspace(0, 1, fade)[:, None]
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
print(f'ok {OUT}  {BPM:.0f} bpm  {DUR:.0f}s  mood {MOOD}  bar = {bar:.3f}s')

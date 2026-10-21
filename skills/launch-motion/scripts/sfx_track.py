"""Builds the sound-effects track from the cues produced during render.
usage: python3 sfx_track.py body.sfx.json output.wav [--gain 0.5]
body.sfx.json = [{"t": seconds_in_video, "name": "whoosh", "gain": 1}, ...]
The sounds live in ../assets/sfx. Cues of the same sound that are very close together (< 60 ms) are merged.
"""
import sys, os, json
import numpy as np
from scipy.io import wavfile

a = sys.argv[1:]
cues = json.load(open(a[0])); out = a[1]
G = float(a[a.index('--gain') + 1]) if '--gain' in a else 0.5
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sfx')
SR = 48000
lib = {}
for f in os.listdir(D):
    if f.endswith('.wav'):
        sr, x = wavfile.read(os.path.join(D, f)); x = x.astype(np.float32) / 32767
        if x.ndim == 1: x = np.stack([x, x], 1)
        lib[f[:-4]] = x
end = max([c['t'] for c in cues] + [0]) + 2
mix = np.zeros((int(end * SR), 2), np.float32)
last = {}
for c in sorted(cues, key=lambda c: c['t']):
    n = c['name']
    if n not in lib or c['t'] < 0: continue
    if n in last and c['t'] - last[n] < 0.06: continue
    last[n] = c['t']
    s = lib[n] * c.get('gain', 1) * G; i = int(c['t'] * SR)
    mix[i:i + len(s)] += s[: len(mix) - i]
peak = np.abs(mix).max()
if peak > 0.95: mix *= 0.95 / peak
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('ok', out, len(cues), 'cues')

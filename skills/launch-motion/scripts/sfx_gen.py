"""Generates the skill's sound-effects library (synthesized, no third-party licensing).
usage: python3 sfx_gen.py <output_folder>
Sounds: whoosh, whoosh_soft, click, pop, tick, impact, riser
"""
import sys, os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def env(n, a, r, curve=3.0):
    """attack/release envelope (in samples)"""
    e = np.zeros(n)
    a = max(1, a); r = max(1, n - a)
    e[:a] = np.linspace(0, 1, a) ** 1.6
    e[a:] = np.exp(-curve * np.linspace(0, 1, r))
    return e


def sweep_band(x, f0, f1, q=1.2, blocks=48):
    """band-pass filter sweeping from f0 to f1 (in blocks, with crossfade)"""
    n = len(x); out = np.zeros(n); bl = n // blocks
    fs = np.geomspace(f0, f1, blocks)
    for i, f in enumerate(fs):
        lo, hi = f / (1 + 1 / (2 * q)), f * (1 + 1 / (2 * q))
        sos = butter(2, [max(20, lo), min(SR / 2 - 100, hi)], btype='band', fs=SR, output='sos')
        s = max(0, i * bl - bl); e = min(n, (i + 1) * bl + bl)
        seg = sosfilt(sos, x[s:e])
        w = np.hanning(len(seg))
        out[s:e] += seg * w
    return out


def stereo(m, pan_from=-0.3, pan_to=0.3):
    p = np.linspace(pan_from, pan_to, len(m))
    l = m * np.sqrt((1 - p) / 2); r = m * np.sqrt((1 + p) / 2)
    return np.stack([l, r], 1)


def norm(x, peak=0.8):
    return x / (np.abs(x).max() + 1e-9) * peak


def save(path, x):
    if x.ndim == 1: x = stereo(x, 0, 0)
    fade = int(0.004 * SR); x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def whoosh(dur=0.7, f0=90, f1=750, peak=0.8, pan=(-0.4, 0.4)):
    """low air pass-by: filtered noise sweeping the low/mid range, no high-end hiss, with a sub underneath"""
    n = int(dur * SR); x = rng.standard_normal(n)
    up = sweep_band(x[: n // 2 + 2000], f0, f1, q=0.9)
    dn = sweep_band(x[n // 2 - 2000:], f1, f0 * 1.3, q=0.9)
    y = np.zeros(n); y[: len(up)] += up * np.r_[np.ones(len(up) - 4000), np.linspace(1, 0, 4000)]
    y[n // 2 - 2000:] += dn * np.r_[np.linspace(0, 1, 4000), np.ones(len(dn) - 4000)]
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (55 + 25 * np.sin(np.pi * t / dur)) * t) * 0.35
    y = norm(y) + sub
    y = sosfilt(butter(4, 1400, btype='low', fs=SR, output='sos'), y)   # cut the highs
    y *= env(n, int(n * 0.5), n, 3.5)
    return stereo(norm(y, peak), *pan)


def click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 260) + 0.25 * rng.standard_normal(n) * np.exp(-t * 900)
    return norm(y, 0.55)


def pop():
    """short, low thud (card opening): body around ~110 Hz, little pitch movement, no 'boing'"""
    n = int(0.22 * SR); t = np.arange(n) / SR
    f = 150 * np.exp(-t * 30) + 95
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    nz = sosfilt(butter(2, 500, btype='low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 60)
    y = body + 0.35 * nz
    return norm(sosfilt(butter(2, 1800, btype='low', fs=SR, output='sos'), y), 0.7)


def tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 500) + 0.15 * rng.standard_normal(n) * np.exp(-t * 1200)
    return norm(y, 0.35)


def impact():
    n = int(0.55 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (70 * np.exp(-t * 6) + 45) * t) * np.exp(-t * 7)
    nz = sosfilt(butter(2, 900, btype='low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 30)
    return norm(body + 0.5 * nz, 0.75)


def riser(dur=1.2):
    n = int(dur * SR); x = rng.standard_normal(n)
    y = sweep_band(x, 300, 5000, q=2.0) * np.linspace(0, 1, n) ** 2
    return stereo(norm(y, 0.55), 0, 0)


def notif():
    """soft two-note notification (message arriving), mellow sine with quick decay"""
    n = int(.42 * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for f, t0 in ((660, 0), (988, .11)):
        tt = np.clip(t - t0, 0, None); env = (t >= t0) * np.exp(-tt * 14) * np.minimum(1, tt / .004)
        y += np.sin(2 * np.pi * f * tt) * env + .25 * np.sin(2 * np.pi * 2 * f * tt) * env
    return norm(sosfilt(butter(2, 3000, 'low', fs=SR, output='sos'), y), .5)


def key():
    """keyboard key: short low click + tiny noise"""
    n = int(.045 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 400) + .5 * sosfilt(butter(2, [800, 4000], 'band', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 300)
    return norm(y, .4)


def swish():
    """short exit swish (elements leaving)"""
    return whoosh(.32, 120, 900, .5, (.3, -.3))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'sfx'; os.makedirs(out, exist_ok=True)
    save(f'{out}/whoosh.wav', whoosh())
    save(f'{out}/whoosh_soft.wav', whoosh(0.5, 70, 480, 0.5, (-0.2, 0.2)))
    save(f'{out}/click.wav', click())
    save(f'{out}/pop.wav', pop())
    save(f'{out}/tick.wav', tick())
    save(f'{out}/impact.wav', impact())
    save(f'{out}/riser.wav', riser())
    save(f'{out}/notif.wav', notif())
    save(f'{out}/key.wav', key())
    save(f'{out}/swish.wav', swish())
    print('ok', sorted(os.listdir(out)))

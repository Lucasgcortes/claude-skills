"""Music analysis and syncing the animation to it.

1) Analyze:   python3 beats.py analyze music.mp3
   Prints BPM, the first beats and the energy profile (to find the intro, the build-up/"drop" and breaks).
   Saves <music>_beats.npy next to the music file.

2) Sync:      python3 beats.py sync music.mp3 anchors.json sync.json [--offset 0] [--strong 29.4]
   anchors.json = [[design_time, "b"|"d"|"S"], ...]
     "b" = land on any beat (short transitions, punch words)
     "d" = land on the start of a bar (scene change)
     "S" = land exactly on the strong moment (--strong, in seconds of the music)
   Writes sync.json with the [video_time, design_time] map used by render.js --sync.
   --offset: the second of the music at which the video starts.

3) Cut a section (optional, when the music has a break that would kill the energy):
   python3 beats.py cut music.mp3 output.wav --from 33.13 --to 41.31
   Always cut from the start of a bar to the start of a bar (use the times printed by "analyze").
"""
import sys, json, subprocess
import numpy as np


def load(path):
    import librosa
    y, sr = librosa.load(path, sr=22050, mono=True)
    return librosa, y, sr


def analyze(path):
    librosa, y, sr = load(path)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    bt = librosa.frames_to_time(beats, sr=sr)
    np.save(path.rsplit('.', 1)[0] + '_beats.npy', bt)
    print('duration %.1fs  BPM %.1f  beats %d' % (len(y) / sr, float(np.atleast_1d(tempo)[0]), len(bt)))
    print('first beats:', np.round(bt[:8], 2))
    rms = librosa.feature.rms(y=y, hop_length=1024)[0]
    t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=1024)
    mx = rms.max()
    for s in np.arange(0, len(y) / sr, 1.0):
        m = rms[(t >= s) & (t < s + 1)].mean()
        print('%6.1fs %s' % (s, '#' * int(m / mx * 60)))


def sync(path, anc_path, out, offset=0.0, strong=None):
    bt = np.load(path.rsplit('.', 1)[0] + '_beats.npy') - offset
    bt = bt[bt >= 0]
    anc = json.load(open(anc_path))
    ref = int(np.argmin(abs(bt - (strong - offset)))) if strong else 0
    db = np.array([bt[j] for j in range(len(bt)) if (j - ref) % 4 == 0])
    m = [(0.0, 0.0)]; prev = 0.0
    for d, k in anc:
        if k == 'S' and strong:
            x = float(bt[ref])
        else:
            arr = db if k == 'd' else bt
            c = arr[arr > prev + 0.3]
            x = float(c[np.argmin(abs(c - d))])
        m.append((round(x, 3), d)); prev = x
        print('design %6.2f -> video %6.3f (%+.2f)' % (d, x, x - d))
    json.dump({'map': m}, open(out, 'w'))
    print('saved', out, '- add a final anchor [final_design_time, ...] if you need to extend it.')


def cut(path, out, start, end):
    f = f"[0:a]atrim=0:{start + 0.03},asetpts=PTS-STARTPTS[a];[0:a]atrim={end},asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.03:c1=tri:c2=tri[m]"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-filter_complex', f, '-map', '[m]', out], check=True)
    print('saved', out)


if __name__ == '__main__':
    a = sys.argv[1:]
    op = lambda k, d=None: float(a[a.index('--' + k) + 1]) if '--' + k in a else d
    if a[0] == 'analyze': analyze(a[1])
    elif a[0] == 'sync': sync(a[1], a[2], a[3], op('offset', 0.0), op('strong'))
    elif a[0] == 'cut': cut(a[1], a[2], op('from'), op('to'))

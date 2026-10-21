# Music

## What to ask for
- A track at least as long as the video + 5 s.
- Feature/internal: 110–145 BPM, clear beat, no lead vocal. Brand/explainer: 95–130 BPM, lighter and optimistic.
- A calmer start and an energy lift (drop) is ideal: the "problem/before" part sits in the intro and the drop lands on impact words or numbers.
- License: only tracks the brand can use commercially on that channel (stock libraries like Artlist, Epidemic, Musicbed under the company's plan, or original music). Popular songs get muted or blocked on Instagram/YouTube/LinkedIn.

## No track? Generate one
`python3 scripts/music_gen.py music.wav --bpm 116 --dur 45 --mood bright|warm|dark|calm`
Pure synthesis (no samples), license-free. It's simple; say so and suggest a licensed track for the final version if the video matters a lot. Match mood to the brand adjectives (playful → bright 118–126; premium → calm 96–104; tech/bold → dark 120–128).

## How to sync
1. `python3 scripts/beats.py analyze music.mp3` → BPM, beats, energy profile. Find the start, drop, breaks, builds.
2. Choose the offset (second of the track where the video starts) so the strong moment lands on the right scene.
3. If the track has a long break that would drop energy mid-video, cut bar to bar: `beats.py cut music.mp3 out.wav --from X --to Y` (30 ms crossfade).
4. List the HTML anchors (start of each scene and each short transition) in anchors.json as `[[design_time, "b"|"d"|"S"], ...]`: "b" any beat, "d" downbeat/bar start, "S" the strong moment. Run `beats.py sync`. Shifts up to ~0.8 s per anchor are invisible; if a scene gets sped up more than ~1.3x, move neighbouring anchors to earlier/later bars.
5. Render with `--sync sync.json`. finalize.sh adds the music with a 2.5 s fade at the end.

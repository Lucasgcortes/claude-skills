# Technical

## Setup (once per project)
```bash
SK=<this skill folder>; P=~/videos/project-x
bash $SK/scripts/setup.sh $P          # playwright + chromium, gsap (npm), librosa/scipy/pillow, kit/, template, example brand.json
cd $P; export NODE_PATH=$P/node_modules
# edit brand.json (see references/brand-intake.md), put logo files next to it
python3 $SK/scripts/brand.py brand.json kit --format 9x16     # 9x16 | 16x9 | 1x1 | 4x5
```
If Chromium is preinstalled (e.g. /opt/pw-browsers/chromium) set `PW_CHROMIUM` to its path and setup skips the download.

## HTML structure
- One `#stage` the size of the video; each scene is a `.sc` with `.light` or `.dark` (or `.accent-bg`). Scenes entering with `M.wipe` have `.wipe`; scenes entering with `M.T.*` start hidden: `gsap.set('.sc:not(#s1):not(.wipe)',{autoAlpha:0})`.
- Load in this order: `kit/theme.css`, `kit/gsap.min.js`, `kit/motion.js`, `kit/format.js`. Then build the DOM, run `M.splitWords()`, `M.splitLetters()`, `M.buildRoll()`, `M.buildSparks()` and write the timeline with the helpers.
- Headlines: `<div class="title"><span class="ln"><span class="base">regular voice</span></span><span class="ln"><span class="em">emphasis</span></span></div>`. One `.ln` per line, balanced lengths.
- Position with the theme variables: `left:var(--x0)`, `top:calc(var(--y0) + 330px)`, `width:var(--safe-w)`.
- Define `window.DUR` (seconds).
- Full example: `examples/catalog-9x16.html` (every helper and transition, with demo labels).

## Helpers (motion.js)
| Helper | Use |
|---|---|
| `M.kick(sel,t)` · `M.title(sel,t)` · `M.tout(sel,t)` | kicker, headline in/out word by word |
| `M.winOpen(sel,t,stagger,origin)` · `M.winClose` | cards/screenshots opening like a window |
| `M.wordList(sel,t,step)` → end time | rolling list of words |
| `M.letters(sel,t)` | impact word letter by letter (+ accent dot) |
| `M.roll(sel,t)` | giant rolling number (`.gnum data-n`) |
| `M.count(scope,t,dur)` · `M.bars` · `M.draw` | counters, bars, line charts |
| `M.marker(sel,t,h)` | accent marker behind `.mk` words |
| `M.popIn(sel,t,stagger,rot)` | small floating UI pieces (badges, glass cards); `rot` only if the brand's motion does it |
| `M.slideIn(sel,t,dir)` · `M.dissolve(sel,t)` | phone/dashboard mockups entering from a side; dissolving a group for a state change |
| `M.drift(sel,t,dur)` | slow camera drift |
| `M.fan(el,src,t,{n,step,shrink,tilt,origin})` → `{close(t)}` | product cut-out splitting into N copies like a hand of cards; `close` gathers them before the exit |
| `M.type(el,text,t,cps,caret)` → end time | typing letter by letter with key sounds and blinking caret |
| `M.click(cursor,target,t,{fx,fy,ripple})` | cursor glides to a button and clicks (click + ripple + impact) |
| `M.float(sel,t,dur,amp)` · `M.push(scene,t,dur,to,origin)` · `M.bgPan(sel,t,dur)` · `M.pulse(sel,t)` | idle motion: floating pieces, camera push, gradient pan, emphasis pulse on the beat |
| `M.wipe(sel,t,x,y)` · `M.hide(sel,t)` | circle reveal; hide the scene underneath afterwards |
| `M.T.sweep/stack/expandFrom/whip/shutter/blinds/throughWord/blur/zoomIn/zoomOut/circle(from,to,t,…)` | full transitions (handle z-index, show/hide, sound) |
| `M.focus(scene,el,t,zoom,d,fx,fy)` · `M.unfocus(scene,t)` | camera punch-in on a point of an element |
| `M.outro(sel,t)` | logo + tagline ending |
| `M.sfx(name,t,gain)` | manual sound cue |

## Commands
```bash
# frames for approval (name@second when the scene is fully built)
node $SK/scripts/board.js video.html board "1 Opening@3.2" "2 Pain@6.9" --w 1080 --h 1920
python3 $SK/scripts/sheet.py board frames.png; python3 $SK/scripts/sheet.py board frames_guides.png --guides
# saved page (SingleFile)
node $SK/scripts/layers.js page.html map
node $SK/scripts/layers.js page.html images L/
node $SK/scripts/layers.js page.html shot L/ "#pricing [class*=grid] > *" plan 0
# video clips as image sequences (30 fps), cropped to the card
ffmpeg -ss 81.5 -t 3.4 -i clip.mp4 -vf "fps=30,crop=1119:1080:760:0,scale=870:840" -q:v 4 T/name/%03d.jpg
#   in HTML: <img class="take" data-dir="T/name" data-n="103" data-t0="18.85">
# music
python3 $SK/scripts/music_gen.py music.wav --bpm 116 --dur 45 --mood bright
python3 $SK/scripts/beats.py analyze music.wav
python3 $SK/scripts/beats.py sync music.wav anchors.json sync.json --offset 0 --strong 12.4
# render (≈2–5 min for 45 s; run in background and follow the log)
nohup node $SK/scripts/render.js video.html body.mp4 --w 1080 --h 1920 --sync sync.json > render.log 2>&1 &
# final: music + sound effects (gain 0.5–0.7 with music)
bash $SK/scripts/finalize.sh body.mp4 music.wav final.mp4 0 body.sfx.json 0.6
```
No music: pass `-` instead of the file. Regenerate the sound library: `python3 $SK/scripts/sfx_gen.py $SK/assets/sfx`.

## Known pitfalls
- **Class name collisions**: theme.css and motion.js use `.k`, `.n`, `.s`, `.w`, `.em`, `.base`, `.title`, `.card`, `.sc`… Prefix project classes (`.fk`, `.prj-…`); a global `.k` once turned every kicker label into a card image.
- Rolling numbers (`.gnum`): give the container `height` = `data-h`, `padding-right` ≥ 12 px and no `overflow` clipping on parents, or the last digit gets cut. Put the unit in its own element beside the number.
- `M.rect` falls back to getBoundingClientRect for SVG elements (they have no offsetLeft).
- A space between a `.base` span and an inline-block `.em` can collapse during transforms: write it as its own `<span class="base">&nbsp;</span>`.
- Positions generated with `(i * k) % n` form visible diagonal lines; use a seeded random with a minimum distance.
- Cutting out a brand image from a flat/gradient background: build an alpha mask from color distance (e.g. R−B and min(R,G,B) thresholds), median filter, 1 px blur; check it over a light background.
- `window.seek` must not return the GSAP timeline (serializing it hangs page.evaluate). motion.js returns 0.
- Fonts: wait for `document.fonts.ready` before the first frame (render/board do). Width measurements taken before fonts load are wrong: use fixed sizes or function-based values (evaluated on first render).
- Space between `.base` and `.em` spans inherits the parent font-size: `.title` has 80px so the space doesn't vanish.
- **Old scene reappearing**: lower layers stay there. Hide each scene with `M.hide` once the next covers it (M.T transitions do this).
- CSS filters: tween from and to the same function (blur→blur, brightness→brightness). Mixing them makes GSAP interpolate garbage and the frame goes black. M.T helpers use fromTo.
- Measuring elements while building the timeline goes wrong if another tween already applied a transform: use `M.rect(el)`.
- Zoom transitions cut at peak blur and paint #stage with the next scene's color. Avoid long crossfades between light and dark scenes: the mix turns muddy grey.
- `M.focus` and `M.drift` both move the scene: don't use them on the same scene at the same time.
- Sandbox without internet access to the brand's site: use screenshots/SingleFile. Website images are often low-res (~300–600 px): don't scale them more than ~1.5x.
- Third-party content inside screenshots (other brands, customer names, personal data) — crop it out or blur it, and ask.

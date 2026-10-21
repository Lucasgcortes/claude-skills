# Design

## Typography
- Headlines mix two voices in one sentence: `.base` (regular voice) and `.em` (emphasis). How they differ comes from brand.json `headline` (weight contrast, italic voice + bold, all caps).
  e.g. *"Why is Northwind the* **fastest way** *to ship?"*
- Hierarchy by size contrast: the main number/word huge, the complement smaller.
- Sizes are set per format by brand.py (`--t-em`, `--t-base`); impact words are 1.6x the emphasis size. Adjust down only if a word doesn't fit the safe width.
- Body font: kickers (uppercase, tracked), labels, numbers, recreated UI.
- Balanced line breaks; no short word ("a", "of", "to", "e", "de") alone at a line end; prefer 2–3 lines.

## Color
- Light scenes (`.light`) are the default; `.dark` for "before/problem", alternating impact words and proof numbers; `.accent-bg` only if `accent_use` is `fill`.
- Accent follows `accent_use`:
  - `details`: final dot of impact words, a line under a number, a progress bar. Never paint whole words.
  - `word`: the `.em` words take the accent color (and `accent_on_dark` on dark scenes). One emphasis per headline.
  - `marker`: highlight behind 1–2 key words per scene (`M.marker`).
  - `fill`: accent background for impact scenes and the outro; text in `--accent-fg`.
- Never introduce colors outside brand.json. Product UI colors (green/red for deltas) are fine inside recreated UI.

## Layout (screen organization)
- **One margin**: everything aligns to the safe-area left edge (`var(--x0)`). Kicker, headline and cards start at the same x. Center only impact words, lone numbers and the outro.
- **Grid**: 9:16 has 840 px of usable width: 1 column (840) or 2 columns (405 + 30 + 405). 16:9: 12 columns over 1680 px. Card widths come from the grid, not by eye.
- **Spacing scale**: 8 · 16 · 24 · 32 · 48 · 64 · 96. Kicker → headline ~16. Headline → content 48–64. Between cards 24–30. Reuse the same values through the whole video.
- **One focus per scene**: one main thing (a headline, a number, a highlighted card). Max 3 information blocks per screen; more than that is a new scene.
- **Hierarchy**: kicker (context) → headline (message) → proof (card, number, chart). Top to bottom, left to right; don't scatter elements into corners.
- **Breathing room**: leave empty space around the focus. If it doesn't fit with room, cut content or split the scene; don't shrink the type.
- **Bottom of the screen**: in 9:16 nothing important below y 1500 (captions and buttons cover it). Nothing touching the edges in any format.
- **Optical alignment**: cards with shadows look bigger; large serif headlines have their own side bearing. Check the guide sheet and nudge 2–6 px if needed.
- The audit catches anything outside the safe area; alignment and breathing room are visual checks on `sheet.py --guides`.

## Safe areas
| Format | Size | Safe area |
|---|---|---|
| 9:16 Reels/TikTok/Shorts/Stories | 1080x1920 | x 90–930, y 250–1500 |
| 16:9 YouTube/site | 1920x1080 | x 120–1800, y 90–970 |
| 1:1 feed | 1080x1080 | x 90–990, y 90–990 |
| 4:5 feed | 1080x1350 | x 90–990, y 110–1240 |
Decorative layers (backgrounds, transition panels) may bleed; mark them with `data-bleed` so the audit skips them.

## Transitions (M.T)
Pick **3 or 4 types per video** and give each a fixed role. Repeating the same type for the same job is what makes an edit look professional.
| Transition | When |
|---|---|
| `M.wipe` (circle) | light/dark swap for impact words (default) |
| `M.T.sweep` (flat panel) | changing topic / script block |
| `M.T.stack` | sequence of same-kind items (steps, features) |
| `M.T.expandFrom` (card becomes scene) | opening the detail of a card already on screen |
| `M.T.whip` | fast rhythm between similar screens, on a strong beat |
| `M.T.shutter` / `M.T.blinds` | section break, lists; use sparingly |
| `M.T.throughWord` | open the main block from a keyword; max 1 per video |
| `M.T.blur` | closing, calm scenes |
| `M.T.zoomIn` / `M.T.zoomOut` / `M.focus` | **specific moments** (reveal the key number, enter the product screen). 1–2 per video, never back to back. Less is more |
- Transitions land on a beat/bar start and last 0.7–1 s. Between two transitions a scene holds at least 2 s for reading.
- No accent-colored lines or tapes on transitions.
- `M.focus(scene, el, t, zoom, d, fx, fy)`: fx/fy is the point inside the element that goes to the center (a card's number at fx .15).
- Don't: tilted screens that straighten up, tilted text tapes crossing the screen, 3D card flips.

## Pacing and energy
Energy comes from entrances, transitions, state changes and sound, never from rushing the reading.
- **Reading time first.** Every text holds at least 2 s after it has fully entered (+0.3 s per word beyond 6). Numbers get 2.5 s.
- **Subtle idle motion only**: a slow camera push (`M.push`, 1.02–1.03, anchored on the content edge, e.g. `'120px 50%'`) and panning dark gradients (`M.bgPan`). Elements enter, settle and stay still. No bobbing/wiggling after they land (viewers read it as nervous); `M.float` only for a lone hero object when the brand's own motion does it.
- **One beat, one change.** Split dense scenes: one number per scene, list items on successive beats, a panel changing state (`M.dissolve` → new items) instead of a new scene.
- **Emphasis words act when they land**: color flip + small pulse of the whole line (`M.pulse`, anchored left so it never covers neighbours).
- **Every number gets a companion visual that moves**: comparison bars, a month grid filling, dots spreading. A big number alone on half a screen reads as empty. Keep the unit big and next to the number (e.g. "11" + "milhões / de lugares" in 2 lines, accent color), never a small line underneath.
- **Exits are animated** (`M.tout`, `M.dissolve`, `M.winClose`, `fan.close`) right before the transition. A product object leaving should "pull" the next scene (whip/stack), not cut.
- Scenes of 3–5 s; a scene longer than 5 s needs an internal state change.

## Sound
Every visible event gets a cue; the helpers do most of it. Library (`assets/sfx`, synthesized, CC0): `whoosh` / `whoosh_soft` (transitions, entrances), `pop` (cards, pop-ups), `tick` (counters, list items, fan copies), `click` (taps), `impact` (number lands, click ripple), `notif` (messages, hearts), `key` (typing), `swish` (exits), `riser`. Keep them low and warm, never "cartoon". Mix at 0.6–0.8 under the music (finalize's last argument).

## Brand imagery (fidelity first)
- **Use the brand's own assets, never redraw them.** A CSS recreation of a product, card, mockup or illustration never matches and the client notices.
- **Ask for a clean cut-out** of the hero product (flat, front view, transparent PNG, high resolution) in the files step. It is the best input for animation. If they only have a composed image (product already fanned/stacked in 3D), you can split it into layers (front object vs the rest) and animate the layers at native resolution, but quality is limited; ask for the cut-out as soon as the first render shows it.
- Clean edges before use: crop to the object, apply a rounded mask matching its real corners (supersampled), remove fringe from the background.
- **One unit becomes many** (`M.fan`): a single card/box enters, then splits into N copies that open like a hand of cards in a slight 3D pose; they close back before the exit. Size it so it never covers the headline.
- **Device mockups**: cut the real mockup out of the site image instead of putting a screenshot inside a fake phone.
- **Illustrations from the brand's site** (often SVG): inline them, group their parts (`.blob`, items, hand, emojis/hearts) and animate the parts: background shape scales in, items pop one by one, the hand slides in and taps (click sound), small details pop at the end (notif sound). Very heavy SVGs can stay raster with small added details (hearts rising).
- Motion references from the brand's site/posts (looping panels, cards appearing) override this skill's defaults; document them in brand.json `motion_reference`.

## Closing that converts (acquisition videos)
1. **"How to start" carousel**: a title screen ("Liked it? Here's how to start"), then **one step per screen** sliding horizontally: the brand illustration large on a white card with its parts animating, "Step n of N" kicker, step title with emphasis, one-line description, progress dots. ~3 s per step.
2. **Logo + address bar**: the URL typed letter by letter (`M.type`, key sounds, blinking caret), a CTA button appears.
3. **Cursor click** (`M.click`): cursor glides to the CTA, presses it (click + ripple + impact), the bar gets a highlight ring. Hold 1.5 s on the clicked state.

## Recreating UI (dashboards, tables, charts)
Don't use a whole screenshot as a flat image when it has a chart or numbers: rebuild the component in HTML/SVG with the screenshot's numbers, in the body font, mimicking the product's colors. Then bars rise, lines draw, counters count. Cropped screenshots show the real screen (menu, overview) and fit fast scenes.

## Video clips
Short (2–3 s) clips from the brand's own videos or screen recordings, always inside cards and serving this script. The new video must not look like a re-edit of an existing one.

## Outro
Always end on the brand: `M.outro` (logo reveal + tagline/URL, 2–3 s) or, for acquisition videos, the address-bar + click ending above.

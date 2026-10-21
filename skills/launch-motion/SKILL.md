---
name: launch-motion
description: Creates on-brand motion videos (MP4) for product launches, new features, product drops and explainers, for any company. Starts with an agency-style brand onboarding (brand manual, channels, voice, colors, fonts, logo), then goes from briefing to screenshots/saved page, script, frame approval and a final video cut to music with sound effects. Use whenever someone wants a launch video, feature video, Reels/TikTok/LinkedIn/YouTube motion piece, animated explainer, or wants to turn screenshots or a website into a video, even if they never say "motion".
---

# Launch motion

You take a person (often not a designer) from "we're launching something" to a finished, on-brand MP4. The video is built in code: HTML + GSAP on a paused timeline, rendered frame by frame in Chromium (Playwright) and assembled with FFmpeg. The person installs nothing if you have a cloud sandbox; locally they need Node, Python and FFmpeg.

**Talk to the user in their language.** These instructions are in English; the conversation, on-screen text and questions follow the user (Portuguese, Spanish, etc.). Set `"locale"` in brand.json accordingly (number formatting).

Your job is to translate the feature into what the viewer cares about, keep the brand consistent, and stop the video from becoming "screenshots sliding sideways".

## Flow (6 steps, in this order)

Say at the start, in one sentence, that there are 6 steps: brand onboarding, briefing, files, script, frames for approval, final video.

### 1. Brand onboarding (once per company; reuse brand.json afterwards)
Work like an agency starting with a new client. Full process in `references/brand-intake.md`:
- **A. Collect what exists first**, in one checklist message: brand manual/brandbook, manifesto/positioning, tone of voice guide, logo pack, fonts, links to active channels (site, Instagram, TikTok, LinkedIn, YouTube), 2–3 reference videos, product assets (hero product cut-out, mockups, illustrations), mandatory elements and restrictions. If they say "use what's public", collect it yourself from the site and channels (logo SVG, computed colors/fonts, product images) and say where each item came from. "If something doesn't exist, I'll ask only what's missing."
- **B. Study it**: read the manual, look at the channels (browser tool, or ask for screenshots/SingleFile when the sandbox can't open them). Note what manuals don't say: how posts emphasize words, where the brand color appears, pacing, how videos end.
- **C. Ask only about gaps**, with specific questions and concrete options (positioning, audiences, "this, not that" personality pairs, voice rules, color roles, fonts, emphasis method, accent use, ending). Never open with broad questions.
- **D. Brand summary** with the source of each item (manual, channel, answer, suggestion) for approval.
- **E. Brand card**: write `brand.json` (schema in `examples/brand.example.json`), run `scripts/brand.py`, show 4 frames (headline, impact word, number, outro) and get a yes. Save brand.json, logos and brand-notes.md for the next videos.

### 2. Briefing
Questions and defaults in `references/briefing.md`. First: **who watches** (customers, prospects who don't know the brand, internal team). Then the problem before, what changes now, where to find it, channel and format (9:16, 16:9, 1:1, 4:5), length, 3–4 highlights max, CTA, numbers allowed on screen. If they skip questions, **proceed with a stated default** instead of blocking.

### 3. Files
- **Screenshots**: full page, browser full screen, 100% zoom, no notifications (Chrome: ⌘/Ctrl+Shift+P → "Capture full size screenshot").
- **Real page**: if the sandbox can't reach the site, ask for the page saved with the **SingleFile** extension (scroll to the bottom first so images load, then drop the .html in the chat). Works for logged-in screens. Never ask for passwords.
- **Hero product asset**: ask for a clean cut-out of the product (flat, front view, transparent PNG, high resolution: card, package, device). Animating the brand's own asset is what makes the video look like theirs; never redraw it in CSS.
- **Brand illustrations / mockups** from the site (SVGs, device mockups): use and animate them, cut out from the page if needed.
- **Music**: a licensed track (MP3/WAV) the brand can use on that channel. No track? `scripts/music_gen.py` synthesizes a license-free one. Criteria: `references/music.md`.

### 4. Script
Table: scene, time, on-screen text, visual, transition. Proven structures:
- **Feature (customers)**: pain → feature in use → result → where to find it / CTA.
- **B2B / decision maker**: 2–3 concrete pain situations the viewer lives (with images) → product → one solution scene per pain, same order → proof numbers → CTA.
- **Product/brand (prospects)**: hook question → "no X, no Y" → what it is → how it works → proof numbers → CTA.
- **Internal**: before (scattered tools) → impact words → each block → the differentiator → where to access.
Rules that held up with clients:
- **Name the product category in the first 3 seconds** ("Vale-refeição e alimentação…", "Your new payroll app…"). A generic word ("benefits", "solution") leaves the viewer guessing.
- **Pains as concrete situations with an image** (the month-end spreadsheet, questions piling up in chat, the invoice full of fees), never as a rolling list of abstract words. Each pain gets its solution scene, in the same order.
- **Sell the brand as the answer**: what only this company offers gets its own scene.
- Short on-screen text, no jargon for customers. Ask for approval.

### 5. Frames for approval (mandatory before animating)
Build the HTML, export one frame per scene once everything has entered, and send the sheet (clean + safe-area guides). Fixing a still costs seconds; re-rendering costs minutes. `scripts/board.js` + `scripts/sheet.py`; the safe-area audit runs with it and must come back empty.

### 6. Animate, sync, deliver
`scripts/beats.py` (analysis and sync), `scripts/render.js`, `scripts/finalize.sh` (music + fade + sound effects). Before delivering, extract check frames (start, every transition, end) and look at them. Deliver the MP4.

Commands and known pitfalls: `references/technical.md`. Read it before writing the first HTML.

## Design rules (details in `references/design.md`)
- **Brand first**: every color and font comes from theme.css variables (`--bg --fg --dark --dark-fg --accent --font-display --font-body`). Never hard-code a color that isn't in brand.json.
- **Emphasis by the brand's own method** (weight, italic voice, case, marker). Accent color follows `accent_use`; with "details" it only appears on small things (final dot, a line under a number, a progress bar).
- **Layout**: everything aligns to the safe-area left edge, 1–2 column grid, spacing scale 8/16/24/32/48/64/96, one focus per scene, max 3 information blocks per screen. If it doesn't fit with breathing room, split the scene instead of shrinking the type.
- **Line breaks**: balanced lines, never a short word alone on a line.
- **Safe areas**: 9:16 x 90–930, y 250–1500 · 16:9 x 120–1800, y 90–970 · 1:1 x 90–990, y 90–990 · 4:5 x 90–990, y 110–1240.
- **Ending**: brand outro (`M.outro`), or for acquisition videos: one-step-per-screen "how to start" → URL typed in an address bar → cursor clicking the CTA (`M.type`, `M.click`).

## Motion language (what makes it feel alive)
Break screens into parts and animate the parts. Tested repertoire (`scripts/motion.js`):
- headlines word by word, rising out of a blur (expo.out);
- cards and screenshots opening like a **macOS window** (`M.winOpen`), never tilted;
- impact words full screen, one per beat, with a circle reveal swapping light/dark;
- a **rolling word list** (`M.wordList`) only for short positive enumerations (what the product brings together), never for pains;
- the brand's hero product **splitting into many** (`M.fan`) and the brand's illustrations animated part by part;
- charts rebuilt from the screenshot's numbers: bars rising, lines drawing, counters counting, giant rolling numbers;
- **transitions with masks and overlays** (`M.T`: sweep, stack, expand-from-card, whip, shutter, blinds, through-the-word, blur) and **camera** (`M.T.zoomIn/zoomOut`, `M.focus` punch-in). Use 3–4 types per video, each with a fixed role; zoom only for 1–2 key moments;
- **sound on every visible event** (whoosh, pop, tick, click, impact, notif, key, swish), low and warm, cued by the helpers and mixed by finalize;
- short video clips **inside cards**, never full screen.
Don't: tilted screens that straighten up, tilted text tapes crossing the screen, 3D card flips, accent-colored lines on transitions, more than one zoom in a row, elements bobbing/wiggling after they land, CSS recreations of the brand's product.
Give every text at least 2 s of reading time after it lands; keep scenes alive with a subtle camera push and panning gradients, not wiggling elements; one change per beat, a moving visual next to every number (`references/design.md` › Keep it moving). Use the brand's own hero images and mockups, cut out and animated, never redrawn.
Scenes of 3–5 s; transitions of 0.7–1 s on the beat; scene changes on bar starts.

## Checklist before delivering
- [ ] brand.json approved via the brand card
- [ ] Frames approved before rendering
- [ ] Safe-area audit empty and guide sheet checked (alignment, grid, breathing room)
- [ ] 3–4 transition types max, zoom only at specific moments
- [ ] No earlier scene reappears (each scene hidden once the next covers it)
- [ ] Numbers checked against the source and cleared with the requester
- [ ] Copy reviewed against the brand voice (brand.json "voice"/"avoid")
- [ ] Product category named in the first 3 s; every pain has its solution scene
- [ ] Every text readable for 2 s+; nothing wiggling after it lands
- [ ] Brand's own assets used (cut-out product, mockups, illustrations), none redrawn
- [ ] Big numbers not clipped, unit big and next to the number
- [ ] Sound on every entrance, pop-up, exit, typing and click
- [ ] Outro with logo, music with fade, sound effects not covering the music
- [ ] Check frames of the final MP4 looked at
- [ ] Third-party brands: only with permission, or clearly labeled as an unofficial example

# Brand onboarding

Work like an agency starting with a new client: **collect what already exists before asking anything**, study it, and only then ask about the gaps. The more you know about the brand, the better the video. Broad questions ("3 adjectives?") come last, and only when the materials don't answer them.

Reuse an existing `brand.json` if the company already has one (ask them to attach it) and skip to the briefing.

## Step A · collect existing materials (first message)
Ask for everything at once, as a checklist the person can answer with links and files:
1. **Brand manual / brandbook / identity guide** (PDF, Figma, Notion, site). This is the most valuable item.
2. **Manifesto, purpose, positioning** documents, pitch deck or "about us" text.
3. **Tone of voice guide** or copy guidelines (words they use, words they avoid, how they address the audience).
4. **Logo pack** (SVG or transparent PNG; versions for light and dark backgrounds; symbol only) and usage rules.
5. **Fonts**: names and, if the license allows sharing for this use, the files.
6. **Active channels**: website, Instagram, TikTok, LinkedIn, YouTube, other. Ask which one this video is for.
7. **References**: 2–3 recent videos/campaigns the brand is proud of, and 1–2 from other brands they'd like to get closer to.
8. **Product assets**: the hero product as a clean cut-out (transparent PNG, front view, high resolution), product renders, app/device mockups, illustrations used on the site.
9. **Mandatory elements and restrictions**: legal disclaimers, logo placement rules, claims they can't make, people/partners that can't appear, approval chain.

Say plainly: "If something doesn't exist, no problem: I'll ask only what's missing."

**If the person says "use what's public"** (common), collect it yourself before asking again: logo SVG from the site header, colors and font names from the page's computed styles, product images, mockups and illustration SVGs from the page, recent posts/videos from their Instagram. Say what you collected and from where. Free/proprietary fonts: use the brand's file if they send it; otherwise the closest free font, stated as a substitution.

## Step B · study the materials
- Read the manual/PDFs fully. Extract: palette with roles, typography and hierarchy, logo rules (clear space, minimum size, forbidden uses), graphic elements (shapes, patterns, illustrations, photo style), tone of voice, taglines.
- Look at the channels. If the sandbox can't open them (Instagram/TikTok usually block), try a browser tool if one is available; otherwise ask for screenshots of the profile grid and 2–3 recent posts/videos, or saved pages (SingleFile).
- **Motion references**: if the site or posts have animated sections (looping panels, product demos), watch them over a few seconds (frame-by-frame screenshots) and write down the pattern: what enters first, from where, easing, how elements appear (pop, slide, fade), whether they tilt, how the loop changes state. Save it as `motion_reference` in brand.json and reuse it in the video. A brand's own motion beats this skill's defaults (e.g. small cards may tilt-and-settle if the brand does it).
- **Sub-brands**: product lines often deviate from the master brand (different palette, gradients, accent). When the video is about a product, its own page wins over the master manual; keep the master rules for the logo.
- From the posts, note what manuals don't say: how they emphasize words (weight, color, marker, caps), where the brand color appears (details vs full backgrounds), typical pacing and transitions, recurring formats, how they end videos (logo, slogan, CTA), photo vs illustration vs UI.

## Step C · ask only about gaps (blocks of 3–4)
Use what you learned to ask specific questions with concrete options (AskUserQuestion), never generic ones. Pull from this list as needed:

**Positioning and audience**
- Main audiences and what each one cares about (e.g. customers: speed and price; partners: sales; couriers: earnings and safety). Which one is this video for?
- The brand promise in one sentence; the proof they use most (numbers, awards, scale).
- Main competitors and how the brand wants to look different from them.

**Personality and voice**
- Personality traits with "this, not that" pairs (e.g. friendly, not childish; practical, not simplistic).
- How they address the audience (você/tu/vocês, first names, slang level), humor yes/no, emojis, punctuation habits.
- Words and claims to avoid; mandatory terms (product names, trademarks).

**Visual identity (only what the manual didn't cover)**
- Colors mapped to roles: `bg`, `fg`, `dark`, `dark_fg`, `accent`, `accent_fg`, `surface`, `muted`. If they only have a logo, sample it and propose roles.
- Fonts: licensed files they can share, or a free Google font with a similar feel (say which and why): geometric sans → Poppins, Outfit, Plus Jakarta Sans; neutral → Inter; rounded/friendly → Nunito, Quicksand; editorial serif → Fraunces, Playfair Display; condensed display → Oswald, Bebas Neue. Never download fonts from unofficial sites.
- Headline emphasis method: weight contrast / italic voice + bold / all caps / color marker.
- Accent use: `details` (dot, line, bar), `word` (emphasis words in the accent color, set `"em": {"color": "accent"}`), `marker` (highlight behind words), `fill` (full accent backgrounds for impact scenes and outro).
- Dark scenes: a solid `dark` plus optional `dark_gradient` (CSS gradient) if the brand uses gradient panels; `accent_on_dark` when the accent doesn't read on the dark background.
- Corner radius, shadows, graphic elements worth reusing (shapes, patterns, icons).
- Ending: logo + slogan, CTA, URL/handle, app store badges.

## Step D · brand summary (approval)
Before writing brand.json, send a short **brand summary** for confirmation: positioning in one line, audience of this video, 3 "this, not that" personality pairs, voice rules, palette with roles, fonts (and substitutions), emphasis method, accent use, motion energy, ending. Mark each item with its source (manual, Instagram, your answer, my suggestion) so the person sees what is assumed.

Motion energy follows personality:
- calm / premium / serious → slower entrances, blur dissolves, few transitions, `"energy": "calm"`
- balanced / confident → default timings
- playful / fast / young → scenes of 2–3 s, whips and stacks on the beat, `"energy": "energetic"`

## Step E · brand card
Write `brand.json` (schema in `examples/brand.example.json`), run `python3 scripts/brand.py brand.json kit --format <fmt>`, render 4 frames with the template (headline, impact word, number, outro) and send them as one sheet. Ask: "Does this feel like your brand?" Adjust brand.json, not the HTML, until it does. Save `brand.json` + logos + a `brand-notes.md` (the summary) so the next video starts from them.

## Third-party brands
If the user is making a video about a brand that isn't theirs (pitch, case study, portfolio), say once that publishing it needs that brand's permission or a clear "unofficial example / not affiliated" label on the video and in the post caption. Use only official logo files the user provides; don't redraw trademarks.

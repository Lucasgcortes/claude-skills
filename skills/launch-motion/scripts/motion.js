/* motion.js — animation helpers for the launch-motion skill.
   Load AFTER gsap.min.js and theme.css. Exposes window.M plus window.seek / window.audit.
   Everything is deterministic: the timeline is paused and the renderer calls seek(t) frame by frame.
   Brand colors and fonts come from CSS variables written by brand.py (theme.css):
   --bg --fg --dark --dark-fg --accent --surface --font-display --font-body --w-em --w-base */
(function () {
  const M = {};
  M.tl = gsap.timeline({ paused: true });
  const tl = M.tl;
  M.locale = document.documentElement.lang || 'en-US';
  M.fmt = (v, d) => v.toLocaleString(M.locale, { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- DOM preparation ---------- */
  // Splits text into animatable words (.w). Run after building the HTML.
  // Headline spans: .base (regular voice) and .em (emphasis). .b/.i kept for compatibility.
  M.splitWords = (sel = '.title .em,.title .base,.cap .em,.cap .base,.title .b,.title .i') => {
    document.querySelectorAll(sel).forEach(e => {
      const parts = e.textContent.split(/(\s+)/); e.textContent = '';
      parts.forEach(p => { if (/^\s+$/.test(p) || p === '') { e.append(p); return; }
        const s = document.createElement('span'); s.className = 'w'; s.textContent = p; e.append(s); });
    });
  };
  // Impact word: <div class="wd">Text<span class="dot">.</span></div> → letters .lt
  M.splitLetters = (sel = '.punch .wd') => {
    document.querySelectorAll(sel).forEach(w => {
      const t = w.firstChild.textContent; w.firstChild.remove();
      [...t].reverse().forEach(c => { const s = document.createElement('span'); s.className = 'lt'; s.innerHTML = c === ' ' ? '&nbsp;' : c; w.prepend(s); });
    });
  };
  // Giant rolling number: <div class="gnum" data-n="$1,277" data-u="months" data-h="150"></div>
  M.buildRoll = (sel = '.gnum') => {
    document.querySelectorAll(sel).forEach(n => {
      const h = +(n.dataset.h || 150);
      [...n.dataset.n].forEach(c => {
        if (/\d/.test(c)) {
          const col = document.createElement('span'); col.className = 'col'; col.style.cssText = `display:inline-block;height:${h}px;overflow:hidden`;
          const st = document.createElement('span'); st.className = 'strip'; st.style.display = 'block';
          for (let k = 0; k < 20; k++) { const d = document.createElement('span'); d.textContent = k % 10; d.style.cssText = `display:block;height:${h}px;text-align:center`; st.appendChild(d); }
          col.dataset.d = c; col.dataset.h = h; col.appendChild(st); n.appendChild(col);
        } else { const s = document.createElement('span'); s.className = 'st'; s.style.display = 'inline-block'; s.innerHTML = c === ' ' ? '&nbsp;' : c; n.appendChild(s); }
      });
      if (n.dataset.u) { const u = document.createElement('span'); u.className = 'unit st'; u.style.display = 'inline-block'; u.textContent = n.dataset.u; n.appendChild(u); }
    });
  };
  // Sparkline: <svg width=330 height=110><path class="ar"/><path class="ln2" data-pts="1,2,3"/></svg>
  M.buildSparks = (sel = 'svg') => {
    document.querySelectorAll(sel).forEach(s => {
      const ln = s.querySelector('.ln2'); if (!ln) return;
      const p = ln.dataset.pts.split(',').map(Number), W = +s.getAttribute('width'), H = +s.getAttribute('height');
      const mx = Math.max(...p), mn = Math.min(...p) * 0.8;
      const pts = p.map((v, i) => [i * W / (p.length - 1), H - (v - mn) / (mx - mn) * H * 0.9]);
      const d = 'M' + pts.map(q => q.join(',')).join(' L'); ln.setAttribute('d', d);
      const ar = s.querySelector('.ar'); if (ar) ar.setAttribute('d', d + ` L${W},${H} L0,${H} Z`);
    });
  };
  // SVG helper
  M.svg = (tag, attrs, parent, txt) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; parent && parent.appendChild(e); return e; };

  /* ---------- sound effects ----------
     Every helper cues its sound at the right time. render.js writes the cues (body.sfx.json)
     and finalize.sh mixes them under the music. Sounds in assets/sfx:
     whoosh, whoosh_soft, click, pop, tick, impact, riser, notif, key, swish. Manual cue: M.sfx('pop', 3.2, .8) */
  M.SFX = []; window.SFX = M.SFX; M.sound = true;
  M.sfx = (name, t, gain = 1) => { if (M.sound) M.SFX.push({ name, t: +t.toFixed(3), gain }); };

  /* ---------- animations ----------
     Principles: entrances use expo.out (fast start, slow settle), exits are short power2.in,
     nothing enters tilted to "straighten up" later, transitions overlap slightly instead of hard cuts. */
  M.W = s => gsap.utils.toArray(s + ' .w');
  M.IN = { y: 56, rotation: () => gsap.utils.random(-3, 3), opacity: 0, filter: 'blur(6px)', duration: .9, ease: 'expo.out', stagger: .065 };
  M.OUT = { y: -36, opacity: 0, filter: 'blur(6px)', duration: .45, ease: 'power2.in', stagger: .02 };
  M.title = (s, t) => { M.sfx('whoosh_soft', t, .45); return tl.from(M.W(s), M.IN, t); };
  M.tout = (s, t) => { M.sfx('swish', t, .35); return tl.to(M.W(s), M.OUT, t); };
  // Window opening (macOS style): grows from a point, no tilt. origin = where it comes from.
  M.winOpen = (s, t, stag = .12, origin = '50% 100%') => {
    const els = gsap.utils.toArray(s); els.forEach((e, i) => M.sfx('pop', t + i * stag + .05, .5));
    M.sfx('whoosh_soft', t, .6);
    return tl.from(els, { scale: .38, y: 70, opacity: 0, filter: 'blur(10px)', transformOrigin: origin, duration: .95, ease: 'expo.out', stagger: stag }, t);
  };
  M.winClose = (s, t, origin = '50% 100%') => tl.to(s, { scale: .9, y: 24, opacity: 0, filter: 'blur(6px)', transformOrigin: origin, duration: .42, ease: 'power2.in', stagger: .03 }, t);
  // Pop-in for small floating UI pieces (badges, glass cards). rot > 0 adds a small random tilt that settles to 0:
  // use it only when the brand's own motion reference does this; default is no tilt.
  M.popIn = (s, t, stag = .14, rot = 0, origin = '50% 50%') => { const els = gsap.utils.toArray(s);
    els.forEach((e, i) => M.sfx('pop', t + i * stag + .05, .4));
    return tl.from(els, { scale: .6, y: 30, opacity: 0, rotation: rot ? () => gsap.utils.random(-rot, rot) : 0, filter: 'blur(8px)', transformOrigin: origin, duration: .8, ease: 'back.out(1.4)', stagger: stag }, t); };
  // Device/panel slide-in from a side (phone mockups, dashboards). dir: right|left|bottom
  M.slideIn = (s, t, dir = 'right', dist = 260, d = 1.1) => { M.sfx('whoosh_soft', t, .55);
    const v = { right: { x: dist }, left: { x: -dist }, bottom: { y: dist } }[dir];
    return tl.from(s, { ...v, opacity: 0, duration: d, ease: 'expo.out' }, t); };
  // Dissolve a group out (scale down slightly + blur), for looping "state changes" inside a panel
  M.dissolve = (s, t, d = .5) => (M.sfx('swish', t, .4), tl.to(s, { opacity: 0, scale: .94, filter: 'blur(8px)', duration: d, ease: 'power2.in', stagger: .04 }, t));
  /* ---------- idle motion: nothing sits still ----------
     After elements enter, keep them alive until the scene leaves: slow camera push, floating pieces,
     panning gradients. Static holds longer than ~1 s read as "frozen" in a launch video. */
  // Floating: gentle sine bob (y + tiny rotation), each element out of phase. Runs from t for dur seconds.
  M.float = (s, t, dur = 4, amp = 10, period = 2.4) => gsap.utils.toArray(s).forEach((e, i) => {
    const reps = Math.max(1, Math.round(dur / period * 2)) - 1;
    tl.to(e, { y: `+=${amp * (i % 2 ? -1 : 1)}`, rotation: `+=${i % 2 ? -.6 : .6}`, duration: period / 2, ease: 'sine.inOut', yoyo: true, repeat: reps }, t + (i % 3) * .18); });
  // Camera push: the whole scene scales slowly (default 1 → 1.05) while it is on screen
  // origin: anchor the push on the content's edge (e.g. '120px 50%' for left-aligned layouts) so nothing leaves the safe area.
  // Skip it on layouts that already touch both sides of the safe area; float the pieces instead.
  M.push = (scene, t, dur = 4, to = 1.04, origin = '50% 50%') => tl.fromTo(scene, { scale: 1, transformOrigin: origin }, { scale: to, duration: dur, ease: 'none', immediateRender: false }, t);
  // Gradient pan for .dark scenes (needs background-size > 100%, see .pan in theme)
  M.bgPan = (sel, t, dur = 4) => tl.fromTo(sel, { backgroundPosition: '0% 0%' }, { backgroundPosition: '100% 100%', duration: dur, ease: 'sine.inOut', immediateRender: false }, t);
  // Punch on an emphasis word: quick scale bump on the beat
  // Pulse the whole line (.ln) that holds the word, anchored left, so neighbours never get covered.
  M.pulse = (sel, t, k = 1.05, origin = '0% 60%') => { M.sfx('pop', t, .35); const e = document.querySelector(sel), tgt = (e && e.closest('.ln')) || sel;
    tl.to(tgt, { scale: k, duration: .16, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: origin }, t); };
  // Slow camera drift so a scene never sits dead still (no rotation)
  M.drift = (s, t, dur = 4, dist = 18) => tl.fromTo(s, { y: 0, scale: 1 }, { y: -dist, scale: 1.02, duration: dur, ease: 'sine.inOut' }, t);
  M.kick = (s, t) => (M.sfx('tick', t + .05, .35), tl.from(s, { opacity: 0, letterSpacing: '0.6em', duration: .9, ease: 'expo.out' }, t));
  // counters: .cnt elements with data-to, data-dec, data-pre, data-suf inside scope
  M.count = (scope, t, dur = 1.4, stag = .12) => document.querySelectorAll(scope + ' .cnt').forEach((e, i) => {
    const o = { v: 0 }, to = +e.dataset.to, d = +(e.dataset.dec || 0), pre = e.dataset.pre || '', suf = e.dataset.suf || '';
    e.textContent = pre + M.fmt(to, d) + suf;
    for (let k = 0; k < 5; k++) M.sfx('tick', t + i * stag + k * dur / 7, .5 - k * .07);
    tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => e.textContent = pre + M.fmt(o.v, d) + suf }, t + i * stag);
  });
  M.draw = (s, t, dur = 1.2) => { M.sfx('whoosh_soft', t, .35); document.querySelectorAll(s).forEach(p => { const L = p.getTotalLength(); tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t); }); };
  M.bars = (s, t, stag = .06) => { const n = document.querySelectorAll(s).length; for (let k = 0; k < Math.min(n, 12); k += 2) M.sfx('tick', t + k * stag, .35);
    return tl.from(s, { scaleY: 0, transformOrigin: '50% 100%', duration: .7, ease: 'expo.out', stagger: stag }, t); };
  // circle reveal (layer whose initial clip-path is circle(0))
  M.wipe = (s, t, x, y, d = .75) => { const W0 = innerWidth, H0 = innerHeight; x = x ?? W0 / 2; y = y ?? H0 / 2; M.sfx('whoosh', t, .8);
    tl.fromTo(s, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(W0, H0)}px at ${x}px ${y}px)`, duration: d, ease: 'expo.inOut' }, t); };
  M.wipeOut = (s, t, x, y, d = .7) => { x = x ?? innerWidth / 2; y = y ?? innerHeight / 2; M.sfx('whoosh', t, .7); tl.to(s, { clipPath: `circle(0px at ${x}px ${y}px)`, duration: d, ease: 'expo.inOut' }, t); };
  // soft scene change without a circle: the new one rises slightly with a fade
  M.fadeUp = (s, t, d = .7) => { M.sfx('whoosh_soft', t, .5); tl.fromTo(s, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: d, ease: 'expo.out' }, t); };
  // ALWAYS hide the previous scene once the next one covers the screen (or it shows through fades)
  M.hide = (s, t) => tl.set(s, { autoAlpha: 0 }, t);
  M.letters = (s, t) => { M.sfx('click', t + .05, .6); M.sfx('pop', t + .35, .5);
    return tl.from(s + ' .lt', { opacity: 0, filter: 'blur(10px)', x: () => gsap.utils.random(-18, 18), y: 20, duration: .6, ease: 'expo.out', stagger: .024 }, t)
    .from(s + ' .dot', { scale: 0, transformOrigin: '50% 80%', duration: .5, ease: 'back.out(2.2)' }, t + .3)
    .fromTo(s + ' .wd', { scale: 1.04 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, t); };
  M.roll = (s, t) => {
    tl.from(s + ' .col', { opacity: 0, duration: .15 }, t); // never show "000" before rolling
    const cols = gsap.utils.toArray(s + ' .col');
    // each column takes the width of its final digit (proportional fonts would leave gaps after a "1")
    cols.forEach(c => tl.set(c, { width: () => { const m = document.createElement('span'); m.textContent = c.dataset.d;
      m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; c.parentNode.appendChild(m); const w = m.offsetWidth; m.remove(); return w; } }, t));
    cols.forEach((c, i) => { M.sfx('tick', t + .1 + i * .09, .45);
      tl.fromTo(c.querySelector('.strip'), { y: 0, filter: 'blur(6px)' }, { y: -(10 + +c.dataset.d) * +c.dataset.h, filter: 'blur(0px)', duration: 1.1 + i * .12, ease: 'expo.out' }, t); });
    M.sfx('impact', t + .55 + cols.length * .06, .45);
    tl.from(s + ' .st', { opacity: 0, y: 30, duration: .7, ease: 'expo.out', stagger: .06 }, t + .1);
  };
  /* Rolling word list: one word at a time on the reading line, neighbours dimmed above and below.
     Clean read, one word per beat.
     HTML: <div class="wlist" id="list"><div class="track"><div class="wi">Payments</div>...</div></div>
     CSS in theme.css (.wlist ~3 lines tall with a gradient mask). step = seconds per word. */
  M.wordList = (s, t, step = .45) => {
    const track = document.querySelector(s + ' .track'), items = gsap.utils.toArray(s + ' .wi'), h = items[0].offsetHeight;
    gsap.set(items, { opacity: .16 }); gsap.set(track, { y: h });
    tl.from(s, { opacity: 0, duration: .4 }, t);
    items.forEach((it, i) => { const ti = t + .15 + i * step; M.sfx('tick', ti, .6);
      tl.to(track, { y: h - i * h, duration: step * .85, ease: 'expo.out' }, ti)
        .to(it, { opacity: 1, duration: step * .4, ease: 'power2.out' }, ti);
      if (i < items.length - 1) tl.to(it, { opacity: .16, duration: step * .4, ease: 'power2.in' }, ti + step); });
    return t + .15 + items.length * step;
  };

  // Marker highlight behind a word (for brands that highlight with color). <span class="mk">word</span>
  // h = marker height ('40%' underline marker, '100%' full box). Colors via --mk (default --accent).
  M.marker = (s, t, h = '42%', d = .6) => { M.sfx('click', t, .4);
    tl.fromTo(s, { backgroundSize: `0% ${h}` }, { backgroundSize: `100% ${h}`, duration: d, ease: 'expo.inOut', stagger: .1 }, t); };
  // Outro: logo reveal + optional tagline/URL. <div class="sc outro" id="end"><img class="logo"><div class="tag">..</div></div>
  M.outro = (s, t) => { M.sfx('whoosh_soft', t, .6); M.sfx('impact', t + .35, .5);
    tl.fromTo(s + ' .logo', { scale: .7, opacity: 0, filter: 'blur(14px)', clipPath: 'inset(0 50% 0 50%)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0% 0 0%)', duration: 1.1, ease: 'expo.out' }, t)
      .from(s + ' .tag', { y: 24, opacity: 0, filter: 'blur(6px)', duration: .8, ease: 'expo.out', stagger: .12 }, t + .55); };

  /* ---------- patterns validated in client work ---------- */
  // Fan: one product unit (a clean, flat cut-out PNG of the brand's own asset) splits into n copies
  // that open like a hand of cards. el = empty container sized like the unit. Returns {close(t)}.
  // opts: n, step (deg between copies), shrink (scale loss per copy), tilt {x,y,z} 3D pose, origin (pivot)
  M.fan = (el, src, t, o = {}) => { const n = o.n || 10, step = o.step ?? 7, shrink = o.shrink ?? .03, tilt = o.tilt || { x: 6, y: -22, z: 4 },
      origin = o.origin || '-30% 110%', radius = o.radius || 24, edge = o.edge || '#F6E9E2', box = document.querySelector(el), cs = [];
    for (let i = n - 1; i >= 0; i--) { const c = document.createElement('div');
      c.style.cssText = `position:absolute;inset:0;background:url(${src}) 0 0/100% 100%;border-radius:${radius}px;box-shadow:0 0 0 3px ${edge},-10px 14px 30px rgba(0,0,0,.28);transform-origin:${origin}`;
      box.appendChild(c); cs[i] = c; gsap.set(c, { transformPerspective: 1400, rotationX: tilt.x, rotationY: tilt.y, rotation: tilt.z }); }
    tl.fromTo(box, { x: 180, y: 40, scale: .85, opacity: 0, filter: 'blur(14px)' }, { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'expo.out' }, t);
    M.sfx('whoosh', t, .8); M.sfx('pop', t + .3, .6); M.sfx('whoosh_soft', t + .8, .6);
    cs.forEach((c, i) => { if (!i) return; const ti = t + .8 + i * .06; M.sfx('tick', ti, Math.max(.15, .45 - i * .02));
      tl.to(c, { rotation: tilt.z - i * step, scale: 1 - i * shrink, duration: 1.3, ease: 'expo.out' }, ti); });
    return { close: tc => { M.sfx('swish', tc, .6); cs.forEach((c, i) => { if (i) tl.to(c, { rotation: tilt.z, scale: 1, duration: .55, ease: 'power3.in' }, tc + (n - i) * .02); }); } }; };
  // Typing: types `text` into el (letter by letter, key sound), with optional blinking caret element
  M.type = (el, text, t, cps = 15, caret = null) => { const e = document.querySelector(el);
    e.innerHTML = [...text].map(ch => `<span style="display:none">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    [...e.children].forEach((c, k) => { tl.set(c, { display: 'inline' }, t + k / cps); M.sfx('key', t + k / cps, .22); });
    if (caret) for (let k = 0; k < Math.ceil((text.length / cps + 1.5) * 2); k++) tl.set(caret, { opacity: k % 2 ? 1 : 0 }, t - .4 + k * .5);
    return t + text.length / cps; };
  // Cursor click: moves a cursor element onto target (fx,fy inside it), presses it, ripple optional
  M.click = (cursor, target, t, o = {}) => { const r = M.rect(target), c = M.rect(cursor), fx = o.fx ?? .5, fy = o.fy ?? .5,
      dx = r.left + r.width * fx - c.left, dy = r.top + r.height * fy - c.top;
    tl.fromTo(cursor, { x: 0, y: 0, opacity: 0 }, { x: dx, y: dy, opacity: 1, duration: .9, ease: 'power3.inOut' }, t); M.sfx('whoosh_soft', t, .35);
    tl.to(cursor, { scale: .82, duration: .08, yoyo: true, repeat: 1, transformOrigin: '10% 10%' }, t + 1); M.sfx('click', t + 1, .9);
    tl.to(target, { scale: .93, duration: .08, yoyo: true, repeat: 1 }, t + 1);
    if (o.ripple) { gsap.set(o.ripple, { left: r.left + r.width * fx - 28, top: r.top + r.height * fy - 28 });
      tl.fromTo(o.ripple, { opacity: .9, scale: .4 }, { opacity: 0, scale: 3.2, duration: .7, ease: 'expo.out', immediateRender: false }, t + 1.02); M.sfx('impact', t + 1.02, .35); }
    return t + 1.1; };

  /* ---------- SCENE TRANSITIONS ----------
     Each takes the outgoing scene (from) and the incoming one (to) and handles z-index, show/hide and sound.
     The incoming scene must start hidden (autoAlpha 0) or with .wipe. Use 3–4 types per video and give each
     a fixed role. zoomIn / zoomOut / focus are for specific moments (1–2 per video): less is more.
     See references/design.md › Transitions. */
  M.z = 10;
  const VW = () => innerWidth, VH = () => innerHeight;
  const bring = (to, t) => tl.set(to, { zIndex: ++M.z, autoAlpha: 1, clipPath: 'none' }, t);
  const overlay = (bg, z = 9000) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;inset:0;background:${bg};z-index:${z};pointer-events:none;visibility:hidden`; document.getElementById('stage').appendChild(d); return d; };
  // element position on stage ignoring transforms (other tweens may already have applied some)
  const rect = el => { let e = typeof el === 'string' ? document.querySelector(el) : el, x = 0, y = 0;
    if (e.offsetWidth === undefined) { const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height }; } // SVG elements
    const w = e.offsetWidth, h = e.offsetHeight;
    while (e && e.id !== 'stage') { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { left: x, top: y, right: x + w, bottom: y + h, width: w, height: h }; };
  M.rect = rect;
  const bg = s => getComputedStyle(document.querySelector(s)).backgroundColor;
  // brand colors by token name ('dark', 'bg', 'fg', 'accent', 'surface', 'dark-fg') or any CSS color
  const css = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
  const col = c => (c && css(c)) || c;
  M.T = {
    // Zoom in: current scene grows and blurs "through the camera", the new one arrives from behind
    zoomIn(from, to, t, d = .8, origin = '50% 50%') { M.sfx('whoosh', t, .8);
      // cut at peak blur (no crossfade: mixing the two scenes looks muddy)
      tl.fromTo(from, { filter: 'blur(0px)' }, { immediateRender: false, scale: 2.4, filter: 'blur(16px)', transformOrigin: origin, duration: d * .5, ease: 'expo.in' }, t);
      tl.set('#stage', { backgroundColor: bg(to) }, t + d * .5); // stage takes the next scene's color (no empty border)
      bring(to, t + d * .5); tl.set(from, { autoAlpha: 0 }, t + d * .5)
        .fromTo(to, { scale: .8, filter: 'blur(16px)' }, { scale: 1, filter: 'blur(0px)', duration: d, ease: 'expo.out' }, t + d * .5)
        .set(from, { scale: 1, filter: 'none' }, t + d * .5 + .05); },
    // Zoom out: current scene shrinks away, the new one comes from close (large) and settles
    zoomOut(from, to, t, d = .8) { M.sfx('whoosh', t, .8);
      tl.set('#stage', { backgroundColor: bg(to) }, t);
      tl.fromTo(from, { filter: 'blur(0px)' }, { immediateRender: false, scale: .5, filter: 'blur(14px)', duration: d * .5, ease: 'expo.in' }, t);
      bring(to, t + d * .5); tl.set(from, { autoAlpha: 0 }, t + d * .5)
        .fromTo(to, { scale: 1.8, filter: 'blur(16px)' }, { scale: 1, filter: 'blur(0px)', duration: d, ease: 'expo.out' }, t + d * .5)
        .set(from, { scale: 1, filter: 'none' }, t + d * .5 + .05); },
    // Whip pan: lateral push with motion blur
    whip(from, to, t, dir = 'left', d = .7) { M.sfx('whoosh', t, .9); const sx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, sy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      tl.fromTo(from, { filter: 'blur(0px)' }, { immediateRender: false, x: sx * VW() * .9, y: sy * VH() * .9, filter: 'blur(18px)', duration: d * .5, ease: 'expo.in' }, t);
      bring(to, t + d * .38); tl.fromTo(to, { x: -sx * VW() * .9, y: -sy * VH() * .9, filter: 'blur(18px)' }, { x: 0, y: 0, filter: 'blur(0px)', duration: d * .75, ease: 'expo.out' }, t + d * .38);
      tl.set(from, { autoAlpha: 0, x: 0, y: 0, filter: 'none' }, t + d * .6); },
    // Stack: the new scene slides up like a card; the previous one recedes and darkens (depth)
    stack(from, to, t, d = .9) { M.sfx('whoosh_soft', t, .7); M.sfx('pop', t + d * .55, .5);
      bring(to, t); tl.fromTo(to, { y: VH(), borderRadius: 48, boxShadow: '0 -30px 80px rgba(0,0,0,.35)' }, { y: 0, borderRadius: 0, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: d, ease: 'expo.inOut' }, t)
        .fromTo(from, { filter: 'brightness(1)' }, { scale: .9, filter: 'brightness(.55)', duration: d, ease: 'expo.inOut', immediateRender: false }, t)
        .set(from, { autoAlpha: 0, scale: 1, filter: 'none' }, t + d); },
    // Color sweep: a flat brand panel crosses the screen and swaps the scene behind it (dir: left|up)
    sweep(from, to, t, color = 'dark', dir = 'left', d = .9) { M.sfx('whoosh', t, .8);
      const p = overlay(col(color), 9001), k = dir === 'up' ? 'yPercent' : 'xPercent';
      tl.set(p, { visibility: 'visible', [k]: 101 }, t).to(p, { [k]: 0, duration: d * .45, ease: 'expo.in' }, t);
      bring(to, t + d * .47); tl.set(from, { autoAlpha: 0 }, t + d * .47)
        .to(p, { [k]: -101, duration: d * .5, ease: 'expo.out' }, t + d * .5).set(p, { visibility: 'hidden' }, t + d + .1); },
    // Blinds: N bars cover in cascade and uncover (lists, sequences)
    blinds(from, to, t, n = 6, color = 'dark', d = 1.0) { M.sfx('whoosh_soft', t, .7);
      const bars = []; for (let i = 0; i < n; i++) { const o = overlay(col(color)); o.style.inset = 'auto'; o.style.left = 0; o.style.width = '100%'; o.style.top = (i * 100 / n) + '%'; o.style.height = (100 / n + .2) + '%'; o.style.transformOrigin = '0 50%'; bars.push(o); }
      tl.set(bars, { visibility: 'visible', scaleX: 0 }, t).to(bars, { scaleX: 1, duration: d * .4, ease: 'expo.in', stagger: .035 }, t);
      bring(to, t + d * .55); tl.set(from, { autoAlpha: 0 }, t + d * .55).set(bars, { transformOrigin: '100% 50%' }, t + d * .55)
        .to(bars, { scaleX: 0, duration: d * .45, ease: 'expo.out', stagger: .035 }, t + d * .55).set(bars, { visibility: 'hidden' }, t + d + .4); },
    // Shutter: two doors close at the center and open on the new scene (axis 'h' top/bottom, 'v' sides)
    shutter(from, to, t, axis = 'h', color = 'dark', d = .9) { M.sfx('whoosh', t, .7); M.sfx('impact', t + d * .45, .35);
      const p1 = overlay(col(color)), p2 = overlay(col(color)); const v = axis === 'v';
      [p1, p2].forEach((p, i) => { p.style.inset = 'auto'; Object.assign(p.style, v ? { top: 0, height: '100%', width: '50.2%', [i ? 'right' : 'left']: 0 } : { left: 0, width: '100%', height: '50.2%', [i ? 'bottom' : 'top']: 0 }); });
      const k = v ? 'xPercent' : 'yPercent';
      tl.set([p1, p2], { visibility: 'visible' }, t).fromTo(p1, { [k]: -100 }, { [k]: 0, duration: d * .42, ease: 'expo.in' }, t).fromTo(p2, { [k]: 100 }, { [k]: 0, duration: d * .42, ease: 'expo.in' }, t);
      bring(to, t + d * .45); tl.set(from, { autoAlpha: 0 }, t + d * .45)
        .to(p1, { [k]: -100, duration: d * .5, ease: 'expo.out' }, t + d * .5).to(p2, { [k]: 100, duration: d * .5, ease: 'expo.out' }, t + d * .5).set([p1, p2], { visibility: 'hidden' }, t + d + .1); },
    // Expand from element (container transform): a card grows into the next scene
    expandFrom(from, to, t, el, d = .9) { M.sfx('whoosh_soft', t, .8); const r = rect(el), W0 = VW(), H0 = VH();
      const ins = `inset(${r.top}px ${W0 - r.right}px ${H0 - r.bottom}px ${r.left}px round ${css('radius') || '20px'})`;
      bring(to, t); tl.fromTo(to, { clipPath: ins }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: d, ease: 'expo.inOut' }, t)
        .fromTo(to.split(',').map(s => s + ' > *').join(','), { scale: .85, opacity: 0 }, { scale: 1, opacity: 1, duration: d, ease: 'expo.out', immediateRender: false }, t + d * .3)
        .set(from, { autoAlpha: 0 }, t + d); },
    // Through the word: a giant word grows until its color fills the screen and reveals the next scene
    throughWord(from, to, t, word, color = null, d = 1.1) { M.sfx('whoosh', t + d * .35, .9);
      // the word uses the next scene's background color; the zoom goes through the stem of the 1st letter
      const c = color ? col(color) : bg(to);
      const o = overlay('transparent', 9002); o.style.display = 'flex'; o.style.alignItems = 'center'; o.style.justifyContent = 'center';
      o.innerHTML = `<div style="font:var(--w-em,900) 200px/1 var(--font-display);color:${c};white-space:nowrap"><span>${word[0]}</span>${word.slice(1)}</div>`; const w = o.firstChild, f = w.firstChild;
      const org = () => `${f.offsetLeft - w.offsetLeft + f.offsetWidth * .24}px ${w.offsetHeight * .5}px`; // computed on first render (fonts loaded)
      tl.set(o, { visibility: 'visible' }, t).fromTo(w, { scale: .6, opacity: 0, transformOrigin: org }, { scale: 1, opacity: 1, duration: d * .35, ease: 'expo.out' }, t)
        .to(w, { scale: 70, duration: d * .55, ease: 'expo.in' }, t + d * .4);
      bring(to, t + d * .95); tl.set(from, { autoAlpha: 0 }, t + d * .95).set(o, { visibility: 'hidden' }, t + d * .95); },
    // Blur dissolve (the most discreet; calm scenes, closing)
    blur(from, to, t, d = .8) { M.sfx('whoosh_soft', t, .5);
      tl.fromTo(from, { filter: 'blur(0px)' }, { immediateRender: false, filter: 'blur(20px)', opacity: 0, scale: 1.04, duration: d * .6, ease: 'power2.in' }, t);
      bring(to, t + d * .3); tl.fromTo(to, { filter: 'blur(20px)', opacity: 0, scale: .97 }, { filter: 'blur(0px)', opacity: 1, scale: 1, duration: d * .8, ease: 'expo.out' }, t + d * .3)
        .set(from, { autoAlpha: 0, filter: 'none', opacity: 1, scale: 1 }, t + d); },
    // Circle reveal as a full transition
    circle(from, to, t, x, y, d = .75) { tl.set(to, { zIndex: ++M.z, autoAlpha: 1 }, t); M.wipe(to, t, x, y, d); tl.set(from, { autoAlpha: 0 }, t + d); },
  };
  // Camera punch-in on an element inside the scene, then back. Good for a number or a button.
  // fx/fy = point inside the element (0–1) that goes to screen center. e.g. a card's number at fx .2
  M.focus = (scene, el, t, zoom = 1.8, d = 1.0, fx = .5, fy = .5) => { const r = rect(el);
    const cx = r.left + r.width * fx, cy = r.top + r.height * fy; M.sfx('whoosh_soft', t, .6);
    // origin 0 0: point p maps to x + p*zoom; to center it, x = center - cx*zoom
    tl.set(scene, { transformOrigin: '0 0' }, t)
      .to(scene, { scale: zoom, x: innerWidth / 2 - cx * zoom, y: innerHeight / 2 - cy * zoom, duration: d, ease: 'expo.inOut' }, t); };
  M.unfocus = (scene, t, d = .9) => { M.sfx('whoosh_soft', t, .5); tl.to(scene, { scale: 1, x: 0, y: 0, duration: d, ease: 'expo.inOut' }, t); };

  /* ---------- video clips as image sequences ----------
     <img class="take" data-dir="T/name" data-n="90" data-t0="15.7"> (frames 001.jpg.. at 30fps) */
  const takes = () => [...document.querySelectorAll('img.take')];
  window.seek = async t => {
    tl.time(t, false);
    const ps = [];
    takes().forEach(im => { const i = Math.max(1, Math.min(+im.dataset.n, Math.round((t - +im.dataset.t0) * 30) + 1));
      const src = im.dataset.dir + '/' + String(i).padStart(3, '0') + '.jpg'; if (!im.src.endsWith(src)) { im.src = src; ps.push(im.decode().catch(() => {})); } });
    await Promise.all(ps); return 0; // never return gsap objects (hangs page.evaluate)
  };

  /* ---------- safe area ---------- */
  // SAFE = {x0,x1,y0,y1}. 9:16 Reels/TikTok: {90,930,250,1500}. 16:9: {120,1800,90,970}. 1:1: {90,990,90,990}. 4:5: {90,990,110,1240}
  M.SAFE = { x0: 90, x1: 930, y0: 250, y1: 1500 };
  window.audit = (sel = '.title .w,.cap .w,.card,.kick,.wd,.gnum,.sans') => {
    const S = M.SAFE, r = [];
    document.querySelectorAll(sel).forEach(e => {
      if (e.closest('[data-bleed]')) return; // decorative elements allowed to bleed
      let p = e, vis = true; while (p && p !== document.body) { const cs = getComputedStyle(p); if (cs.visibility === 'hidden' || +cs.opacity < .05 || /^circle\(0px/.test(cs.clipPath)) { vis = false; break; } p = p.parentElement; }
      if (!vis) return; const b = e.getBoundingClientRect(); if (!b.width) return;
      if (b.right < 0 || b.left > innerWidth || b.bottom < 0 || b.top > innerHeight) return; // fully off-canvas (e.g. carousel slides waiting)
      if (b.left < S.x0 - 2 || b.right > S.x1 + 2 || b.top < S.y0 - 2 || b.bottom > S.y1 + 2) r.push([e.id || e.className, e.textContent.trim().slice(0, 24), Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.bottom)]);
    }); return r;
  };
  M.guides = () => { const S = M.SAFE, W0 = innerWidth, H0 = innerHeight, g = document.createElement('div');
    g.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999';
    const z = (l, t, w, h) => `<div style="position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;background:rgba(255,0,90,.13)"></div>`;
    g.innerHTML = z(0, 0, W0, S.y0) + z(0, S.y1, W0, H0 - S.y1) + z(0, S.y0, S.x0, S.y1 - S.y0) + z(S.x1, S.y0, W0 - S.x1, S.y1 - S.y0) +
      `<div style="position:absolute;left:${S.x0}px;top:${S.y0}px;width:${S.x1 - S.x0}px;height:${S.y1 - S.y0}px;border:3px dashed #ff005a"></div>`;
    document.body.appendChild(g); };
  window.addEventListener('load', () => { if (location.hash === '#guides') M.guides(); });
  window.M = M;
})();

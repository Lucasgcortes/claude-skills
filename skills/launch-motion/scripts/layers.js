// Extracts layers from a page saved with SingleFile (or a local HTML file).
// usage:
//   node layers.js page.html map             -> lists sections, images and videos with their positions (to pick what to use)
//   node layers.js page.html images L/       -> saves all embedded (data:) images and video posters
//   node layers.js page.html shot L/ "selector" name [index]  -> 2x screenshot of the element (cut-out layer)
// Tip: hide the fixed header before the shot (this is done automatically).
const { chromium } = require('playwright');
const LAUNCH = (() => { const fs0 = require('fs'); const e = process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs0.existsSync(p)); return e ? { executablePath: e } : {}; })(); const fs = require('fs'); const path = require('path');
const [HTML, CMD, OUT, SEL, NAME, IDX] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(LAUNCH); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(HTML), { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1200);
  if (CMD === 'map') {
    const r = await p.evaluate(() => {
      const L = [];
      document.querySelectorAll('section,header,footer').forEach(e => { const b = e.getBoundingClientRect(); if (b.height > 50) L.push(['SECTION', Math.round(b.top + scrollY), Math.round(b.height), (e.id || ''), e.innerText.trim().slice(0, 60).replace(/\n/g, ' | ')]); });
      [...document.querySelectorAll('img,video')].forEach((e, i) => { const b = e.getBoundingClientRect(); if (b.width > 40 && b.height > 40) L.push([e.tagName + '#' + i, Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width) + 'x' + Math.round(b.height), (e.alt || ''), 'natural ' + (e.naturalWidth || '-')]); });
      return L; });
    console.log(r.map(x => x.join(' ; ')).join('\n'));
  } else if (CMD === 'images') {
    fs.mkdirSync(OUT, { recursive: true });
    const imgs = await p.evaluate(() => [...document.images].map((e, i) => ({ i, src: e.currentSrc || e.src, alt: e.alt, w: e.naturalWidth })).concat([...document.querySelectorAll('video')].map((v, i) => ({ i: 'poster' + i, src: v.poster || '', alt: 'poster', w: 0 }))));
    for (const im of imgs) { const m = (im.src || '').match(/^data:image\/([\w+]+)[^,]*;base64,(.*)$/); if (m) { const ext = m[1] === 'svg+xml' ? 'svg' : m[1]; fs.writeFileSync(path.join(OUT, `img${im.i}.${ext}`), Buffer.from(m[2], 'base64')); console.log(`img${im.i}.${ext}`, im.alt, im.w); } }
  } else if (CMD === 'shot') {
    fs.mkdirSync(OUT, { recursive: true });
    await p.evaluate(() => { const h = document.querySelector('header'); if (h) h.style.display = 'none'; });
    const els = await p.$$(SEL); const e = els[+(IDX || 0)]; if (!e) { console.log('not found:', SEL); process.exit(1); }
    await e.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await e.screenshot({ path: path.join(OUT, NAME + '.png') }); console.log('ok', NAME);
  }
  await b.close();
})();

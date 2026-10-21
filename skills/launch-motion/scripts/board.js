// Renders the frames for approval (one PNG per scene, at the moment everything has entered)
// and runs the safe-area audit. Also renders the version with guides.
// usage: node board.js video.html board/ "1 Opening@3.2" "2 Pain@6.9" ... [--w 1080 --h 1920]
// Then: python3 sheet.py board/ frames.png
const { chromium } = require('playwright');
const LAUNCH = (() => { const fs0 = require('fs'); const e = process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs0.existsSync(p)); return e ? { executablePath: e } : {}; })(); const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const HTML = path.resolve(a[0]), DIR = a[1], W = +opt('w', 1080), H = +opt('h', 1920);
const S = a.slice(2).filter((x, i, arr) => !x.startsWith('--') && !(arr[i - 1] || '').startsWith('--')).map(x => { const [n, t] = x.split('@'); return [n, +t]; });
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const b = await chromium.launch(LAUNCH);
  for (const g of ['', '#guides']) {
    const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => console.log('ERROR:', e.message));
    await p.goto('file://' + HTML + g); await p.evaluate(() => document.fonts.ready.then(() => 1));
    for (const [k, [n, t]] of S.entries()) {
      await p.evaluate(t => window.seek(t), t);
      if (!g) { const r = await p.evaluate(() => window.audit()); if (r.length) console.log('OUTSIDE SAFE AREA in', n, JSON.stringify(r)); }
      await p.screenshot({ path: path.join(DIR, `${g ? 'g_' : ''}${String(k).padStart(2, '0')}.png`) });
    }
    await p.close();
  }
  fs.writeFileSync(path.join(DIR, 'names.json'), JSON.stringify(S.map(s => s[0])));
  await b.close(); console.log('ok');
})();

// Renders the timeline frame by frame and produces an MP4 without audio.
// usage: node render.js video.html body.mp4 [--w 1080 --h 1920 --fps 30 --sync sync.json]
// Without --sync, the duration is window.DUR. With --sync (produced by beats.py), time is "warped"
// so that the animation's anchors land on the music's beats.
const { chromium } = require('playwright');
const LAUNCH = (() => { const fs0 = require('fs'); const e = process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium'].find(p => fs0.existsSync(p)); return e ? { executablePath: e } : {}; })(); const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const HTML = path.resolve(a[0]), OUT = a[1] || 'body.mp4', W = +opt('w', 1080), H = +opt('h', 1920), FPS = +opt('fps', 30), SYNC = opt('sync', null);
(async () => {
  const b = await chromium.launch(LAUNCH); const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await p.goto('file://' + HTML); await p.evaluate(() => document.fonts.ready.then(() => 1));
  let M = null; if (SYNC) M = JSON.parse(fs.readFileSync(SYNC)).map; // [[video_time, design_time],...]
  const warp = t => { if (!M) return t; for (let i = 1; i < M.length; i++) if (t <= M[i][0]) { const [v0, d0] = M[i - 1], [v1, d1] = M[i]; return d0 + (t - v0) * (d1 - d0) / (v1 - v0); } return M[M.length - 1][1]; };
  const D = M ? M[M.length - 1][0] : await p.evaluate(() => window.DUR); const N = Math.round(D * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => window.seek(t), warp(i / FPS));
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  // sound effects: convert the cues (animation time) to video time
  const cues = await p.evaluate(() => window.SFX || []);
  const inv = d => { if (!M) return d; for (let i = 1; i < M.length; i++) { const [v0, d0] = M[i - 1], [v1, d1] = M[i]; if (d <= d1) return v0 + (d - d0) * (v1 - v0) / (d1 - d0); } return null; };
  const out = cues.map(c => ({ ...c, t: inv(c.t) })).filter(c => c.t !== null && c.t >= 0 && c.t < D);
  fs.writeFileSync(OUT.replace(/\.mp4$/, '') + '.sfx.json', JSON.stringify(out));
  await b.close(); console.log('ok', D.toFixed(3), 's ·', out.length, 'sound effects cued');
})();

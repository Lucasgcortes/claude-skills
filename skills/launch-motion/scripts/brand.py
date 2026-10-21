"""Turns brand.json into the project's kit/theme.css (+ kit/format.js), copying fonts and logos.

usage: python3 brand.py brand.json kit/ [--format 9x16|16x9|1x1|4x5]

Fonts: each entry in brand.json "fonts" uses either
  "files": {"400": "path.otf", "400i": "path-italic.otf", "900": "path-black.otf"}   (the brand's own files)
  "fontsource": "inter"   (free Google font, installed from npm: @fontsource/<name>)
Paths in brand.json are relative to the brand.json file.
"""
import sys, os, json, shutil, subprocess, glob

FORMATS = {  # width, height, safe area (x0,x1,y0,y1), headline em/base px, kicker px
    '9x16': (1080, 1920, (90, 930, 250, 1500), 88, 76, 28),
    '16x9': (1920, 1080, (120, 1800, 90, 970), 104, 90, 30),
    '1x1': (1080, 1080, (90, 990, 90, 990), 84, 72, 26),
    '4x5': (1080, 1350, (90, 990, 110, 1240), 86, 74, 27),
}

a = sys.argv[1:]
if len(a) < 2:
    print(__doc__); sys.exit(1)
BJ, KIT = a[0], a[1]
FMT = a[a.index('--format') + 1] if '--format' in a else '9x16'
B = json.load(open(BJ)); base = os.path.dirname(os.path.abspath(BJ))
os.makedirs(os.path.join(KIT, 'fonts'), exist_ok=True)
W, H, S, EM, BASE, KICK = FORMATS[FMT]
C = B.get('colors', {})


def lum(hx):
    hx = hx.lstrip('#'); r, g, b = [int(hx[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)


warn = []
for fg, bg in [('fg', 'bg'), ('dark_fg', 'dark')]:
    if fg in C and bg in C and contrast(C[fg], C[bg]) < 4.5:
        warn.append(f'low contrast {fg} on {bg}: {contrast(C[fg], C[bg]):.1f}:1 (aim for 4.5+)')

# ---------- fonts ----------
faces = []


def weight_style(k):
    k = str(k); it = k.endswith('i'); return int(k.rstrip('i')), 'italic' if it else 'normal'


def need_fontsource(name):
    pkg = f'node_modules/@fontsource/{name}'
    if not os.path.isdir(pkg):
        print(f'installing @fontsource/{name} …')
        subprocess.run(['npm', 'i', f'@fontsource/{name}', '--silent'], check=True)
    return pkg


for role, f in B.get('fonts', {}).items():
    fam = f'brand-{role}'
    if 'files' in f:
        for k, path in f['files'].items():
            w, st = weight_style(k); src = os.path.join(base, path); dst = os.path.join(KIT, 'fonts', os.path.basename(path))
            shutil.copy(src, dst)
            faces.append(f"@font-face{{font-family:'{fam}';src:url(fonts/{os.path.basename(path)});font-weight:{w};font-style:{st}}}")
    elif 'fontsource' in f:
        name = f['fontsource']; pkg = need_fontsource(name)
        for fp in sorted(glob.glob(f'{pkg}/files/{name}-latin-[0-9]*-*.woff2')):
            fn = os.path.basename(fp); parts = fn[:-6].split('-'); w, st = parts[-2], parts[-1]
            if f.get('weights') and int(w) not in f['weights']: continue
            shutil.copy(fp, os.path.join(KIT, 'fonts', fn))
            # latin-ext for accents beyond basic latin (é, ã, ç are in latin; ext covers more)
            faces.append(f"@font-face{{font-family:'{fam}';src:url(fonts/{fn});font-weight:{w};font-style:{st}}}")
    else:
        warn.append(f'font "{role}" has no files/fontsource; falling back to system sans')

hl = B.get('headline', {}); hb = hl.get('base', {'weight': 400, 'italic': False}); he = hl.get('em', {'weight': 800, 'italic': False})
disp = "'brand-display'" if 'display' in B.get('fonts', {}) else "'brand-body'"
body = "'brand-body'" if 'body' in B.get('fonts', {}) else disp
case = 'uppercase' if hl.get('case') == 'upper' else 'none'
r = B.get('radius', 20)
acc_use = B.get('accent_use', 'details')

v = lambda k, d: C.get(k) or d
css = '\n'.join(faces) + f"""
:root{{--bg:{v('bg', '#f4f4f5')};--fg:{v('fg', '#18181b')};--dark:{v('dark', '#18181b')};--dark-fg:{v('dark_fg', '#fafafa')};
--accent:{v('accent', '#2563eb')};--accent-fg:{v('accent_fg', '#ffffff')};--accent-on-dark:{v('accent_on_dark', v('accent', '#2563eb'))};--dark-bg:{v('dark_gradient', 'var(--dark)')};--surface:{v('surface', '#ffffff')};--muted:{v('muted', '#6b7280')};
--font-display:{disp},system-ui,sans-serif;--font-body:{body},system-ui,sans-serif;
--w-em:{he.get('weight', 800)};--w-base:{hb.get('weight', 400)};--radius:{r}px;--mk:var(--accent);
--W:{W}px;--H:{H}px;--x0:{S[0]}px;--x1:{S[1]}px;--y0:{S[2]}px;--y1:{S[3]}px;--safe-w:{S[1] - S[0]}px;
--t-em:{EM}px;--t-base:{BASE}px;--kick:{KICK}px;--tracking:{hl.get('tracking', '-0.01em')};--lh:{hl.get('line', 1.08)}}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:var(--W);height:var(--H);overflow:hidden;background:var(--bg)}}
#stage{{position:absolute;inset:0;overflow:hidden;background:var(--bg)}}
.sc{{position:absolute;inset:0;overflow:hidden;background:var(--bg)}} .wipe{{clip-path:circle(0px at 50% 50%)}}
.light{{background:var(--bg);color:var(--fg)}} .dark{{background:var(--dark-bg);background-size:180% 180%;color:var(--dark-fg)}} .accent-bg{{background:var(--accent);color:var(--accent-fg)}}
/* headline: .base = regular voice, .em = emphasis (contrast by weight, not by color) */
.title{{position:absolute;left:var(--x0);top:calc(var(--y0) + 44px);width:var(--safe-w);color:var(--fg);font:400 80px/1 var(--font-display);text-transform:{case};letter-spacing:var(--tracking)}}
.dark .title,.title.on-dark{{color:var(--dark-fg)}}
.title .ln{{display:block;white-space:nowrap;line-height:var(--lh)}}
.w{{display:inline-block}}
.em{{font:{'italic ' if he.get('italic') else ''}var(--w-em) var(--t-em)/1.05 var(--font-display)}}
{'.title .em{color:var(--accent)} .dark .title .em,.title.on-dark .em{color:var(--accent-on-dark)}' if he.get('color') == 'accent' else ''}
.base{{font:{'italic ' if hb.get('italic') else ''}var(--w-base) var(--t-base)/1.1 var(--font-display)}}
.dot{{color:var(--accent)}}
.kick{{position:absolute;left:var(--x0);top:var(--y0);font:700 var(--kick) var(--font-body);letter-spacing:.2em;text-transform:uppercase;color:var(--fg)}}
.dark .kick{{color:var(--dark-fg)}}
.dark .dot{{color:var(--accent-on-dark)}}
.card{{position:absolute;border-radius:var(--radius);overflow:hidden;background:var(--surface);box-shadow:0 26px 60px rgba(0,0,0,.14),0 3px 10px rgba(0,0,0,.06)}}
.card img{{display:block;width:100%;height:100%;object-fit:cover}}
.punch{{display:flex;align-items:center;justify-content:center}}
.punch .wd{{display:inline-block;font:var(--w-em) calc(var(--t-em) * 1.6)/1 var(--font-display);white-space:nowrap;text-transform:{case};letter-spacing:var(--tracking)}}
.punch .lt{{display:inline-block}}
.wlist{{position:absolute;left:var(--x0);width:var(--safe-w);height:450px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent,#000 30%,#000 70%,transparent)}}
.wlist .wi{{height:150px;display:flex;align-items:center;font:var(--w-em) 112px/1 var(--font-display);white-space:nowrap;letter-spacing:var(--tracking)}}
.gnum{{display:flex;align-items:flex-end;font:900 160px/1 var(--font-body);letter-spacing:-.03em;overflow:hidden;height:170px}}
.gnum .unit{{font:700 60px var(--font-body);letter-spacing:0;margin-left:18px;padding-bottom:16px}}
.mk{{background:linear-gradient(var(--mk),var(--mk)) no-repeat 0 88%/0% 42%;padding:0 .08em}}
.outro{{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}}
.outro .logo{{max-width:46%;max-height:22%}} .outro .tag{{font:600 calc(var(--kick) * 1.3) var(--font-body);letter-spacing:.02em}}
.sans{{font-family:var(--font-body)}}
"""
open(os.path.join(KIT, 'theme.css'), 'w').write(css)
PACE = {'calm': 1.2, 'balanced': 1.0, 'energetic': .85}.get((B.get('motion') or {}).get('energy', 'balanced'), 1.0)
open(os.path.join(KIT, 'format.js'), 'w').write(
    f"window.FORMAT={{w:{W},h:{H},name:'{FMT}'}};if(window.M){{M.SAFE={{x0:{S[0]},x1:{S[1]},y0:{S[2]},y1:{S[3]}}};M.pace={PACE};M.IN.duration*={PACE};M.OUT.duration*={PACE};}}"
    f"document.documentElement.lang='{B.get('locale', 'en-US')}';if(window.M)M.locale='{B.get('locale', 'en-US')}';\n")
for k, path in (B.get('logo') or {}).items():
    src = os.path.join(base, path); ext = os.path.splitext(path)[1]
    if os.path.exists(src): shutil.copy(src, os.path.join(KIT, f'logo-{k}{ext}'))
    else: warn.append(f'logo "{k}" not found: {src}')
print(f'ok: {KIT}/theme.css  format {FMT} {W}x{H}  safe x {S[0]}-{S[1]} y {S[2]}-{S[3]}  accent use: {acc_use}')
for w_ in warn: print('WARNING:', w_)

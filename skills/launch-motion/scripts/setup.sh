#!/usr/bin/env bash
# Prepares a render project. Run once per project folder.
# usage: bash setup.sh <project_folder>
set -e
P=${1:-.}; DIR=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$P"; cd "$P"
which ffmpeg >/dev/null || { echo "ffmpeg not found: install it (apt-get install -y ffmpeg / brew install ffmpeg)"; exit 1; }
[ -f package.json ] || echo '{"private":true}' > package.json
# Chromium: reuse a preinstalled one if PW_CHROMIUM or /opt/pw-browsers exists, otherwise let playwright download it
if [ -n "$PW_CHROMIUM" ] || [ -d /opt/pw-browsers ]; then export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1; fi
[ -d node_modules/playwright ] || npm i playwright@1 --silent
[ -n "$PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD" ] || npx playwright install chromium
[ -d node_modules/gsap ] || npm i gsap@3 --silent
python3 -c "import librosa, scipy, PIL" 2>/dev/null || pip install librosa scipy pillow -q --break-system-packages 2>/dev/null || pip install librosa scipy pillow -q
mkdir -p kit; cp node_modules/gsap/dist/gsap.min.js "$DIR/scripts/motion.js" kit/
cp -n "$DIR/scripts/template.html" video.html 2>/dev/null || true
cp -n "$DIR/examples/brand.example.json" brand.json 2>/dev/null || true
echo "ready: $(pwd)"
echo "next: edit brand.json, then  python3 $DIR/scripts/brand.py brand.json kit --format 9x16"

#!/usr/bin/env bash
# Mixes the final audio (music with fade + sound effects) onto the rendered body.
# usage: bash finalize.sh body.mp4 music.(mp3|wav|-) out.mp4 [MUSIC_OFFSET] [body.sfx.json|-] [SFX_GAIN]
# e.g.:  bash finalize.sh body.mp4 track.wav final.mp4 0 body.sfx.json 0.6
set -e
BODY=$1; MUS=$2; OUT=$3; OFF=${4:-0}; SFXJ=${5:--}; SG=${6:-0.5}
SC=$(cd "$(dirname "$0")" && pwd); TMP=$(mktemp -d)
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$BODY")
FST=$(python3 -c "print(max(0,$D-2.5))")
if [ -n "$MUS" ] && [ "$MUS" != "-" ]; then
  ffmpeg -v error -y -i "$MUS" -af "atrim=$OFF:$(python3 -c "print($OFF+$D)"),asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st=$FST:d=2.5,volume=0.85" -ar 48000 -ac 2 "$TMP/base.wav"
else
  ffmpeg -v error -y -f lavfi -t "$D" -i anullsrc=r=48000:cl=stereo "$TMP/base.wav"
fi
if [ "$SFXJ" != "-" ] && [ -f "$SFXJ" ]; then
  python3 -I "$SC/sfx_track.py" "$SFXJ" "$TMP/sfx.wav" --gain "$SG" >/dev/null
  ffmpeg -v error -y -i "$TMP/base.wav" -i "$TMP/sfx.wav" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map "[a]" "$TMP/b2.wav" && mv "$TMP/b2.wav" "$TMP/base.wav"
fi
ffmpeg -v error -y -i "$BODY" -i "$TMP/base.wav" -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
rm -rf "$TMP"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"

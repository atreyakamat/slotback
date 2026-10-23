#!/usr/bin/env bash
# Renders each series reel's posting file (no song), then a preview with the
# song mixed in for checking sync. Usage: scripts/render-series.sh <outDir> [reelId...]
set -euo pipefail
OUT=${1:?outDir}; shift
mkdir -p "$OUT"
IDS=("$@")
if [ ${#IDS[@]} -eq 0 ]; then
  IDS=($(npx tsx -e 'import {reels} from "./src/series/reels"; console.log(reels.map(r=>r.id).join(" "))'))
fi
BROWSER=${REMOTION_BROWSER:+--browser-executable=$REMOTION_BROWSER}
for id in "${IDS[@]}"; do
  meta=$(npx tsx -e "import {reels} from './src/series/reels'; const r=reels.find(r=>r.id==='$id')!; const f={windows:'windows-in-brazil',paixao:'paixao-sped-up',cavuca:'cavuca-funk',struct:'struct-slowed'}[r.track]; console.log(f, r.songStart)")
  read -r song start <<< "$meta"
  npx remotion render "$id" "$OUT/.raw-$id.mp4" $BROWSER --codec=h264 --crf=18 --props="{\"reelId\":\"$id\",\"withSong\":false}" --log=error
  ffmpeg -loglevel error -y -i "$OUT/.raw-$id.mp4" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 "$OUT/$id-POST.mp4"
  if [ -f "public/music/$song.mp3" ]; then
    ffmpeg -loglevel error -y -i "$OUT/.raw-$id.mp4" -ss "$start" -i "public/music/$song.mp3" \
      -filter_complex "[0:a]volume=0.8[a0];[1:a]volume=0.9[a1];[a0][a1]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
      -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 "$OUT/$id-PREVIEW-with-song.mp4"
  fi
  rm -f "$OUT/.raw-$id.mp4"
  echo "rendered $id"
done

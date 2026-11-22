#!/bin/bash
# Downloads every rendered part, glues them in order, lays the full soundtrack over, delivers the final MP4.
set -euo pipefail
WANT=$(node -e "const m=JSON.parse(process.argv[1]);console.log(m.length)" "$(node cloud/plan.mjs 2>/dev/null | sed -n 's/^matrix=//p')")
mkdir -p parts
gh release download "$TAG" -p 'part-*.mp4' -D parts
GOT=$(ls parts/part-*.mp4 | wc -l)
[ "$GOT" = "$WANT" ] || { echo "expected $WANT parts, found $GOT"; exit 1; }
ls parts/part-*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > list.txt
if [ -f project/data/mix.flac ]; then
  ffmpeg -v error -y -f concat -safe 0 -i list.txt -i project/data/mix.flac -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$NAME.mp4"
else
  ffmpeg -v error -y -f concat -safe 0 -i list.txt -map 0:v -c:v copy -movflags +faststart "$NAME.mp4"
fi
echo "FINAL $(ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$NAME.mp4" | tr '\n' ' ')"
gh release upload "$TAG" "$NAME.mp4" --clobber
for f in parts/part-*.mp4; do gh release delete-asset "$TAG" "$(basename "$f")" -y; done
echo "DELIVERED $NAME.mp4"

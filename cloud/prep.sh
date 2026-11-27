#!/bin/bash
# Runs on GitHub. Does the prep steps listed in cloud/job.json, in order, on ./project, and puts the results in ./out:
#   voice (Kokoro, or the project's tools/voice_edge.py + gaps.py when voice = edge) · words (Whisper) · estimate ·
#   check · cues · mix · sheet · frames
# Every step's output goes to out/prep.log. Exit 1 if any step failed (results are still delivered).
set -u
J="$PWD/cloud/job.json"
jv() { node -p "const j=require('$J'); $1"; }
STEPS=$(jv "(j.steps||[]).join(' ')"); VOICE=$(jv "j.voice||'kokoro'"); FRAMES=$(jv "j.frames||''"); SHEET=$(jv "j.sheet||'0.5 10'")
export CHROME="$PWD/cloud/chrome.sh"; chmod +x "$CHROME"; export FPS=$(jv "j.fps||30")
[ "$(jv "!!j.software_gl")" = true ] && export SOFTWARE_GL=1
Q=$(jv "j.qs||''"); [ -n "$Q" ] && export QS="$Q"
P="$PWD/project"; SK="$PWD/cloud/skill"; OUT="$PWD/out"; LOG="$OUT/prep.log"; mkdir -p "$OUT"; : > "$LOG"; ok=1
log() { echo "$*" | tee -a "$LOG"; }
# each step gets a second try: headless Chrome occasionally fails to start on a fresh machine
run() {
  local name="$1"; shift; local t0=$SECONDS; log "== $name"
  if ( "$@" ) >> "$LOG" 2>&1; then log "   $name OK ($((SECONDS - t0)) s)"; return; fi
  log "   $name failed once, trying again"; pkill -9 -f fs-chrome- 2>/dev/null || true; sleep 3
  if ( "$@" ) >> "$LOG" 2>&1; then log "   $name OK on second try ($((SECONDS - t0)) s)"; else log "   $name FAILED ($((SECONDS - t0)) s)"; ok=0; fi
}
# the laptop sends sound as flac; the tools want wav
for f in "$P"/data/*.flac; do [ -e "$f" ] && ffmpeg -v error -y -i "$f" "${f%.flac}.wav" && rm "$f"; done
edge_voice() {
  python3 -X utf8 "$P/tools/voice_edge.py" "$P" || return 1
  cp "$P/data/lines.json" "$P/data/lines_raw.json"; cp "$P/data/words.json" "$P/data/words_raw.json"
  if [ -f "$P/tools/gaps.py" ] && node -e "process.exit(Object.keys(require('$P/script.json').gaps||{}).length?0:1)"; then python3 -X utf8 "$P/tools/gaps.py" "$P"; fi
}
check() { cd "$P" && node tools/capture.mjs check > "$OUT/check.txt" 2>&1; local r=$?; cat "$OUT/check.txt"; [ $r = 0 ] && grep -q 'CHECK OK' "$OUT/check.txt"; }
for s in $STEPS; do
  case "$s" in
    voice) if [ "$VOICE" = edge ]; then run voice edge_voice; else run voice python3 -X utf8 "$SK/voice.py" "$P"; fi ;;
    words) run words python3 -X utf8 "$SK/words.py" "$P" ;;
    estimate) run estimate python3 -X utf8 "$SK/estimate.py" "$P" ;;
    check) run check check ;;
    cues) run cues bash -c "cd '$P' && node tools/capture.mjs cues" ;;
    mix) run mix bash -c "cd '$P' && python3 -X utf8 tools/mix.py ." ;;
    sheet) run sheet bash -c "cd '$P' && node tools/capture.mjs sheet review/all.jpg $SHEET" ;;
    frames) run frames bash -c "cd '$P' && node tools/capture.mjs frames review/f '$FRAMES'" ;;
    *) log "unknown step $s"; ok=0 ;;
  esac
done
# collect: timing and cue files, sound as flac, review pictures
mkdir -p "$OUT/data" "$OUT/review"
for f in "$P"/data/*.json "$P"/data/*.txt "$P"/data/*.mp3; do [ -e "$f" ] && cp "$f" "$OUT/data/"; done
for w in narration mix; do [ -f "$P/data/$w.wav" ] && ffmpeg -v error -y -i "$P/data/$w.wav" -c:a flac "$OUT/data/$w.flac"; done
[ -f "$P/review/all.jpg" ] && cp "$P/review/all.jpg" "$OUT/review/"
[ -d "$P/review/f" ] && cp -r "$P/review/f" "$OUT/review/"
D=$(node -p "try{require('$P/data/lines.json').duration}catch(e){''}")
log "RESULT $([ $ok = 1 ] && echo OK || echo FAILED)${D:+ · duration $D s}"
[ $ok = 1 ]

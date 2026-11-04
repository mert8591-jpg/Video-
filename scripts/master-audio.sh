#!/usr/bin/env bash
# Render edilmiş videonun sesini sosyal medya standardına getirir (görüntüye dokunmaz).
#   - Ses yüksekliği: -14 LUFS (Instagram, TikTok, YouTube hedefi), tepe en fazla -1 dBTP
#   - İki geçişli loudnorm: önce ölç, sonra doğrusal olarak ayarla (pompalama yapmaz)
#   - Ses AAC 320 kbps, 48 kHz; görüntü olduğu gibi kopyalanır (kalite kaybı yok)
#
# Kullanım: npm run master -- out/video.mp4            -> out/video-master.mp4
#           npm run master -- out/video.mp4 out/son.mp4
set -euo pipefail

IN="${1:?Kullanım: npm run master -- <girdi.mp4> [çıktı.mp4]}"
OUT="${2:-${IN%.*}-master.mp4}"
TARGET="I=-14:TP=-1:LRA=11"

if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  echo "Bu videoda ses yok, işlem gerekmiyor: $IN" >&2
  exit 1
fi

echo "1/2 Ses ölçülüyor..."
STATS=$(ffmpeg -hide_banner -nostats -i "$IN" -af "loudnorm=$TARGET:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | grep "\"$1\"" | sed -E 's/.*: "?([^",]*)"?,?/\1/'; }

echo "   Önce: $(get input_i) LUFS, tepe $(get input_tp) dBTP"

echo "2/2 Ayarlanıyor..."
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -af "loudnorm=$TARGET:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"

AFTER=$(ffmpeg -hide_banner -nostats -i "$OUT" -af "loudnorm=$TARGET:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p' | grep '"input_i"' | sed -E 's/.*: "([^"]*)".*/\1/')
echo "   Sonra: $AFTER LUFS"
if awk -v a="$AFTER" 'BEGIN{exit !(a < -15)}'; then
  echo "   Not: -14'e ulaşılamadı; ses çok sivri (ani vuruşlar), tepe -1 dBTP sınırında durduruldu." >&2
  echo "   Daha yüksek ses için müziği/efektleri miksajda dengeleyin veya sıkıştırın." >&2
fi
echo "Hazır: $OUT"

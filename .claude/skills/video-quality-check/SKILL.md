---
name: video-quality-check
description: Render edilmiş bir video dosyasının (mp4/mov/webm) teknik ve görsel kalitesini doğrular — çözünürlük, fps, süre, codec, bitrate, ses, siyah/donuk kareler, ses seviyesi ve örnek kare incelemesi. Bir video render edildikten sonra, kullanıcıya teslim etmeden önce veya "videoyu kontrol et / kalite kontrol" istendiğinde kullan. Triggers: video QA, ffprobe, check render, quality check.
---

# Video Kalite Kontrolü

Bir videoyu "bitti" demeden önce bu kontrolleri çalıştır ve sonuçları kullanıcıya özetle.
Hiçbir kontrolü atlama; atlarsan nedenini söyle.

## 1. Teknik bilgiler (ffprobe)

```bash
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,bit_rate,sample_rate,channels \
  -of json out/video.mp4
```

Beklenenle karşılaştır:
- Genişlik × yükseklik ve fps kompozisyonla aynı mı?
- Süre ≈ `durationInFrames / fps` (± 1 kare) mı?
- Video codec `h264` + `pix_fmt=yuv420p` (en uyumlu) mı?
- Ses beklendiyse ses akışı var mı (`codec_type=audio`)?
- 1080p30 için video bitrate kabaca ≥ 5 Mbps; çok düşükse CRF'i düşür.

## 2. Siyah ve donuk kareler

```bash
# Siyah bölümler (bilinçli fade'ler hariç uyarı ver)
ffmpeg -v info -i out/video.mp4 -vf "blackdetect=d=0.3:pix_th=0.10" -an -f null - 2>&1 | grep blackdetect

# Donmuş (değişmeyen) bölümler — uzun statik sahne bilinçli değilse sorun
ffmpeg -v info -i out/video.mp4 -vf "freezedetect=n=0.003:d=2" -an -f null - 2>&1 | grep freeze_
```

## 3. Ses seviyesi

```bash
# Sessiz bölümler
ffmpeg -v info -i out/video.mp4 -af "silencedetect=n=-50dB:d=1" -vn -f null - 2>&1 | grep silence_

# Loudness (hedef: sosyal medya/YouTube için ~ -14 LUFS, true peak ≤ -1 dBTP)
ffmpeg -v info -i out/video.mp4 -af loudnorm=print_format=summary -vn -f null - 2>&1 | tail -n 12
```

Normalize gerekiyorsa (yeniden encode etmeden video kopyalanır):

```bash
ffmpeg -i out/video.mp4 -c:v copy -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 320k out/video-norm.mp4
```

## 4. Görsel inceleme

Videonun çeşitli noktalarından kare çıkar ve **Read aracıyla her birine bak**:

```bash
mkdir -p out/qa
ffmpeg -v error -i out/video.mp4 -vf "fps=1/2,scale=960:-1" out/qa/frame-%03d.png   # her 2 sn'de bir
# veya tek bir kontakt sayfası:
ffmpeg -v error -i out/video.mp4 -vf "fps=1/2,scale=480:-1,tile=4x4" -frames:v 1 out/qa/contact.png
```

Kontrol listesi:
- [ ] Metinler okunabilir, taşmıyor, kesilmiyor; yazım/Türkçe karakter hatası yok
- [ ] Doğru font yüklenmiş (fallback serif/sans görünmüyor)
- [ ] Öğeler güvenli alan içinde (9:16'da üst/alt boşluk)
- [ ] Kontrast yeterli; renkler marka paletiyle uyumlu
- [ ] Görseller bulanık/pikselli değil; gradyanlarda belirgin banding yok
- [ ] Sahne geçişleri yerinde, ani boş kare yok
- [ ] Son kare/outro düzgün (logo, CTA) ve video aniden kesilmiyor

## 5. Rapor

Kullanıcıya kısa bir tablo ver: çözünürlük, fps, süre, boyut, codec, bitrate, ses LUFS,
bulunan sorunlar ve yapılan düzeltmeler. Sorun varsa düzelt, yeniden render al ve bu
kontrolü tekrarla. Son olarak videoyu SendUserFile ile kullanıcıya gönder.

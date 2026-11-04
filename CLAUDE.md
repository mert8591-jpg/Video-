# Video- Projesi

Bu depo, Remotion (React) ile kod tabanlı, yüksek kaliteli video üretimi içindir.

## Skill'ler

- `.claude/skills/remotion-video/` — video projesi kurma, sahne yazma, animasyon, ses,
  font, geçiş, altyazı ve render. Video ile ilgili her işte önce bunu kullan.
- `.claude/skills/video-quality-check/` — render edilen videonun teknik ve görsel kontrolü.
  Kullanıcıya video teslim etmeden önce mutlaka çalıştır.

## Kurallar

- Animasyonlar yalnızca `useCurrentFrame()` ile kareye bağlı olmalı (CSS animasyonu yok).
- Renk, font, süre gibi sabitler `src/storyboard.ts` içinde tek yerde tutulur.
- Render çıktıları `out/` klasörüne yazılır ve commit edilmez.
- Bu ortamda tarayıcı gerekirse: `--browser-executable=/opt/pw-browsers/chromium`.
- Kullanıcıyla Türkçe iletişim kur.

## Remotion resmi skill'leri

`.claude/skills/remotion-*` (remotion-best-practices, remotion-create, remotion-markup,
remotion-captions, remotion-render vb.) Remotion ekibinin resmi skill'leridir
(kaynak: github.com/remotion-dev/skills, commit c7cb2fd). Remotion API ayrıntılarında bunlar
esas alınır; `remotion-video` ise bu projenin iş akışı ve kalite kurallarıdır.

Not: Bu bulut ortamında kullanıcı Remotion Studio önizlemesini açamaz. Önizleme için
`npx remotion still` ile kare görüntüleri veya kısa bir mp4 render alıp kullanıcıya gönder.

## Tasarım skill'leri

`.claude/skills/frontend-design` ve `.claude/skills/theme-factory` Anthropic'in resmi
skill'leridir (kaynak: github.com/anthropics/skills, commit ca45fc4, Apache 2.0).
Video tasarımında görsel yön ve hazır renk/font temaları için kullanılır.

## Ses ve efekt araçları (ücretsiz, kurulu)

- `npm run sfx` → `public/sfx/` altına telifsiz, kodla üretilmiş efektler: `whoosh`, `whoosh-slow`,
  `riser`, `impact`, `sub-drop`, `swell`, `click`, `shimmer`, `glitch` (48 kHz stereo WAV).
  Kullanım: `<Audio src={staticFile("sfx/whoosh.wav")} />`, geçişten ~0.3 sn önce başlat.
- `npm run sfx` ile aynı mantıkta `npm run thunder` gök gürültüsü üretir.
- `npm run master -- out/video.mp4` → sesi -14 LUFS / -1 dBTP'ye getirir (Instagram/TikTok/YouTube
  standardı), görüntüyü yeniden kodlamaz. Final render'dan sonra, teslimden önce çalıştır.
- Kurulu Remotion paketleri (hepsi 4.0.540, sürümler sabit tutulur): transitions, google-fonts,
  media-utils (ses dalgası/spektrum görselleştirme), noise, shapes, paths, motion-blur,
  light-leaks, layout-utils (fitText), captions, install-whisper-cpp (yerel ücretsiz altyazı),
  sfx (Remotion'ın efekt URL'leri).
- `@remotion/sfx` sesleri `remotion.media`'dan, whisper modelleri `huggingface.co`'dan iner; bu
  ortamın ağ izninde bu alan adları yoksa çalışmaz (bkz. `docs/baglanti-plani.md`). `@remotion/sfx`
  içindeki meme sesleri (vine-boom, spongebob vb.) telif riski taşır; yayın videolarında kullanma.

## Token tasarrufu

- `node_modules/`, `out/`, `package-lock.json` ve ses/video dosyalarını okuma; ses için
  `ffprobe`/`ebur128` ölçümü, görüntü için düşük çözünürlüklü still kullan.
- Önizleme: tam render yerine birkaç `npx remotion still --scale=0.5` karesi; kontrol amaçlı
  görselleri tek bir ızgara görüntüde birleştirip bir kez incele.
- Dosyanın tamamını değil gereken bölümünü oku; sabitler zaten `src/storyboard.ts` içinde.
- Her yeni iş için yeni oturum aç; kalınan yer `docs/` altındaki notlarda tutulur.

## Bağlantılar

Diğer uygulamaları (connector, API anahtarı) bağlama planı ve durumu `docs/baglanti-plani.md`
içindedir. Yeni oturumda önce onu oku.

## Kalite hedefi

Kullanıcı 4K kaliteli video istiyor: 1080p ölçülerle tasarla, final render'ı `--scale=2`
ile al (bkz. `remotion-video` Bölüm 7). Kullanıcının bütçesi kısıtlı: önce birkaç still
kare göster, onay alınca render al; gereksiz tekrar render'lardan kaçın.

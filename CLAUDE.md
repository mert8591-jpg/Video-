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

## Kalite hedefi

Kullanıcı 4K kaliteli video istiyor: 1080p ölçülerle tasarla, final render'ı `--scale=2`
ile al (bkz. `remotion-video` Bölüm 7). Kullanıcının bütçesi kısıtlı: önce birkaç still
kare göster, onay alınca render al; gereksiz tekrar render'lardan kaçın.

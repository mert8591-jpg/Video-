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

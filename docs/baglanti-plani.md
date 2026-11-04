# Uygulama bağlantı planı

Bu dosya, önceki oturumda konuşulan bağlantı planını yeni oturuma taşımak için tutulur.

## Durum

- Bağlı connector: **Higgsfield** (görsel, video ve ses üretimi; kredili).
- Mevcut video: bulut tüneli (9:16, 13 sn, şimşek ve gök gürültüsü), `src/` altında.

## Eklenecek connector'lar (claude.ai/customize/connectors)

Önerilen ilk adım: **Unsplash** (ücretsiz HD fotoğraf).
Diğer adaylar: Canva, Google Drive, vidIQ, Figma, Riverside, Metricool, Orshot, Adobe.

Tam liste: https://claude.ai/directory/connectors
Bir connector bağlandıktan sonra yeni oturum açılmalı.

## API anahtarı ile bağlanacaklar

Anahtar ortam ayarlarına (bulut ortamı menüsü → Edit → Network secrets
veya ortam değişkeni) eklenir, sohbete yapıştırılmaz.
Network access "Limited" ise ilgili alan adı Allowed domains listesine eklenir.

| Servis | Değişken | Alan adı |
|---|---|---|
| Pexels (stok video/foto) | `PEXELS_API_KEY` | `api.pexels.com` |
| Pixabay (stok video/müzik/foto) | `PIXABAY_API_KEY` | `pixabay.com` |
| Freesound (ses efekti) | `FREESOUND_API_KEY` | `freesound.org` |
| Gemini | `GEMINI_API_KEY` | `generativelanguage.googleapis.com` |
| OpenAI | `OPENAI_API_KEY` | `api.openai.com` |

## Ağ izni gereken ücretsiz kaynaklar (anahtar gerekmez)

4 Kasım 2026'da test edildi: bu alan adları ortamın ağ politikası tarafından engelleniyor.
Ortam ayarları → Network access → Allowed domains listesine eklenirse açılır:

| Alan adı | Ne için |
|---|---|
| `remotion.media` | `@remotion/sfx` ses efektleri |
| `huggingface.co` | Whisper altyazı modelleri (`@remotion/install-whisper-cpp`) |
| `images.pexels.com`, `api.pexels.com` | Pexels stok foto/video (API anahtarı da gerekir) |
| `freesound.org` | Freesound ses efektleri (API anahtarı da gerekir) |

Erişilebilir olanlar: `fonts.googleapis.com` (Google Fonts), `registry.npmjs.org`, `pypi.org`.

## Yeni oturumda yapılacaklar

1. Hangi connector'ların ve anahtarların eklendiğini kontrol et (`ListConnectors`, `env`).
2. Her birini küçük bir testle doğrula (ör. Unsplash'ten bir fotoğraf ara).
3. Bütçe kısıtlı: kredili servisleri kullanmadan önce kullanıcıdan onay al.

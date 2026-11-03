# Render ve Kalite Ayarları

## Önce önizleme kareleri

Tam render uzun sürer; önce kritik karelerden still al ve Read aracıyla görsel olarak incele:

```bash
for f in 0 45 90 150 240; do
  npx remotion still Main out/preview-$f.png --frame=$f
done
```

Kontrol: metin taşması, kesilen öğeler, font yüklenmiş mi, kontrast, güvenli alan.

## Final render

```bash
# Standart yüksek kalite (YouTube / sosyal medya)
npx remotion render Main out/video.mp4 --codec=h264 --crf=18 --image-format=jpeg --jpeg-quality=95

# Çok yüksek kalite / arşiv
npx remotion render Main out/video.mp4 --codec=h264 --crf=12 --image-format=png

# 4K'ya ölçekleme (1080p kompozisyondan)
npx remotion render Main out/video-4k.mp4 --scale=2 --crf=18

# Şeffaf arka plan (overlay / lower-third)
npx remotion render Main out/overlay.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le

# Daha verimli dosya (modern platformlar)
npx remotion render Main out/video.mp4 --codec=h265 --crf=20

# Props ile render (aynı şablonla farklı içerik)
npx remotion render Main out/video.mp4 --props='{"title":"Yeni Ürün","accent":"#E11D48"}'
# veya: --props=./props.json

# Sadece bir aralık
npx remotion render Main out/part.mp4 --frames=0-89

# GIF
npx remotion render Main out/anim.gif --codec=gif --every-nth-frame=2
```

## Ayar rehberi

| Ayar                 | Öneri                       | Açıklama                                   |
|----------------------|-----------------------------|--------------------------------------------|
| `--codec`            | `h264`                      | En uyumlu. `h265` daha küçük, `prores` kurgu/şeffaflık |
| `--crf`              | 16–20                       | Düşük = daha kaliteli & büyük dosya (h264 varsayılan 18) |
| `--image-format`     | `jpeg` (hız) / `png` (keskin grafik, şeffaflık) | Kare yakalama formatı |
| `--jpeg-quality`     | 90–100                      | jpeg kullanılıyorsa                        |
| `--scale`            | 1 veya 2                    | Çözünürlük çarpanı                         |
| `--concurrency`      | CPU sayısı / 2 civarı       | Paralel kare render                        |
| `--audio-bitrate`    | `320k`                      | Müzik ağırlıklı içerikte                   |
| `--pixel-format`     | `yuv420p`                   | Maksimum oynatıcı uyumluluğu (varsayılan)  |

Keskin metin/grafik ağırlıklı videolarda `--image-format=png` + `--crf=16` banding ve
bulanık kenarları azaltır.

## Bu ortama özel

- Tarayıcı indirme hatası alırsan: `--browser-executable=/opt/pw-browsers/chromium`
- `remotion.config.ts` içinde kalıcı ayarlar:

```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCrf(18);
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
// Config.setBrowserExecutable("/opt/pw-browsers/chromium");
```

## Çıktı yönetimi

- Çıktıları `out/` klasörüne yaz ve `out/`'u `.gitignore`'a ekle (büyük dosyaları commit etme).
- Render bitince `video-quality-check` skill'ini çalıştır.
- Kullanıcıya göndermek için SendUserFile aracıyla `out/video.mp4` dosyasını paylaş.

## Hata giderme

- **Boş/siyah kareler**: medya yüklenmeden çekilmiş — `<Img>`/`<OffthreadVideo>` kullan,
  async veride `delayRender` ekle.
- **Titreme**: CSS animasyonu, `Math.random()` veya `Date.now()` kullanılmış — kareye bağla.
- **Font yanlış**: `loadFont` çağrısı yok veya alt küme (latin-ext) eksik.
- **`delayRender` timeout**: `continueRender` çağrılmıyor ya da URL erişilemez;
  `--timeout=60000` ile süreyi uzatabilirsin ama asıl nedeni düzelt.
- **Ses yok**: dosya yolu `staticFile` ile verilmiş mi, `volume` 0 değil mi, `ffprobe` ile kontrol et.

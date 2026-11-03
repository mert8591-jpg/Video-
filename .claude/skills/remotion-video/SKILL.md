---
name: remotion-video
description: Remotion (React) ile kod tabanlı, yüksek kaliteli video üretimi. Kullanıcı video, animasyon, intro/outro, reklam, sosyal medya klibi (Reels/Shorts/TikTok), altyazılı video, kinetik tipografi veya "video yap / video oluştur / render al" istediğinde kullan. Proje kurulumu, kompozisyon yapısı, animasyon, ses, font, geçişler ve yüksek kalite render ayarlarını kapsar. Triggers: video, remotion, animation, render, mp4, reels, shorts, intro.
---

# Remotion ile Kaliteli Video Üretimi

Bu skill, Remotion kullanarak React kodundan profesyonel kalitede video üretmek için
izlenecek yolu anlatır. Ayrıntılar için `references/` altındaki dosyalara bak:

- `references/animation.md` — interpolate, spring, easing, zamanlama kalıpları
- `references/assets-audio-fonts.md` — görsel, video, ses, font kullanımı
- `references/transitions-captions.md` — sahne geçişleri ve altyazılar
- `references/rendering.md` — render komutları, codec ve kalite ayarları

Render sonrasında mutlaka `video-quality-check` skill'i ile çıktıyı doğrula.

## 1. İş akışı (her zaman bu sırayla)

1. **Brief'i netleştir**: süre, en-boy oranı (16:9 / 9:16 / 1:1), FPS, metinler, marka renkleri,
   müzik/seslendirme olup olmadığı. Belirsizse makul varsayılan seç ve kullanıcıya söyle.
2. **Sahne planı (storyboard) yaz**: her sahnenin başlangıç/bitiş karesi ve içeriği.
   Toplam kare = saniye × fps. Planı `src/storyboard.ts` gibi tek bir yerde sabit olarak tut.
3. **Projeyi kur** (yoksa) — bkz. Bölüm 2.
4. **Sahneleri ayrı bileşenler olarak yaz** (`src/scenes/Intro.tsx` vb.), `<Sequence>` /
   `<Series>` / `<TransitionSeries>` ile birleştir.
5. **Önizleme kareleri al** (`npx remotion still`) ve görsel olarak kontrol et — tam render'dan önce.
6. **Final render** al (bkz. `references/rendering.md`).
7. **Kalite kontrol** (`video-quality-check` skill'i).

## 2. Proje kurulumu

Boş bir depoda:

```bash
npx create-video@latest --yes --blank my-video   # veya etkileşimli: npx create-video@latest
cd my-video && npm install
```

Elle kurulum gerekiyorsa:

```bash
npm i remotion @remotion/cli react react-dom
npm i -D typescript @types/react
```

Standart yapı:

```
src/
  index.ts          # registerRoot(RemotionRoot)
  Root.tsx          # <Composition> tanımları
  storyboard.ts     # sahne süreleri, renkler, metinler (tek kaynak)
  scenes/           # her sahne ayrı bileşen
  components/       # tekrar kullanılan parçalar (Title, LowerThird, Logo...)
public/             # görsel, ses, font dosyaları (staticFile() ile erişilir)
remotion.config.ts
```

**Bu bulut ortamında**: Chromium `/opt/pw-browsers/chromium` yolunda hazır. Remotion kendi
headless tarayıcısını indiremezse render/still komutlarına
`--browser-executable=/opt/pw-browsers/chromium` ekle.

## 3. Temel yapı

```tsx
// src/index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { Main, mainSchema } from "./Main";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={30 * 15}   // 15 sn @ 30fps
      fps={30}
      width={1920}
      height={1080}
      schema={mainSchema}          // zod ile props doğrulama (opsiyonel, önerilir)
      defaultProps={{ title: "Merhaba", accent: "#4F46E5" }}
    />
    <Composition id="Vertical" component={Main} durationInFrames={450}
      fps={30} width={1080} height={1920}
      defaultProps={{ title: "Merhaba", accent: "#4F46E5" }} />
  </>
);
```

```tsx
// src/Main.tsx
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { z } from "zod";

export const mainSchema = z.object({ title: z.string(), accent: z.string() });

export const Main: React.FC<z.infer<typeof mainSchema>> = ({ title, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0B12", justifyContent: "center", alignItems: "center" }}>
      <Sequence from={0} durationInFrames={120} premountFor={30}>
        <h1 style={{ color: "white", fontSize: 140, opacity,
                     transform: `translateY(${(1 - enter) * 60}px)` }}>
          {title}
        </h1>
      </Sequence>
    </AbsoluteFill>
  );
};
```

## 4. Altın kurallar (kaliteyi belirleyenler)

- **Her şey kareye bağlı olmalı.** Animasyonu yalnızca `useCurrentFrame()` ile hesapla.
  CSS `transition`/`animation`, `setTimeout`, `requestAnimationFrame`, `Math.random()`
  YASAK — render'da titreme ve tutarsızlık yaratır. Rastgelelik için `random("seed")` kullan.
- **interpolate'te her zaman clamp**: `{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }`
  yoksa değerler aralık dışına taşar.
- **Lineer hareketten kaçın**: girişlerde `spring()` veya `Easing.bezier(...)` kullan.
  Profesyonel his = yumuşak giriş/çıkış + kısa bekleme + düzgün çıkış.
- **Medya için Remotion bileşenleri**: `<Img>`, `<OffthreadVideo>`, `<Audio>` ve `staticFile()`.
  Düz `<img>`/`<video>` kullanma — render'da kareler yüklenmeden çekilebilir.
- **Asenkron veri**: `delayRender()` / `continueRender()` ya da `calculateMetadata` kullan.
- **Güvenli alan**: metinleri kenarlardan en az %5 içeride tut; 9:16'da üstte/altta
  platform arayüzü için ~%12 boşluk bırak.
- **Okunabilirlik**: 1080p'de gövde metni ≥ 48px, başlık ≥ 96px; metin ekranda
  en az (kelime sayısı × 0.3 sn + 1 sn) kalsın. Arka planla yüksek kontrast.
- **Tutarlılık**: renkler, fontlar, süreler `storyboard.ts`'te sabit; sihirli sayı dağıtma.
- **Sahneleri izole et**: her sahne kendi `<Sequence>`'ı içinde 0'dan başlayan yerel kare
  sayar; sahne bileşenleri global zamanı bilmemeli.
- **Fontu yükle**: `@remotion/google-fonts` veya `loadFont` ile — sistem fontuna güvenme.

## 5. Sık kullanılan formatlar

| Kullanım             | Boyut      | FPS | Not                              |
|----------------------|------------|-----|----------------------------------|
| YouTube / yatay      | 1920×1080  | 30  | 4K için `--scale=2` (bkz. Bölüm 7) |
| Reels/Shorts/TikTok  | 1080×1920  | 30  | Üst/alt güvenli alan bırak       |
| Instagram kare       | 1080×1080  | 30  |                                  |
| Akıcı hareket/oyun   | 1920×1080  | 60  | Render süresi 2 kat              |

## 6. Komutlar

```bash
npx remotion studio                                   # canlı önizleme (tarayıcı)
npx remotion compositions                             # kompozisyonları listele
npx remotion still Main out/frame-60.png --frame=60   # tek kare önizleme
npx remotion render Main out/video.mp4 --codec=h264 --crf=18   # kaliteli final
```

Render ayrıntıları ve kalite ayarları: `references/rendering.md`.

## 7. 4K video

Kompozisyonu **1920×1080 (dikeyde 1080×1920)** olarak tasarla, render'da `--scale=2` ver.
Böylece tüm ölçüler 1080p'ye göre yazılır, çıktı 3840×2160 olur. Metin ve vektörler
gerçekten keskin çıkar, çünkü tarayıcı 2 kat piksel yoğunluğunda çizer.

```bash
npx remotion render Main out/video-4k.mp4 --scale=2 --codec=h264 --crf=16 \
  --image-format=png --audio-bitrate=320k
```

4K'nın gerçekten keskin görünmesi için:
- **Görseller ve videolar en az 3840 px genişliğinde olmalı.** Düşük çözünürlüklü fotoğraf
  4K'da bulanık görünür. Kullanıcının verdiği görsel küçükse bunu ona söyle.
- **Vektör kullan**: logo ve ikonlar SVG olsun, PNG değil.
- **İnce çizgilerden kaçın**: 1 px çizgiler titreyebilir, en az 2 px kullan.
- **Gradyanlarda banding**: `--crf=16` ve hafif grain/noise dokusu kullan.
- **Önce 1080p taslak al** (`--scale=1`, hızlı), beğenilince 4K final render'ı al.
  4K render 1080p'ye göre yaklaşık 3–4 kat uzun sürer.
- Doğrulama: `ffprobe` ile 3840×2160 olduğunu kontrol et (`video-quality-check`).
- Dosya büyük olur (30 sn ≈ 100–300 MB). Paylaşım için gerekirse
  `--codec=h265 --crf=20` ile daha küçük bir kopya da çıkar.

## 8. Tasarım kalitesi

Görsel yön (renk, font, kompozisyon) belirlerken `frontend-design` skill'indeki
ilkeleri uygula: konuya özgü, şablon gibi durmayan tercihler; tek bir akılda kalan an;
sade ve disiplinli geri kalan her şey. Kullanıcının renk tercihi yoksa `theme-factory`
skill'indeki hazır temalardan birini öner (`theme-showcase.pdf` dosyasını göster ve seçtir).
Her sahnede önce still alıp görsel olarak eleştir, sonra devam et.

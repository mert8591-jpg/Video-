# Görsel, Video, Ses ve Fontlar

## Dosyalar

Tüm yerel dosyaları `public/` klasörüne koy ve `staticFile()` ile çağır:

```tsx
import { Img, OffthreadVideo, Audio, staticFile } from "remotion";

<Img src={staticFile("logo.png")} />
<OffthreadVideo src={staticFile("broll.mp4")} />          // render'da kare-doğru
<Audio src={staticFile("music.mp3")} volume={0.6} />
```

- Görseller: PNG (şeffaflık/grafik), JPG (fotoğraf). Çözünürlük en az hedef boyut kadar.
- Videoyu kırp: `<OffthreadVideo src={...} startFrom={60} endAt={240} />`
  (Remotion sürümüne göre `trimBefore`/`trimAfter` adlarıyla da geçebilir — kurulu sürüme bak).
- Uzaktan URL kullanılıyorsa CORS ve erişilebilirliği kontrol et; mümkünse indirip `public/`'e koy.

## Ses

```tsx
// Ses seviyesini kareye göre değiştir (fade in/out)
<Audio
  src={staticFile("music.mp3")}
  volume={(f) =>
    interpolate(f, [0, 30, durationInFrames - 45, durationInFrames], [0, 0.6, 0.6, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  }
/>

// Seslendirme varken müziği kıs (ducking)
<Audio src={staticFile("music.mp3")} volume={0.15} />
<Sequence from={30}><Audio src={staticFile("voiceover.mp3")} volume={1} /></Sequence>
```

- Müzik -18 / -14 LUFS civarında olmalı; seslendirme müzikten belirgin yüksek.
- Ses süresini öğrenip kompozisyon süresini ona göre ayarlamak için
  `calculateMetadata` + `@remotion/media-utils` (`getAudioDurationInSeconds`) kullan.
- Telif: kullanıcıya ait veya lisanslı müzik kullan; telifli müzik indirme.

## Fontlar

Google Fonts (önerilen):

```bash
npm i @remotion/google-fonts
```

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
// Türkçe karakterler (ğ, ş, ı, İ) için "latin-ext" alt kümesini dahil et!
<div style={{ fontFamily }}>Çağrı İşığı</div>
```

Yerel font:

```bash
npm i @remotion/fonts
```

```tsx
import { loadFont } from "@remotion/fonts";
loadFont({ family: "Brand", url: staticFile("fonts/Brand-Bold.woff2"), weight: "700" });
```

Önerilen eşleşmeler: başlık `Montserrat`/`Poppins`/`Inter Tight` 800–900,
gövde `Inter` 400–600. Bir videoda en fazla 2 font ailesi.

## Renk ve görünüm

- Bir ana renk + bir vurgu rengi + nötrler. Paleti `storyboard.ts`'te tut.
- Düz siyah yerine çok koyu lacivert/gri (#0B0B12 gibi) daha sinematik durur.
- Hafif gradyan ve ince grain/vignette derinlik katar; abartma.
- Metin gölgesi gerekiyorsa yumuşak: `textShadow: "0 4px 24px rgba(0,0,0,0.35)"`.

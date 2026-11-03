# Geçişler ve Altyazılar

## Sahne sıralama

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={90}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={120}><Features /></Series.Sequence>
  <Series.Sequence durationInFrames={90}><Outro /></Series.Sequence>
</Series>
```

## Geçişler (@remotion/transitions)

```bash
npm i @remotion/transitions
```

```tsx
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}><Intro /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={120}><Features /></TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide({ direction: "from-right" })}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}><Outro /></TransitionSeries.Sequence>
</TransitionSeries>
```

**Dikkat**: geçişler sahneleri üst üste bindirir, toplam süre kısalır:
`toplam = sahne süreleri toplamı − geçiş süreleri toplamı`. Kompozisyon süresini buna göre ayarla.

Geçiş seçimi: aynı konudaki sahneler arasında `fade`; yeni bölüm/konu için `slide` veya `wipe`.
Bir videoda 1–2 geçiş türüyle sınırlı kal.

## Altyazılar

Altyazı verisi (JSON) formatı:

```ts
type Caption = { text: string; startMs: number; endMs: number; timestampMs: number | null; confidence: number | null };
```

Ses dosyasından altyazı üretmek için `@remotion/install-whisper-cpp`
(`transcribe` + `toCaptions`) kullanılabilir; ya da kullanıcı SRT verirse
`@remotion/captions` içindeki `parseSrt` ile oku.

TikTok tarzı kelime kelime vurgulu altyazı:

```tsx
import { createTikTokStyleCaptions } from "@remotion/captions";

const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200, // bir sayfada ne kadar metin
});

// Her sayfayı kendi Sequence'ında göster
{pages.map((page, i) => {
  const from = Math.round((page.startMs / 1000) * fps);
  const next = pages[i + 1];
  const to = next ? Math.round((next.startMs / 1000) * fps) : from + Math.round(fps * 1.5);
  return (
    <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
      <CaptionPage page={page} />
    </Sequence>
  );
})}
```

`CaptionPage` içinde `page.tokens` üzerinde dön; aktif token'ı
(`fromMs <= şimdikiMs < toMs`) vurgu rengiyle ve hafif `scale` ile göster.

Altyazı stili:
- Kalın font (800–900), 1080p'de 64–90px, beyaz + koyu kontur
  (`WebkitTextStroke: "3px black"` veya çoklu textShadow).
- 9:16'da ekranın alt üçte birinin hemen üstüne, ortalı yerleştir.
- Aynı anda en fazla 2 satır / ~6 kelime.

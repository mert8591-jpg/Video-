// Videonun tüm ayarları tek yerde.

export const FPS = 30;
export const SECONDS = 13;
export const DURATION = FPS * SECONDS; // 390 kare; son kare ilk kareye kusursuz bağlanır
export const WIDTH = 1080; // Instagram Reels 9:16
export const HEIGHT = 1920;

// Renkler: canlı, doygun pembe ve su yeşili (doğrusal ışık değerleri, 0..1)
export const PINK: [number, number, number] = [1.0, 0.16, 0.58];
export const AQUA: [number, number, number] = [0.02, 0.92, 0.78];
export const GLOW: [number, number, number] = [0.95, 0.55, 0.9]; // tünelin sonundaki parlak pus

// Şimşek çizgisi renkleri
export const BOLT_CORE = "#FFFFFF";
export const BOLT_GLOW = "#F3E2FF";

// Uçuş ve kamera
export const SPEED = 9; // dünya birimi / sn, dümdüz ileri
export const ROT_SPEED = 0.2; // radyan / sn (~11°/sn): bulutlar etrafımızda yavaşça döner
export const FOV = 1.1; // shader görüş açısı çarpanı
// Bulutların hesaplandığı çözünürlük oranı (1 = çıktı çözünürlüğü). Şimşek çizgileri her zaman tam çözünürlükte.
export const CLOUD_RES = 0.5;

// Şimşekler: zaman (sn), açı (radyan), yarıçap ve önümüzdeki mesafe
export type Strike = { t: number; angle: number; radius: number; ahead: number; seed: number; power: number };

export const STRIKES: Strike[] = [
  { t: 1.4, angle: -0.9, radius: 6, ahead: 38, seed: 11, power: 1.0 },
  { t: 4.3, angle: 2.3, radius: 7, ahead: 45, seed: 23, power: 0.8 },
  { t: 6.9, angle: 0.4, radius: 5, ahead: 32, seed: 37, power: 1.0 },
  { t: 8.6, angle: -2.6, radius: 8, ahead: 50, seed: 41, power: 0.7 },
];

// Gök gürültüsü sesi şimşekten bu kadar sonra başlar (sn)
export const THUNDER_DELAY = [0.35, 0.8, 0.25, 1.0];

// ───────────────────────────────────────────────────────────────
// SAFRAN videosu (kompozisyon: "Saffron") — 1080x1920, 30 fps, 45 sn
// ───────────────────────────────────────────────────────────────

export const SAF_FPS = 30;
export const SAF_SECONDS = 45;
export const SAF_DURATION = SAF_FPS * SAF_SECONDS; // 1350 kare

// Seslendirme %7 hızlandırıldı (47.5 sn -> 44.4 sn) ve 0.3 sn gecikmeyle başlar.
export const VO_TEMPO = 1.07;
export const VO_OFFSET = 0.3;
/** Orijinal kayıttaki zamanı (sn) videodaki zamana çevirir. */
export const vo = (orig: number) => orig / VO_TEMPO + VO_OFFSET;
export const MUSIC_VOLUME = 0.13; // seslendirmenin belirgin şekilde altında

export const SAF_COLORS = {
  saffron: "#E3301C", // safran kırmızısı
  gold: "#F6B93B", // stamen sarısı
  crocus: "#A77BE0", // çiçek moru
  ink: "#0E0A12",
  white: "#FFFFFF",
};
export const SAF_FONT = "Montserrat";

// Kullanıcının görselleri (public/saffron) ve doğal boyutları
export const IMAGES = {
  macro: { src: "saffron/macro.jpg", w: 506, h: 900 },
  bulb: { src: "saffron/bulb.jpg", w: 415, h: 739 },
  farm: { src: "saffron/farm.jpg", w: 800, h: 500 },
  hand: { src: "saffron/hand.jpg", w: 1400, h: 1400 },
  bowl: { src: "saffron/bowl.jpg", w: 700, h: 467 },
} as const;
export type ImageKey = keyof typeof IMAGES;

// Seslendirme cümleleri: orijinal kayıttaki başlangıç/bitiş (sessizlik analizinden).
// showSub=false: aynı metin ekranda büyük başlık olarak duruyorsa altyazı gizlenir.
export const VO_LINES: { t0: number; t1: number; text: string; showSub?: boolean }[] = [
  { t0: 0.0, t1: 2.26, text: "Sizce safran yetiştirmek mantıklı mı?", showSub: false },
  { t0: 2.85, t1: 5.9, text: "Dünyanın en değerli baharatlarından biri olan safran," },
  { t0: 6.18, t1: 8.4, text: "tarımda dikkat çeken alternatiflerden biri." },
  { t0: 8.95, t1: 13.29, text: "Peki, bu mor çiçeklerin içinden çıkan kırmızı iplikler nasıl elde ediliyor?" },
  { t0: 13.89, t1: 16.24, text: "Safran, özel soğanlarıyla yetiştiriliyor." },
  { t0: 16.67, t1: 22.32, text: "Sonbaharda çiçek açıyor ve hasat zamanı geldiğinde çiçekler tek tek elle toplanıyor." },
  { t0: 22.88, t1: 25.33, text: "Asıl dikkat çekici nokta ise hasat süreci." },
  { t0: 25.79, t1: 27.6, text: "Çünkü safranın değerli kısmı," },
  { t0: 27.87, t1: 30.61, text: "her çiçeğin içindeki ince kırmızı tepecikler." },
  { t0: 31.16, t1: 34.16, text: "Ancak yüksek değeri, kolay kazanç anlamına gelmiyor." },
  { t0: 34.68, t1: 36.16, text: "Üretim için uygun toprak," },
  { t0: 36.43, t1: 37.15, text: "doğru bakım," },
  { t0: 37.44, t1: 40.0, text: "yoğun el emeği ve satış pazarı gerekiyor." },
  { t0: 40.62, t1: 43.93, text: "Peki sizce safran yetiştiriciliğine girmek mantıklı mı?" },
  { t0: 44.46, t1: 45.87, text: "Siz olsanız dener miydiniz?" },
  { t0: 46.3, t1: 47.28, text: "Yorumlarda buluşalım!", showSub: false },
];

// Kamera planları (video saniyesi). from/to: odak noktası (görselde 0..1) ve yakınlık.
export type Cam = { x: number; y: number; zoom: number };
export type Shot = { img: ImageKey; start: number; end: number; from: Cam; to: Cam; note: string };
export const XFADE = 0.5; // çapraz geçiş süresi (sn)

export const SHOTS: Shot[] = [
  { img: "macro", start: 0, end: 5.9, from: { x: 0.5, y: 0.45, zoom: 1.0 }, to: { x: 0.5, y: 0.38, zoom: 1.22 }, note: "Kanca: makro çiçek, yavaş zoom" },
  { img: "farm", start: 5.9, end: 8.45, from: { x: 0.18, y: 0.4, zoom: 1.0 }, to: { x: 0.42, y: 0.4, zoom: 1.08 }, note: "Tarım alternatifi: yetiştirme rafları, pan" },
  { img: "macro", start: 8.45, end: 13.0, from: { x: 0.3, y: 0.62, zoom: 1.35 }, to: { x: 0.55, y: 0.27, zoom: 1.75 }, note: "Mor yapraktan kırmızı ipliklere kayış" },
  { img: "bulb", start: 13.0, end: 15.75, from: { x: 0.5, y: 0.78, zoom: 1.7 }, to: { x: 0.5, y: 0.5, zoom: 1.0 }, note: "Soğan: yumrudan geri çekilip tüm bitkiyi göster" },
  { img: "farm", start: 15.75, end: 18.6, from: { x: 0.3, y: 0.3, zoom: 1.45 }, to: { x: 0.22, y: 0.38, zoom: 1.15 }, note: "Sonbaharda çiçeklenme" },
  { img: "hand", start: 18.6, end: 21.45, from: { x: 0.5, y: 0.5, zoom: 1.0 }, to: { x: 0.48, y: 0.56, zoom: 1.15 }, note: "Elle toplama" },
  { img: "macro", start: 21.45, end: 26.2, from: { x: 0.45, y: 0.32, zoom: 2.0 }, to: { x: 0.62, y: 0.24, zoom: 2.35 }, note: "Hasat: stigma ekstrem yakın plan" },
  { img: "hand", start: 26.2, end: 29.2, from: { x: 0.5, y: 0.55, zoom: 1.35 }, to: { x: 0.5, y: 0.58, zoom: 1.75 }, note: "İnce kırmızı tepecikler" },
  { img: "bowl", start: 29.2, end: 32.55, from: { x: 0.75, y: 0.45, zoom: 1.15 }, to: { x: 0.52, y: 0.45, zoom: 1.0 }, note: "Kurutulmuş ürün" },
  { img: "farm", start: 32.55, end: 37.95, from: { x: 0.3, y: 0.78, zoom: 1.6 }, to: { x: 0.4, y: 0.5, zoom: 1.0 }, note: "Toprak, bakım, emek: köklerden geri çekil" },
  { img: "bowl", start: 37.95, end: 41.6, from: { x: 0.22, y: 0.47, zoom: 1.3 }, to: { x: 0.35, y: 0.47, zoom: 1.0 }, note: "Soru: çiçek + ürün" },
  { img: "macro", start: 41.6, end: 45, from: { x: 0.5, y: 0.42, zoom: 1.35 }, to: { x: 0.5, y: 0.5, zoom: 1.0 }, note: "Final: makro çiçek, zoom-out" },
];

// Büyük ekran metinleri (video saniyesi)
export const HOOK = { start: 0.15, end: 5.55, lines: ["SAFRAN", "YETİŞTİRMEK", "MANTIKLI MI?"] };
export const OUTRO_Q = { start: vo(40.62) - 0.1, text: "SİZCE\nYAPILIR MI?" };
export const OUTRO_CTA = { start: vo(44.46) - 0.2, text: "YORUMLARDA BULUŞALIM!" };
// Üretim gereksinimleri: seslendirmede söylendiği an beliren etiketler
export const NEEDS = [
  { t: vo(34.68) + 0.4, label: "UYGUN TOPRAK" },
  { t: vo(36.43), label: "DOĞRU BAKIM" },
  { t: vo(37.44) + 0.2, label: "EL EMEĞİ" },
  { t: vo(38.6), label: "SATIŞ PAZARI" },
];
export const NEEDS_END = 37.95;

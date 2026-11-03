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

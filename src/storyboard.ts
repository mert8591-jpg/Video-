// Videonun tüm ayarları tek yerde.

export const FPS = 30;
export const SECONDS = 13;
export const DURATION = FPS * SECONDS; // 390 kare; son kare ilk kareye kusursuz bağlanır
export const WIDTH = 1080; // Instagram Reels 9:16
export const HEIGHT = 1920;

// Renkler: pembe ve su yeşili
export type Palette = { hi: string; mid: string; low: string; shadow: string };

export const PINK: Palette = {
  hi: "#FFE3F1",
  mid: "#F59AC8",
  low: "#C25A97",
  shadow: "#5E2650",
};

export const AQUA: Palette = {
  hi: "#DFFFF7",
  mid: "#6FE0CB",
  low: "#2E9E98",
  shadow: "#143F4C",
};

// Bulutların arasındaki derinlik sisi (gökyüzü yok, sadece bulut derinliği)
export const FOG_FAR = "#5A5C94";
export const FOG_HAZE = "#C4BDEB"; // uzaktaki bulutların karıştığı parlak pus
export const FOG_GLOW_PINK = "#F7A8D2";
export const FOG_GLOW_AQUA = "#7FE6D4";

// Şimşek renkleri
export const BOLT_CORE = "#FFFFFF";
export const BOLT_GLOW = "#E9D7FF";

// Uçuş
export const TUNNEL_LENGTH = 140; // döngü başına kat edilen mesafe (dünya birimi)
export const TWIST = 0.022; // derinliğe bağlı dönüş (radyan / birim) -> bulutlar etrafımızda döner
export const FOCAL = 950;

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

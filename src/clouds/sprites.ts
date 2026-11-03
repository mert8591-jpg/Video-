// Kabarık (karnabahar dokulu) bulut parçalarını bir kez çizip önbelleğe alır.
import { AQUA, BOLT_GLOW, PINK, Palette } from "../storyboard";

export const SPRITE_SIZE = 640;
export const SHAPES = 8;

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Circle = { x: number; y: number; r: number };

const makeShape = (seed: number): Circle[] => {
  const rng = mulberry32(seed);
  const S = SPRITE_SIZE;
  const lobes: Circle[] = [];
  const lobeCount = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < lobeCount; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * S * 0.14;
    lobes.push({ x: S / 2 + Math.cos(a) * d, y: S / 2 + Math.sin(a) * d * 0.8, r: S * (0.12 + rng() * 0.08) });
  }
  const out: Circle[] = [...lobes];
  // Üç kademe kabarcık: büyük -> orta -> küçük (karnabahar dokusu)
  const levels = [
    { count: 110, min: 0.045, max: 0.08, reach: [0.6, 0.98] },
    { count: 160, min: 0.022, max: 0.04, reach: [0.75, 1.02] },
    { count: 120, min: 0.012, max: 0.022, reach: [0.85, 1.05] },
  ];
  for (const lv of levels) {
    for (let i = 0; i < lv.count; i++) {
      const base = out[Math.floor(rng() * out.length)];
      if (base.r < S * lv.min * 1.2) continue;
      const a = rng() * Math.PI * 2;
      const k = lv.reach[0] + rng() * (lv.reach[1] - lv.reach[0]);
      const x = base.x + Math.cos(a) * base.r * k;
      const y = base.y + Math.sin(a) * base.r * k;
      const r = S * (lv.min + rng() * (lv.max - lv.min));
      if (x - r < 4 || y - r < 4 || x + r > S - 4 || y + r > S - 4) continue;
      out.push({ x, y, r });
    }
  }
  return out;
};

// Yumuşak yoğunluk haritası + ışık yönünde örnekleme ile gölgelendirme.
// Sonuç: sert küre değil, kenarları yumuşak, içi kabarık dokulu bulut.
const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Yükseklik haritası: her kabarcık bir kubbe. Büyük loblar "max" ile birleşir (kıvrımlar oluşur),
// küçük kabarcıklar üstüne eklenir (karnabahar dokusu).
const boxBlur = (src: Float32Array, S: number, r: number) => {
  const tmp = new Float32Array(S * S);
  const out = new Float32Array(S * S);
  const w = 2 * r + 1;
  for (let y = 0; y < S; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * S + Math.min(S - 1, Math.max(0, x))];
    for (let x = 0; x < S; x++) {
      tmp[y * S + x] = acc / w;
      acc += src[y * S + Math.min(S - 1, x + r + 1)] - src[y * S + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < S; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(S - 1, Math.max(0, y)) * S + x];
    for (let y = 0; y < S; y++) {
      out[y * S + x] = acc / w;
      acc += tmp[Math.min(S - 1, y + r + 1) * S + x] - tmp[Math.max(0, y - r) * S + x];
    }
  }
  return out;
};

const heightOf = (shape: Circle[]) => {
  const S = SPRITE_SIZE;
  const base = new Float32Array(S * S);
  const add = new Float32Array(S * S);
  const big = S * 0.07;
  for (const c of shape) {
    const x0 = Math.max(0, Math.floor(c.x - c.r));
    const x1 = Math.min(S - 1, Math.ceil(c.x + c.r));
    const y0 = Math.max(0, Math.floor(c.y - c.r));
    const y1 = Math.min(S - 1, Math.ceil(c.y + c.r));
    const r2 = c.r * c.r;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d2 = (x - c.x) ** 2 + (y - c.y) ** 2;
        if (d2 >= r2) continue;
        const h = Math.sqrt(r2 - d2);
        const i = y * S + x;
        if (c.r >= big) {
          if (h > base[i]) base[i] = h;
        } else {
          add[i] += h * 0.55;
        }
      }
    }
  }
  let H = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) H[i] = base[i] > 0 ? base[i] + add[i] * 0.6 : add[i] * 0.5;
  // Yumuşatma: buhar gibi yumuşak yüzey (iki geçişli kutu bulanıklığı)
  for (let pass = 0; pass < 2; pass++) H = boxBlur(H, S, 3);
  return H;
};

const drawCloud = (ctx: CanvasRenderingContext2D, H: Float32Array, pal: Palette) => {
  const S = SPRITE_SIZE;
  const stops = [pal.shadow, pal.low, pal.mid, pal.hi].map(hexToRgb);
  let maxH = 0;
  for (const v of H) maxH = Math.max(maxH, v);
  const img = ctx.createImageData(S, S);
  // Işık yönü (sol üst, biraz önden)
  const L = [-0.45, -0.7, 0.55];
  const ln = Math.hypot(L[0], L[1], L[2]);
  const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
  const edge = S * 0.07;
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      const h = H[i];
      if (h <= 0) continue;
      const a = Math.min(1, h / edge);
      const dx = (H[i + 1] - H[i - 1]) * 0.28;
      const dy = (H[i + S] - H[i - S]) * 0.28;
      const nl = Math.hypot(dx, dy, 1);
      const diffuse = Math.max(0, (-dx * lx - dy * ly + lz) / nl);
      // Kıvrımlarda (düşük yükseklik) ortam gölgesi
      const ao = 0.7 + 0.3 * Math.min(1, h / (maxH * 0.5));
      let s = (0.22 + 0.85 * diffuse) * ao;
      s = Math.min(1, Math.max(0, s));
      const f = s * 3;
      const i0 = Math.min(2, Math.floor(f));
      const t = f - i0;
      const A = stops[i0];
      const B = stops[i0 + 1];
      const o = i * 4;
      img.data[o] = A[0] + (B[0] - A[0]) * t;
      img.data[o + 1] = A[1] + (B[1] - A[1]) * t;
      img.data[o + 2] = A[2] + (B[2] - A[2]) * t;
      img.data[o + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
};

function newCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export type SpriteBank = {
  pink: HTMLCanvasElement[];
  aqua: HTMLCanvasElement[];
  glow: HTMLCanvasElement;
};

let bank: SpriteBank | null = null;

export const getSprites = (): SpriteBank => {
  if (bank) return bank;
  const pink: HTMLCanvasElement[] = [];
  const aqua: HTMLCanvasElement[] = [];
  for (let i = 0; i < SHAPES; i++) {
    const D = heightOf(makeShape(1000 + i * 77));
    for (const [pal, list] of [
      [PINK, pink],
      [AQUA, aqua],
    ] as const) {
      const c = newCanvas(SPRITE_SIZE, SPRITE_SIZE);
      drawCloud(c.getContext("2d")!, D, pal);
      list.push(c);
    }
  }
  // Şimşeğin bulut içindeki parlaması
  const glow = newCanvas(512, 512);
  const g = glow.getContext("2d")!;
  const rg = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  rg.addColorStop(0, "rgba(255,255,255,1)");
  rg.addColorStop(0.2, BOLT_GLOW + "cc");
  rg.addColorStop(0.55, BOLT_GLOW + "33");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 512, 512);
  bank = { pink, aqua, glow };
  return bank;
};

// Sprite içindeki ışık yönü (sol üst). Çizerken bu yön tünelin merkezine çevrilir.
export const SPRITE_LIGHT_ANGLE = Math.atan2(-0.7, -0.45);

export { mulberry32 };

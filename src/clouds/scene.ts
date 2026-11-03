// Bulut tüneli ve şimşeklerin, kareye bağlı (deterministik) hesapları.
import { DURATION, FPS, STRIKES, Strike, TUNNEL_LENGTH, TWIST } from "../storyboard";
import { mulberry32, SHAPES } from "./sprites";

export type Puff = {
  angle0: number;
  radius: number;
  z0: number;
  size: number;
  shape: number;
  aqua: boolean;
  spin: number;
};

const PUFF_COUNT = 900;
const SPEED = TUNNEL_LENGTH / (DURATION / FPS); // döngü tam 13 sn'de kapanır

export const makePuffs = (): Puff[] => {
  const rng = mulberry32(4242);
  const puffs: Puff[] = [];
  for (let i = 0; i < PUFF_COUNT; i++) {
    const angle0 = rng() * Math.PI * 2;
    // Kameranın yolunu açık bırak, etrafı tamamen bulutla doldur
    const radius = 3.6 + Math.pow(rng(), 0.7) * 11;
    const z0 = rng() * TUNNEL_LENGTH;
    // Renk bölgeleri: açıya bağlı yumuşak pembe / su yeşili kuşaklar (dönüşle birlikte döner)
    const field = Math.sin(angle0 * 2 + 0.7) + 0.55 * Math.sin(z0 * 0.09 + angle0 * 3) + (rng() - 0.5) * 0.9;
    puffs.push({
      angle0,
      radius,
      z0,
      size: 1.8 + rng() * 2.6 + radius * 0.16,
      shape: Math.floor(rng() * SHAPES),
      aqua: field < 0,
      spin: rng() * Math.PI * 2,
    });
  }
  return puffs;
};

export const travelAt = (t: number) => SPEED * t;

// Döngü içinde kameraya göre derinlik (z) ve açı
export const puffState = (p: Puff, t: number) => {
  const raw = p.z0 - travelAt(t);
  const z = ((raw % TUNNEL_LENGTH) + TUNNEL_LENGTH) % TUNNEL_LENGTH + 0.6;
  const angle = p.angle0 + TWIST * z * 2.2 + 0.0; // derinliğe bağlı burulma -> yaklaşırken etrafımızda döner
  return { z, angle, x: Math.cos(angle) * p.radius, y: Math.sin(angle) * p.radius };
};

// Şimşek parlaklığı: hızlı titreşimli 2-3 çakma
export const strikeIntensity = (s: Strike, t: number) => {
  const d = t - s.t;
  if (d < 0 || d > 1.1) return 0;
  const pulses = [
    [0, 1.0],
    [0.09, 0.65],
    [0.21, 0.9],
    [0.42, 0.35],
  ];
  let v = 0;
  for (const [at, a] of pulses) {
    if (d >= at) v += a * Math.exp(-(d - at) / 0.06);
  }
  return Math.min(1.2, v) * s.power;
};

export const strikePosition = (s: Strike, t: number) => {
  const z = s.ahead - (travelAt(t) - travelAt(s.t));
  return { x: Math.cos(s.angle) * s.radius, y: Math.sin(s.angle) * s.radius, z };
};

export type Bolt = { main: [number, number][]; branches: [number, number][][] };

const jagged = (rng: () => number, ax: number, ay: number, bx: number, by: number, depth: number, rough: number) => {
  let pts: [number, number][] = [
    [ax, ay],
    [bx, by],
  ];
  for (let d = 0; d < depth; d++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const nx = -(y2 - y1) / (len || 1);
      const ny = (x2 - x1) / (len || 1);
      const off = (rng() - 0.5) * len * rough;
      next.push([(x1 + x2) / 2 + nx * off, (y1 + y2) / 2 + ny * off]);
      next.push(pts[i + 1]);
    }
    pts = next;
  }
  return pts;
};

// Dünya birimlerinde, şimşek merkezine göre dallı çizgi
export const makeBolt = (s: Strike): Bolt => {
  const rng = mulberry32(s.seed * 991);
  const dir = rng() * Math.PI * 2;
  const L = 22 + rng() * 10;
  const ax = Math.cos(dir) * -L * 0.5;
  const ay = Math.sin(dir) * -L * 0.5;
  const main = jagged(rng, ax, ay, -ax, -ay, 8, 0.5);
  const branches: [number, number][][] = [];
  const count = 9 + Math.floor(rng() * 5);
  for (let i = 0; i < count; i++) {
    const idx = 8 + Math.floor(rng() * (main.length - 16));
    const [bx, by] = main[idx];
    const a = dir + (rng() < 0.5 ? 1 : -1) * (0.4 + rng() * 0.8);
    const bl = L * (0.12 + rng() * 0.28);
    branches.push(jagged(rng, bx, by, bx + Math.cos(a) * bl, by + Math.sin(a) * bl, 6, 0.6));
  }
  return { main, branches };
};

export const BOLTS = STRIKES.map(makeBolt);

// Şimşeklerin zamanlaması, konumu ve dallı çizgileri (kareye bağlı, deterministik).
import { SPEED, STRIKES, type Strike } from "../storyboard";

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const camZ = (t: number) => SPEED * t;

// Hızlı titreşimli 3-4 çakma
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
  for (const [at, a] of pulses) if (d >= at) v += a * Math.exp(-(d - at) / 0.06);
  return Math.min(1.2, v) * s.power;
};

// Dünya konumu (çakma anında kameranın önünde, bulut duvarının içinde)
export const strikeWorld = (s: Strike) => ({
  x: Math.cos(s.angle) * s.radius,
  y: Math.sin(s.angle) * s.radius,
  z: camZ(s.t) + s.ahead,
});

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

export const makeBolt = (s: Strike): Bolt => {
  const rng = mulberry32(s.seed * 991);
  const dir = rng() * Math.PI * 2;
  const L = 22 + rng() * 10;
  const ax = Math.cos(dir) * -L * 0.5;
  const ay = Math.sin(dir) * -L * 0.5;
  const main = jagged(rng, ax, ay, -ax, -ay, 10, 0.42);
  const branches: [number, number][][] = [];
  const count = 9 + Math.floor(rng() * 5);
  for (let i = 0; i < count; i++) {
    const idx = 32 + Math.floor(rng() * (main.length - 64));
    const [bx, by] = main[idx];
    const a = dir + (rng() < 0.5 ? 1 : -1) * (0.4 + rng() * 0.8);
    const bl = L * (0.12 + rng() * 0.28);
    branches.push(jagged(rng, bx, by, bx + Math.cos(a) * bl, by + Math.sin(a) * bl, 8, 0.5));
  }
  return { main, branches };
};

export const BOLTS = STRIKES.map(makeBolt);

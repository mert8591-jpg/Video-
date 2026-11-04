// ASMR: dışı sert çikolata kabukla kaplı slime, tırnaklarla bastırılıyor.
// Kalın, dolgun ve sürekli bir "kütür kütür" kırılma: yüzlerce küçük kabuk parçası
// üst üste çatlar (orta-pes frekanslar), parmak bastırınca tok bir gövde sesi gelir,
// altından ıslak slime ezilmesi duyulur.
// Telifsiz, tamamen kodla üretilir. Çalıştır: npm run slime -> public/sfx/slime-crunch.wav
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 48000;
const TAU = Math.PI * 2;
const SECONDS = 10;
const N = SECONDS * RATE;
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 777;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const range = (a, b) => a + rnd() * (b - a);

const put = (i, v, pan) => {
  if (i < 0 || i >= N) return;
  L[i] += v * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  R[i] += v * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
};

// Tek bir kabuk parçasının kırılması: kısa gürültü + kabuğun tok rezonansı.
// Parçalar 4-20 ms sürer; frekanslar 350-2600 Hz -> ince "tık" değil, kalın "kırt".
const grain = (t, amp, pan) => {
  const start = Math.floor(t * RATE);
  const dur = range(0.004, 0.02);
  const freq = Math.exp(range(Math.log(350), Math.log(2600)));
  const ring = range(0.003, 0.009);
  const len = Math.floor((dur + ring * 4) * RATE);
  const w = (TAU * freq) / RATE;
  const r = Math.exp(-1 / (ring * RATE));
  const c1 = 2 * r * Math.cos(w);
  const c2 = -r * r;
  let y1 = 0;
  let y2 = 0;
  let lp = 0;
  const lpA = range(0.15, 0.35); // gürültüyü yumuşatır, cızırtı yerine dolgunluk
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    const env = s < dur ? Math.min(1, s / 0.0007) * Math.exp(-s / (dur * 0.4)) : 0;
    lp += lpA * ((rnd() * 2 - 1) - lp);
    const x = lp * env;
    const y = x * (1 - r) * 4 + c1 * y1 + c2 * y2;
    y2 = y1;
    y1 = y;
    put(start + k, (y * 0.9 + x * 0.5) * amp, pan);
  }
};

// Parmak/tırnak bastırınca gelen tok gövde sesi
const thump = (t, amp, pan) => {
  const start = Math.floor(t * RATE);
  const len = Math.floor(0.25 * RATE);
  let ph = 0;
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    ph += (TAU * (70 + 70 * Math.exp(-s / 0.03))) / RATE;
    lp += 0.04 * ((rnd() * 2 - 1) - lp);
    const env = Math.min(1, s / 0.003) * Math.exp(-s / 0.07);
    put(start + k, (Math.sin(ph) * 0.8 + lp * 3) * env * amp, pan);
  }
};

// Islak slime ezilmesi: boğuk, kalın, dalgalanan
const squish = (t, dur, amp, pan) => {
  const start = Math.floor(t * RATE);
  const len = Math.floor(dur * RATE);
  let a = 0;
  let b = 0;
  const ph = rnd() * TAU;
  const rate = range(3, 6);
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    const cut = 0.025 + 0.015 * Math.sin(TAU * 1.3 * s + ph); // ~200-500 Hz
    a += cut * ((rnd() * 2 - 1) - a);
    b += cut * (a - b);
    const env = Math.min(1, s / 0.15) * Math.min(1, (dur - s) / 0.3);
    const mod = 0.55 + 0.45 * Math.sin(TAU * rate * s + ph);
    put(start + k, b * 7 * env * mod * amp, pan);
  }
};

const plop = (t, amp, pan) => {
  const start = Math.floor(t * RATE);
  const f0 = range(140, 300);
  const dur = range(0.02, 0.045);
  const len = Math.floor(dur * RATE * 2);
  let ph = 0;
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    ph += (TAU * f0 * (1 + 1.2 * Math.min(1, s / dur))) / RATE;
    put(start + k, Math.sin(ph) * Math.min(1, s / 0.002) * Math.exp(-s / (dur * 0.5)) * amp, pan);
  }
};

// Bir bastırma: tok gövde + yoğun, sürekli kırılma + altında ezilme
const press = (t, { dur, density, intensity, pan }) => {
  thump(t, 0.9 * intensity, pan);
  // Kırılma yoğunluğu: hızlı yükselir, bastırma boyunca sürer, yavaşça söner
  let at = t;
  const end = t + dur;
  while (at < end) {
    const k = (at - t) / dur;
    const shape = Math.min(1, k / 0.08) * (1 - 0.6 * k);
    const rate = density * (0.25 + shape); // parça / sn
    at += -Math.log(1 - rnd()) / rate; // rastgele (Poisson) aralıklar
    // Çoğu parça orta seviyede, arada bir güçlü "kütür"
    const big = rnd() < 0.08;
    const amp = (big ? range(1.4, 2.2) : range(0.3, 1)) * (0.4 + 0.6 * shape) * intensity;
    grain(at, amp, pan + range(-0.35, 0.35));
  }
  squish(t + 0.05, dur + 0.5, 0.5 * intensity, pan);
  const pops = 3 + Math.floor(rnd() * 4);
  for (let i = 0; i < pops; i++) plop(t + range(dur * 0.3, dur + 0.4), range(0.3, 0.6) * intensity, pan + range(-0.3, 0.3));
};

// Bastırmalar arası boşluk kısa: ses kopmadan akar
press(0.3, { dur: 1.3, density: 260, intensity: 0.8, pan: -0.25 });
press(1.9, { dur: 1.5, density: 340, intensity: 1.0, pan: 0.2 });
press(3.6, { dur: 1.1, density: 300, intensity: 0.9, pan: -0.1 });
press(4.9, { dur: 1.6, density: 380, intensity: 1.0, pan: 0.25 });
press(6.7, { dur: 2.6, density: 320, intensity: 0.95, pan: -0.15 });

// Hafif sıkıştırma (sessiz parçaları biraz öne çıkarır, bozulma yapmaz) + normalize
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = 1.4;
const norm = Math.tanh(k);
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh((L[i] / peak) * k) / norm;
  R[i] = Math.tanh((R[i] / peak) * k) / norm;
}
const gain = Math.pow(10, -2 / 20);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(RATE, 24);
buf.writeUInt32LE(RATE * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - 1 - i) / (RATE * 0.4));
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * fade)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * fade)) * 32767), 46 + i * 4);
}
mkdirSync("public/sfx", { recursive: true });
writeFileSync("public/sfx/slime-crunch.wav", buf);
console.log("public/sfx/slime-crunch.wav");

// ASMR: dışı sert çikolata kabukla kaplı slime, tırnaklarla bastırılıyor.
// Kabuk çıtır çıtır kırılır (yüksek, kısa çınlamalar), iri parçalar "kütür" diye çatlar,
// altından yumuşak, ıslak slime ezilmesi ve küçük kabarcık patlamaları gelir.
// Telifsiz, tamamen kodla üretilir. Çalıştır: npm run slime -> public/sfx/slime-crunch.wav
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 48000;
const TAU = Math.PI * 2;
const SECONDS = 10;
const N = SECONDS * RATE;
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 20261104;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const range = (a, b) => a + rnd() * (b - a);

// Sese pan uygulayarak ekle (-1 sol, +1 sağ)
const put = (i, v, pan) => {
  if (i < 0 || i >= N) return;
  L[i] += v * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  R[i] += v * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
};

// Kabuk kırığı: çok kısa gürültü darbesi + rezonans (kabuğun "çınlaması")
const crack = (t, amp, freq, ringMs, pan) => {
  const start = Math.floor(t * RATE);
  const burst = Math.floor(range(0.0004, 0.002) * RATE);
  const len = burst + Math.floor((ringMs / 1000) * RATE * 5);
  const w = (TAU * freq) / RATE;
  const r = Math.exp(-1 / ((ringMs / 1000) * RATE));
  const c1 = 2 * r * Math.cos(w);
  const c2 = -r * r;
  let y1 = 0;
  let y2 = 0;
  for (let k = 0; k < len; k++) {
    const x = k < burst ? (rnd() * 2 - 1) * (1 - k / burst) : 0;
    const y = x * (1 - r) * 3 + c1 * y1 + c2 * y2;
    y2 = y1;
    y1 = y;
    put(start + k, (y * 0.8 + x * 0.35) * amp, pan);
  }
};

// Islak slime ezilmesi: boğuk, dalgalanan gürültü
const squish = (t, dur, amp, pan) => {
  const start = Math.floor(t * RATE);
  const len = Math.floor(dur * RATE);
  let a = 0;
  let b = 0;
  let wob = 0;
  const wobRate = range(5, 11);
  const ph = rnd() * TAU;
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    const n = rnd() * 2 - 1;
    const cut = 0.05 + 0.04 * Math.sin(TAU * 1.7 * s + ph); // ~400-900 Hz arası kayan boğukluk
    a += cut * (n - a);
    b += cut * (a - b);
    wob += 0.002 * ((rnd() * 2 - 1) - wob);
    const env = Math.min(1, s / 0.06) * Math.exp(-s / (dur * 0.45));
    const mod = 0.6 + 0.4 * Math.sin(TAU * wobRate * s + ph) + wob * 8;
    put(start + k, b * 4 * env * Math.max(0, mod) * amp, pan + Math.sin(TAU * 0.7 * s) * 0.15);
  }
};

// Küçük kabarcık patlaması: yukarı kayan kısa ton ("plop")
const bubble = (t, amp, pan) => {
  const start = Math.floor(t * RATE);
  const f0 = range(220, 520);
  const dur = range(0.012, 0.03);
  const len = Math.floor(dur * RATE * 2);
  let ph = 0;
  for (let k = 0; k < len; k++) {
    const s = k / RATE;
    ph += (TAU * f0 * (1 + 1.8 * Math.min(1, s / dur))) / RATE;
    put(start + k, Math.sin(ph) * Math.min(1, s / 0.0015) * Math.exp(-s / (dur * 0.5)) * amp, pan);
  }
};

// Tırnakların bir kez bastırması: önce kırık yağmuru, sonra ezilme
const press = (t, { dur, count, intensity, pan }) => {
  for (let i = 0; i < count; i++) {
    const u = rnd();
    const at = t + dur * u * u; // kırıklar başta yoğun, sonra seyrekleşir
    const fade = 1 - 0.7 * (at - t) / dur;
    // Mikro zincirler: kabuk bir noktada art arda birkaç kez çatlar
    const chain = rnd() < 0.3 ? 2 + Math.floor(rnd() * 4) : 1;
    for (let c = 0; c < chain; c++) {
      crack(at + c * range(0.0008, 0.004), range(0.25, 1) * fade * intensity, range(2400, 8000), range(1.5, 5), pan + range(-0.25, 0.25));
    }
  }
  // İri parçalar: daha pes ve uzun çınlayan "kütür"
  const big = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < big; i++) {
    const at = t + range(0, dur * 0.6);
    crack(at, range(1.2, 2) * intensity, range(700, 1600), range(6, 12), pan + range(-0.2, 0.2));
    crack(at + 0.001, range(0.6, 1) * intensity, range(3000, 5000), range(2, 4), pan);
  }
  squish(t + dur * 0.25, dur + range(0.5, 0.9), 0.55 * intensity, pan);
  const pops = 4 + Math.floor(rnd() * 6);
  for (let i = 0; i < pops; i++) bubble(t + dur * 0.4 + range(0, dur + 0.5), range(0.15, 0.4) * intensity, pan + range(-0.3, 0.3));
};

// Sahne: ilk dokunuş, birkaç bastırma, sonunda yavaş ve uzun bir ezme
press(0.4, { dur: 0.35, count: 35, intensity: 0.7, pan: -0.3 });
press(1.6, { dur: 0.5, count: 70, intensity: 1.0, pan: 0.2 });
press(3.0, { dur: 0.3, count: 40, intensity: 0.8, pan: -0.1 });
press(3.7, { dur: 0.3, count: 40, intensity: 0.85, pan: 0.35 });
press(5.0, { dur: 0.6, count: 90, intensity: 1.0, pan: 0 });
press(7.0, { dur: 1.4, count: 140, intensity: 0.9, pan: -0.15 });

// Yumuşak sıkıştırma: sessiz çıtırtıları öne çıkarır, iri kırıkları törpüler
const sat = (ch) => {
  let p = 0;
  for (const v of ch) p = Math.max(p, Math.abs(v));
  const k = 2.8;
  for (let i = 0; i < ch.length; i++) ch[i] = Math.tanh((ch[i] / (p || 1)) * k);
};
sat(L);
sat(R);

// Normalize (-4.6 dBFS; gerçek tepe -1 dBTP altında kalsın) ve 16 bit stereo WAV
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = Math.pow(10, -4.6 / 20) / (peak || 1);
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
  const fade = Math.min(1, (N - 1 - i) / (RATE * 0.3));
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * fade)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * fade)) * 32767), 46 + i * 4);
}
mkdirSync("public/sfx", { recursive: true });
writeFileSync("public/sfx/slime-crunch.wav", buf);
console.log("public/sfx/slime-crunch.wav");

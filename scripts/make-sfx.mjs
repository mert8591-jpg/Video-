// Telifsiz, kodla üretilen geçiş ve vurgu ses efektleri (internet gerekmez).
// Çalıştır: npm run sfx  -> public/sfx/*.wav  (48 kHz, 16 bit, stereo)
//
//   whoosh       hızlı geçiş, soldan sağa süpürme (1.2 sn)
//   whoosh-slow  yumuşak, uzun geçiş (2 sn)
//   riser        gerilim yükselişi, bir vuruştan önce (3 sn)
//   impact       derin vuruş: başlık / sahne açılışı (2.5 sn)
//   sub-drop     bas düşüşü, "boom" altı (2 sn)
//   swell        tersine kabaran ses, geçişten hemen önce (1.5 sn)
//   click        kısa tık: yazı / öğe belirmesi (0.1 sn)
//   shimmer      parıltı: logo, ışık, sihirli an (2 sn)
//   glitch       dijital bozulma, kesme geçişi (0.5 sn)
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 48000;
const TAU = Math.PI * 2;

const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const noise = (n, seed) => {
  const r = rng(seed);
  return Float32Array.from({ length: n }, () => r() * 2 - 1);
};

// Durum değişkenli süzgeç; kesim frekansı her örnekte değişebilir (süpürme için).
// mode: "low" | "band" | "high"
const svf = (x, cutoffAt, mode, q = 0.7) => {
  const y = new Float32Array(x.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = Math.min(cutoffAt(i / RATE), RATE / 7);
    const f = 2 * Math.sin((Math.PI * fc) / RATE);
    low += f * band;
    const high = x[i] - low - q * band;
    band += f * high;
    y[i] = mode === "low" ? low : mode === "band" ? band : high;
  }
  return y;
};

// Sabit frekanslı sinüs yerine anlık frekansı integrale alan osilatör (kayan perde için).
const sweepSine = (n, freqAt) => {
  const y = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    ph += (TAU * freqAt(i / RATE)) / RATE;
    y[i] = Math.sin(ph);
  }
  return y;
};

const expLerp = (a, b, k) => a * Math.pow(b / a, Math.min(1, Math.max(0, k)));

// Stereo WAV yazar. pan(t): -1 sol, +1 sağ. width: kanal arası küçük gecikme (sn).
const wav = (mono, { pan = () => 0, width = 0.008, peakDb = -1 } = {}) => {
  const n = mono.length;
  const d = Math.floor(RATE * width);
  let peak = 0;
  for (const v of mono) peak = Math.max(peak, Math.abs(v));
  const gain = Math.pow(10, peakDb / 20) / (peak || 1);
  // Kenarlarda istenmeyen tık olmasın diye 0.5 ms giriş, 5 ms çıkış
  const edgeIn = Math.floor(RATE * 0.0005);
  const edgeOut = Math.floor(RATE * 0.005);
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / edgeIn, (n - 1 - i) / edgeOut);
    const p = pan(i / RATE);
    const lg = Math.cos(((p + 1) * Math.PI) / 4) * Math.SQRT2;
    const rg = Math.sin(((p + 1) * Math.PI) / 4) * Math.SQRT2;
    const L = mono[i] * gain * fade * lg;
    const R = (i >= d ? mono[i - d] : 0) * gain * fade * rg;
    // Pan kazancı tepeyi aşabilir; yumuşak sınırla
    buf.writeInt16LE(Math.round(Math.tanh(L) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.tanh(R) * 32767), 46 + i * 4);
  }
  return buf;
};

const mix = (n, fn) => Float32Array.from({ length: n }, (_, i) => fn(i, i / RATE));

// --- Ses tasarımları ---

const whoosh = (sec, seed, top) => {
  const n = Math.floor(sec * RATE);
  const bell = (t) => Math.pow(Math.sin(Math.PI * Math.min(1, t / sec)), 2);
  const b = svf(noise(n, seed), (t) => expLerp(250, top, bell(t)), "band", 0.5);
  const air = svf(noise(n, seed + 1), (t) => expLerp(2000, 9000, bell(t)), "high", 0.9);
  return {
    data: mix(n, (i, t) => (b[i] * 1.0 + air[i] * 0.12) * Math.pow(bell(t), 1.4)),
    opts: { pan: (t) => -0.8 + 1.6 * (t / sec) },
  };
};

const riser = () => {
  const sec = 3;
  const n = sec * RATE;
  const k = (t) => t / sec;
  const nz = svf(noise(n, 7), (t) => expLerp(200, 7000, k(t)), "band", 0.4);
  const tone = sweepSine(n, (t) => expLerp(110, 880, k(t) ** 1.5));
  const tone2 = sweepSine(n, (t) => expLerp(110, 880, k(t) ** 1.5) * 1.5);
  return {
    data: mix(n, (i, t) => {
      const env = k(t) ** 2.2;
      const tremolo = 1 - 0.25 * (0.5 + 0.5 * Math.sin(TAU * expLerp(4, 18, k(t)) * t));
      return (nz[i] * 0.9 + (tone[i] * 0.25 + tone2[i] * 0.12) * tremolo) * env;
    }),
    opts: { width: 0.012 },
  };
};

const impact = () => {
  const sec = 2.5;
  const n = sec * RATE;
  const body = sweepSine(n, (t) => expLerp(130, 38, Math.min(1, t / 0.35)));
  const crack = svf(noise(n, 21), () => 3500, "low");
  const tail = svf(svf(noise(n, 22), () => 400, "low"), () => 250, "low");
  return {
    data: mix(n, (i, t) => {
      const att = Math.min(1, t / 0.002);
      return (
        body[i] * att * Math.exp(-t / 0.55) * 1.0 +
        crack[i] * att * Math.exp(-t / 0.035) * 1.6 +
        tail[i] * Math.min(1, t / 0.02) * Math.exp(-t / 0.7) * 6
      );
    }),
    opts: { width: 0.015 },
  };
};

const subDrop = () => {
  const sec = 2;
  const n = sec * RATE;
  const s = sweepSine(n, (t) => expLerp(90, 28, Math.min(1, t / 1.2)));
  return {
    data: mix(n, (i, t) => Math.tanh(s[i] * 1.6) * Math.min(1, t / 0.004) * Math.exp(-t / 0.75)),
    opts: { width: 0 },
  };
};

const swell = () => {
  const sec = 1.5;
  const n = sec * RATE;
  const k = (t) => t / sec;
  const nz = svf(noise(n, 33), (t) => expLerp(300, 5000, k(t)), "low", 0.9);
  const pad = sweepSine(n, () => 220);
  const pad2 = sweepSine(n, () => 330);
  return {
    data: mix(n, (i, t) => (nz[i] * 0.9 + (pad[i] + pad2[i]) * 0.08) * Math.pow(k(t), 3)),
    opts: { width: 0.014 },
  };
};

const click = () => {
  const sec = 0.1;
  const n = Math.floor(sec * RATE);
  const nz = svf(noise(n, 44), () => 4000, "high");
  const blip = sweepSine(n, (t) => expLerp(2600, 1800, t / 0.02));
  return {
    data: mix(n, (i, t) => nz[i] * Math.exp(-t / 0.004) * 0.8 + blip[i] * Math.exp(-t / 0.012) * 0.6),
    opts: { width: 0 },
  };
};

const shimmer = () => {
  const sec = 2;
  const n = sec * RATE;
  const r = rng(55);
  const partials = [1320, 1760, 2217, 2637, 3520, 4435].map((f) => ({
    f: f * (1 + (r() - 0.5) * 0.004),
    rate: 3 + r() * 6,
    ph: r() * TAU,
    amp: 0.5 + r() * 0.5,
  }));
  const air = svf(noise(n, 56), () => 8000, "high");
  return {
    data: mix(n, (i, t) => {
      const env = Math.min(1, t / 0.25) * Math.exp(-Math.max(0, t - 0.25) / 0.6);
      let s = 0;
      for (const p of partials) s += Math.sin(TAU * p.f * t) * p.amp * (0.5 + 0.5 * Math.sin(TAU * p.rate * t + p.ph));
      return (s * 0.18 + air[i] * 0.05) * env;
    }),
    opts: { width: 0.02 },
  };
};

const glitch = () => {
  const sec = 0.5;
  const n = sec * RATE;
  const r = rng(66);
  const nz = noise(n, 67);
  // Kısa, düzensiz parçalar: her biri farklı perde ve seviye
  const slice = Math.floor(RATE * 0.025);
  const parts = Array.from({ length: Math.ceil(n / slice) }, () => ({ f: 200 + r() * 1800, on: r() > 0.25, crush: 2 + Math.floor(r() * 10) }));
  return {
    data: mix(n, (i, t) => {
      const p = parts[Math.floor(i / slice)];
      if (!p.on) return 0;
      const sq = Math.sign(Math.sin(TAU * p.f * t));
      const held = nz[i - (i % p.crush)]; // örnek tutma -> dijital bozulma
      return (sq * 0.35 + held * 0.5) * Math.exp(-t / 0.3);
    }),
    opts: { pan: (t) => Math.sin(TAU * 7 * t) * 0.6, width: 0 },
  };
};

const sounds = {
  whoosh: whoosh(1.2, 1, 4500),
  "whoosh-slow": whoosh(2, 2, 2500),
  riser: riser(),
  impact: impact(),
  "sub-drop": subDrop(),
  swell: swell(),
  click: click(),
  shimmer: shimmer(),
  glitch: glitch(),
};

mkdirSync("public/sfx", { recursive: true });
for (const [name, { data, opts }] of Object.entries(sounds)) {
  writeFileSync(`public/sfx/${name}.wav`, wav(data, opts));
  console.log(`public/sfx/${name}.wav`);
}

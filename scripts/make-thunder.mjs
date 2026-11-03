// Telifsiz, kodla üretilen yumuşak ve uzaktan gelen gök gürültüsü sesleri.
// Çalıştır: npm run thunder  -> public/thunder-1..4.wav
import { writeFileSync } from "node:fs";

const RATE = 48000;

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

const lowpass = (x, cutoff) => {
  const dt = 1 / RATE;
  const rc = 1 / (2 * Math.PI * cutoff);
  const a = dt / (rc + dt);
  const y = new Float32Array(x.length);
  let prev = 0;
  for (let i = 0; i < x.length; i++) y[i] = prev = prev + a * (x[i] - prev);
  return y;
};

const thunder = (seed, seconds, crackAmount) => {
  const r = rng(seed);
  const n = Math.floor(seconds * RATE);
  const white = new Float32Array(n).map(() => r() * 2 - 1);

  // Gürleme: çok kademeli alçak geçiren süzgeç -> derin, boğuk ses
  let rumble = white;
  for (const c of [220, 160, 120]) rumble = lowpass(rumble, c);
  // Çatırtı: yüksek frekanslar, çok kısa
  const lp = lowpass(white, 1800);
  const crack = white.map((v, i) => v - lp[i]);
  const mid = lowpass(lowpass(white, 700), 500);

  // Rastgele zamanlarda yuvarlanan gürleme dalgaları
  const bumps = [];
  for (let i = 0; i < 7; i++) bumps.push({ at: 0.05 + r() * seconds * 0.45, amp: 0.4 + r() * 0.6, tau: 0.25 + r() * 0.6 });
  bumps.push({ at: 0.02, amp: 1, tau: 0.5 });

  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let env = 0;
    for (const b of bumps) {
      if (t >= b.at) {
        const d = t - b.at;
        env += b.amp * Math.min(1, d / 0.06) * Math.exp(-d / b.tau);
      }
    }
    const tail = Math.exp(-t / (seconds * 0.38));
    const crackEnv = Math.min(1, t / 0.004) * Math.exp(-t / 0.09) * crackAmount;
    const fadeOut = Math.min(1, (seconds - t) / 0.6);
    out[i] = (rumble[i] * 9 * env * tail + mid[i] * 1.6 * env * tail * 0.5 + crack[i] * crackEnv * 0.35) * fadeOut;
  }
  // Normalize (hafif: tepe -6 dBFS)
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const gain = 0.5 / (peak || 1);
  // Stereo: iki kanalda küçük gecikme -> geniş, doğal ses
  const delay = Math.floor(RATE * 0.012);
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
    const L = out[i] * gain;
    const R = (i >= delay ? out[i - delay] : 0) * gain;
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R)) * 32767), 46 + i * 4);
  }
  return buf;
};

const specs = [
  [101, 4.2, 1.0],
  [202, 3.6, 0.5],
  [303, 4.4, 0.9],
  [404, 3.2, 0.4],
];
specs.forEach(([seed, sec, crack], i) => {
  writeFileSync(`public/thunder-${i + 1}.wav`, thunder(seed, sec, crack));
  console.log(`public/thunder-${i + 1}.wav`);
});

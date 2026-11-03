// Hacimli (volumetrik) bulut: ışın yürütme (raymarching) ile ışığın bulutun içinden geçişi hesaplanır.

export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;

uniform sampler3D uNoise;
uniform vec2 uRes;
uniform float uCamZ;
uniform float uRot;
uniform float uFov;
uniform vec4 uFlash[4];   // xyz: dünya konumu, w: parlaklık
uniform vec3 uPink;
uniform vec3 uAqua;
uniform vec3 uGlow;
out vec4 outColor;

float noise(vec3 p) { return texture(uNoise, p).r; }
float fbm(vec3 p, int oct) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i >= oct) break;
    s += a * noise(p);
    p = p * 2.07 + vec3(0.131, 0.247, 0.379);
    a *= 0.5;
  }
  return s;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// --- Karnabahar dokusu: her ölçekte rastgele kürelerin yüzeye yumuşakça eklenmesi ---
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float sph(vec3 i, vec3 f, vec3 c) { return length(f - c) - 0.55 * hash3(i + c); }
float sdBase(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  return min(min(min(sph(i, f, vec3(0, 0, 0)), sph(i, f, vec3(0, 0, 1))),
                 min(sph(i, f, vec3(0, 1, 0)), sph(i, f, vec3(0, 1, 1)))),
             min(min(sph(i, f, vec3(1, 0, 0)), sph(i, f, vec3(1, 0, 1))),
                 min(sph(i, f, vec3(1, 1, 0)), sph(i, f, vec3(1, 1, 1)))));
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0); return min(a, b) - h * h * 0.25 / k; }
float smax(float a, float b, float k) { float h = max(k - abs(a - b), 0.0); return max(a, b) + h * h * 0.25 / k; }
const mat3 M = mat3(0.00, 1.60, 1.20, -1.60, 0.72, -0.96, -1.20, -0.96, 1.28);

float sdFbm(vec3 p, float d, int oct) {
  float s = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    float n = s * sdBase(p);
    n = smax(n, d - 0.12 * s, 0.3 * s);
    d = smin(n, d, 0.3 * s);
    p = M * p;
    s *= 0.5;
  }
  return d;
}

// Bulut yüzeyi (işaretli uzaklık): ortası açık tünel, duvarlar kabarık
const float LUMP = 3.2;
float map(vec3 q, int oct) {
  float r = length(q.xy);
  float low = fbm(q * vec3(0.02, 0.02, 0.015), 2);
  float R = 4.5 + low * 10.0;
  float d = R - r;
  return sdFbm(q / LUMP, d / LUMP, oct) * LUMP;
}

vec3 toCloud(vec3 p) { vec3 q = p; q.xy = rot(uRot) * q.xy; return q; }

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(0.0, 0.0, uCamZ);
  vec3 rd = normalize(vec3(uv * uFov, 1.0));
  vec3 rq = vec3(rot(uRot) * rd.xy, rd.z);

  float t = 0.2;
  bool hit = false;
  for (int i = 0; i < 170; i++) {
    vec3 q = toCloud(ro + rd * t);
    int oct = t < 20.0 ? 5 : (t < 50.0 ? 4 : 3);
    float h = map(q, oct);
    if (h < 0.0015 * t) { hit = true; break; }
    t += h * 0.85;
    if (t > 150.0) break;
  }

  float cg = exp(-dot(uv, uv) * 5.0);
  vec3 sky = uGlow * (0.35 + 1.3 * cg);
  float flashSum = 0.0;
  for (int k = 0; k < 4; k++) flashSum += uFlash[k].w;
  vec3 col;

  if (hit) {
    vec3 p = ro + rd * t;
    vec3 q = toCloud(p);
    int oct = t < 20.0 ? 5 : (t < 50.0 ? 4 : 3);
    float e = 0.0015 * t + 0.002;
    vec2 k2 = vec2(1.0, -1.0);
    vec3 nq = normalize(k2.xyy * map(q + k2.xyy * e, oct) + k2.yyx * map(q + k2.yyx * e, oct) +
                        k2.yxy * map(q + k2.yxy * e, oct) + k2.xxx * map(q + k2.xxx * e, oct));
    // normali dünya uzayına geri döndür
    vec3 n = vec3(rot(-uRot) * nq.xy, nq.z);

    // Ortam gölgesi (kıvrımlar koyu)
    float ao = 0.0, sca = 1.0;
    for (int j = 1; j <= 5; j++) {
      float hh = 0.12 * float(j);
      ao += (hh - map(q + nq * hh, 3)) * sca;
      sca *= 0.7;
    }
    ao = clamp(1.0 - 1.6 * ao, 0.0, 1.0);

    float ang = atan(q.y, q.x);
    float hue = smoothstep(-0.3, 0.3, sin(ang + q.z * 0.03) + (fbm(q * 0.025, 2) - 0.375) * 2.6);
    vec3 base = mix(uPink, uAqua, hue);

    // Işık tünelin sonundan gelir
    vec3 L = normalize(vec3(0.1, 0.25, 1.0));
    float wrap = clamp(dot(n, L) * 0.6 + 0.4, 0.0, 1.0);
    float rim = pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 3.0);
    col = base * base * 0.05 * ao
        + base * (0.95 * wrap * wrap) * (0.25 + 0.75 * ao)
        + mix(base, vec3(1.0), 0.2) * rim * 0.22 * ao;

    for (int k = 0; k < 4; k++) {
      float I = uFlash[k].w;
      if (I > 0.0) {
        vec3 lv = uFlash[k].xyz - p;
        float dd = length(lv);
        float fd = max(dot(n, lv / dd), 0.0) * 0.7 + 0.3;
        col += mix(vec3(1.0, 0.97, 1.0), base, 0.45) * I * 4.0 / (1.0 + dd * dd * 0.1) * fd * (0.3 + 0.7 * ao);
      }
    }
    float fog = max(1.0 - exp(-t * 0.0075), smoothstep(55.0, 150.0, t));
    col = mix(col, sky, fog);
  } else {
    col = sky;
  }
  col += uGlow * flashSum * 0.03;

  col = aces(col * 1.1);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lum), col, 1.45), 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));
  outColor = vec4(col, 1.0);
}
`;

// Döşenebilir 3D gürültü dokusu (bir kez üretilir)
export const makeNoiseVolume = (size: number, seed: number) => {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const n = size * size * size;
  let v = new Float32Array(n);
  for (let i = 0; i < n; i++) v[i] = rnd();
  // Yumuşatma (döşenebilir kutu bulanıklığı, 3 eksen)
  const idx = (x: number, y: number, z: number) =>
    ((z + size) % size) * size * size + ((y + size) % size) * size + ((x + size) % size);
  for (let pass = 0; pass < 3; pass++) {
    for (let axis = 0; axis < 3; axis++) {
      const out = new Float32Array(n);
      for (let z = 0; z < size; z++)
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const i = idx(x, y, z);
            const o = axis === 0 ? [1, 0, 0] : axis === 1 ? [0, 1, 0] : [0, 0, 1];
            out[i] = (v[idx(x - o[0], y - o[1], z - o[2])] + v[i] * 2 + v[idx(x + o[0], y + o[1], z + o[2])]) / 4;
          }
      v = out;
    }
  }
  // Kontrastı geri aç (0..1)
  let mn = 1, mx = 0;
  for (const x of v) { mn = Math.min(mn, x); mx = Math.max(mx, x); }
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) bytes[i] = Math.round(((v[i] - mn) / (mx - mn)) * 255);
  return bytes;
};

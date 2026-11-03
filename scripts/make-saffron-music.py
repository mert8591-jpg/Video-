# Telifsiz, kodla üretilen sakin sinematik fon müziği -> public/saffron/music.wav
# Çalıştır: python3 scripts/make-saffron-music.py
import numpy as np, wave, os
SR = 48000; DUR = 46.0; N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
# Dm - Bb - F - C (her akor 4 sn, 60 bpm hissi)
chords = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]
CH = 4.0
L = np.zeros(N); R = np.zeros(N)
# Pad: yavaş atak/bırakma, hafif detune
for i in range(int(DUR / CH) + 1):
    s0 = i * CH; notes = chords[i % 4]
    a = int(max(0, (s0 - 0.8)) * SR); b = min(N, int((s0 + CH + 1.2) * SR))
    if a >= N: break
    tt = t[a:b] - (s0 - 0.8)
    env = np.clip(tt / 1.6, 0, 1) * np.clip((CH + 2.0 - tt) / 1.4, 0, 1)
    env = np.sin(env * np.pi / 2) ** 2
    for k, m in enumerate(notes):
        f = hz(m + 12 if k > 0 else m)
        for det, pan in ((-0.12, 0.3), (0.12, 0.7)):
            ff = f * 2 ** (det / 12 / 4)
            ph = rng.uniform(0, 6.28)
            w = np.sin(2*np.pi*ff*tt+ph) + 0.25*np.sin(4*np.pi*ff*tt+ph) + 0.08*np.sin(6*np.pi*ff*tt)
            g = (0.05 if k > 0 else 0.07) * env * w
            L[a:b] += g * (1 - pan); R[a:b] += g * pan
# Arpej: yumuşak çan sesi (8'lik notalar), 4. sn'den sonra başlar
step = 0.5
for j in range(int(DUR / step)):
    s0 = j * step
    if s0 < 4.0 or s0 > DUR - 3: continue
    notes = chords[int(s0 // CH) % 4][1:]
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    m = notes[pattern[j % 8]] + 12
    a = int(s0 * SR); b = min(N, a + int(2.2 * SR)); tt = t[a:b] - s0
    env = np.exp(-tt * 2.6) * np.clip(tt / 0.01, 0, 1)
    w = np.sin(2*np.pi*hz(m)*tt) + 0.3*np.sin(2*np.pi*hz(m)*2.01*tt)*np.exp(-tt*6)
    vel = 0.035 * (1.0 if j % 4 == 0 else 0.7) * np.clip((s0 - 4.0) / 4.0, 0.3, 1)
    pan = 0.35 + 0.3 * ((j * 3) % 5) / 4
    L[a:b] += vel * env * w * (1 - pan); R[a:b] += vel * env * w * pan
# Basit yankı (çoklu gecikme)
def verb(x):
    y = x.copy()
    for d, g in ((0.113, .35), (0.171, .3), (0.237, .25), (0.331, .2), (0.457, .15)):
        n = int(d * SR); y[n:] += g * x[:-n]
    return y
L, R = verb(L) * 0.8 + verb(R) * 0.2, verb(R) * 0.8 + verb(L) * 0.2
fade = np.clip(t / 2.5, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); L /= peak / 0.7; R /= peak / 0.7
out = (np.stack([L, R], 1) * 32767).astype(np.int16)
os.makedirs("public/saffron", exist_ok=True)
with wave.open("public/saffron/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print("ok")

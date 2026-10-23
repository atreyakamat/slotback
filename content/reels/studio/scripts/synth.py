"""Original beat + sound effects for the SlotBack reel, synthesised from scratch
so the render carries no third-party audio rights."""
import numpy as np, soundfile as sf, os, sys
SR = 44100
OUT = sys.argv[1]
os.makedirs(f"{OUT}/sfx", exist_ok=True)
rng = np.random.default_rng(7)

def t(sec): return np.arange(int(sec * SR)) / SR
def env(n, a=0.002, d=0.2):
    x = np.arange(n) / SR
    return np.minimum(1, x / a) * np.exp(-x / d)
def lp(x, k):  # one-pole low-pass, k in (0,1]
    y = np.zeros_like(x); acc = 0.0
    ks = np.broadcast_to(np.asarray(k, dtype=float), x.shape)
    for i, v in enumerate(x):
        acc += ks[i] * (v - acc); y[i] = acc
    return y
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak

def kick():
    tt = t(0.45); f = 50 + 120 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
def hat(open_=False):
    n = rng.standard_normal(int(0.2 * SR)); n = n - lp(n, 0.3)
    return n * env(len(n), 0.001, 0.09 if open_ else 0.025) * 0.35
def clap():
    n = rng.standard_normal(int(0.3 * SR)); n = n - lp(n, 0.08)
    e = sum(env(len(n), 0.001, 0.01) * (np.arange(len(n)) >= int(k * SR)) for k in (0, 0.012, 0.024))
    return n * (np.roll(env(len(n), 0.001, 0.12), int(0.03 * SR)) * 0.6 + e * 0.4) * 0.5
def bass(freq, dur):
    tt = t(dur); x = np.sign(np.sin(2 * np.pi * freq * tt)) * 0.5 + np.sin(2 * np.pi * freq * tt)
    return lp(x, 0.04) * np.minimum(1, tt / 0.005) * np.exp(-tt * 3) * 0.8
def place(buf, s, at):
    i = int(at * SR); j = min(len(buf), i + len(s))
    if i < len(buf): buf[i:j] += s[: j - i]

# ---- beat -----------------------------------------------------------------
TOTAL = 801 / 30
BPM = 128; BEAT = 60 / BPM
DROP = 285 / 30                       # logo slam
OFFSET = DROP % BEAT                  # put a downbeat exactly on the drop
music = np.zeros(int((TOTAL + 1) * SR))
K, H, HO, C = kick(), hat(), hat(True), clap()
roots = [55.0, 55.0, 65.41, 49.0]     # A1 A1 C2 G1
n = 0; b = OFFSET
while b < TOTAL:
    bar = n // 4; pos = n % 4
    pre = b < DROP - 1e-6
    if pre:
        if pos == 0: place(music, K * 0.55, b)
        place(music, H * 0.6, b + BEAT / 2)
    else:
        place(music, K, b)
        place(music, H, b + BEAT / 2); place(music, H * 0.5, b + BEAT / 4 * 3)
        if pos in (1, 3): place(music, C, b)
        if pos == 3 and bar % 2: place(music, HO, b + BEAT / 2)
        place(music, bass(roots[bar % 4], BEAT * 0.9) * 0.7, b + BEAT / 2)
    n += 1; b += BEAT
# riser into the drop
rl = 1.6; rt = t(rl); nz = rng.standard_normal(len(rt))
riser = (nz - lp(nz, 0.05 + 0.5 * rt / rl)) * (rt / rl) ** 2 * 0.5
riser += np.sin(2 * np.pi * np.cumsum(200 + 900 * (rt / rl) ** 2) / SR) * (rt / rl) ** 2 * 0.15
place(music, riser, DROP - rl)
# fade tail
fade = int(1.2 * SR); end = int(TOTAL * SR)
music[end - fade:end] *= np.linspace(1, 0, fade); music[end:] = 0
sf.write(f"{OUT}/music-placeholder.wav", norm(music[:end], 0.8), SR)

# ---- sfx ------------------------------------------------------------------
def save(name, x, peak=0.9): sf.write(f"{OUT}/sfx/{name}.wav", norm(x, peak), SR)
tt = t(0.6); save("buzz", np.sign(np.sin(2*np.pi*160*tt)) * (np.sin(2*np.pi*18*tt) > 0) * lp(np.ones_like(tt), 0.001) * np.exp(-tt*1.5) * 0.4, 0.6)
tt = t(0.45); nz = rng.standard_normal(len(tt)); w = np.sin(np.pi * tt / 0.45) ** 2
save("whoosh", (lp(nz, 0.03) * 4 + (nz - lp(nz, 0.5)) * 0.3) * w, 0.7)
tt = t(0.25); g = rng.standard_normal(len(tt)) * (np.floor(tt * 60) % 2) + np.sign(np.sin(2*np.pi*(800 + 3000*rng.random())*tt)) * 0.3
save("glitch", g * np.exp(-tt * 6), 0.5)
tt = t(1.0); kk = np.pad(kick(), (0, len(tt) - len(kick())))
save("impact", kk + lp(rng.standard_normal(len(tt)), 0.02) * np.exp(-tt*4) * 3, 0.95)
tt = t(0.5); save("cash", (np.sin(2*np.pi*1318*tt) + 0.6*np.sin(2*np.pi*1975*tt)) * env(len(tt), 0.002, 0.15) + (rng.standard_normal(len(tt)) * env(len(tt), 0.001, 0.02)) * 0.5, 0.6)
tt = t(0.3); save("error", np.sign(np.sin(2*np.pi*110*tt)) * lp(np.ones_like(tt), 0.01) * np.exp(-tt * 6), 0.4)
tt = t(0.12); save("pop", np.sin(2*np.pi*np.cumsum(500 + 1200*np.exp(-tt*40))/SR) * env(len(tt), 0.001, 0.04), 0.5)
tt = t(0.06); save("tick", (rng.standard_normal(len(tt)) - 0) * env(len(tt), 0.0005, 0.008) + np.sin(2*np.pi*2500*tt) * env(len(tt), 0.0005, 0.01), 0.35)
tt = t(0.9); ch = sum(np.sin(2*np.pi*f*tt) * env(len(tt), 0.002, 0.3) * (tt >= d) for f, d in ((880, 0), (1108.7, 0.08), (1318.5, 0.16)))
save("success", ch, 0.6)
tt = t(0.35); save("thud", np.sin(2*np.pi*np.cumsum(80 + 80*np.exp(-tt*25))/SR) * np.exp(-tt*10), 0.8)
print("ok")

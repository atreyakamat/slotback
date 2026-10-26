"""Extra sound effects for the fast-cut series (riser, sub drop, snap, swell),
synthesised from scratch like synth.py. Usage: sfx-extra.py <public/audio/sfx>"""
import numpy as np, soundfile as sf, sys
SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(11)
def t(sec): return np.arange(int(sec * SR)) / SR
def lp(x, k):
    y = np.zeros_like(x); acc = 0.0
    ks = np.broadcast_to(np.asarray(k, dtype=float), x.shape)
    for i, v in enumerate(x):
        acc += ks[i] * (v - acc); y[i] = acc
    return y
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak
def save(name, x):
    fade = np.minimum(1, (len(x) - np.arange(len(x))) / (0.01 * SR))
    sf.write(f"{OUT}/{name}.wav", norm(x * fade), SR)

# riser: filtered noise + rising tone over 1.6s, ends right on the drop
tt = t(1.6); p = tt / tt[-1]
noise = rng.standard_normal(len(tt)); noise = lp(noise, 0.02 + 0.5 * p ** 2)
tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * p ** 2) / SR) * 0.25
save("riser", (noise * 0.8 + tone) * p ** 2.2)

# sub: 808-style boom with a pitch dive
tt = t(1.1); f = 38 + 90 * np.exp(-tt * 18)
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6)
save("sub", np.tanh(x * 2.2))

# snap: short bright click for fast cuts
tt = t(0.09); n = rng.standard_normal(len(tt)); n = n - lp(n, 0.25)
save("snap", n * np.exp(-tt * 70) + np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 90) * 0.4)

# swell: reversed cymbal-ish wash, 0.9s
tt = t(0.9); n = rng.standard_normal(len(tt)); n = n - lp(n, 0.15)
save("swell", (n * np.exp(-tt * 4))[::-1])

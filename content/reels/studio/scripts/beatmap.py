"""Beat-map each track: tempo, beat times, and the strongest energy jumps
(drops) so reels can start on a section that hits."""
import json, sys, numpy as np, librosa
out = {}
for path in sys.argv[1:]:
    y, sr = librosa.load(path, sr=22050, mono=True)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    t = librosa.times_like(rms, sr=sr, hop_length=512)
    # smoothed loudness per beat; drop = biggest rise from previous 4 beats
    bt = np.array(beats)
    loud = np.array([rms[(t >= a) & (t < b)].mean() if ((t >= a) & (t < b)).any() else 0 for a, b in zip(bt[:-1], bt[1:])])
    rise = np.array([loud[i:i+4].mean() - loud[max(0,i-4):i].mean() if i >= 4 else 0 for i in range(len(loud))])
    idx = np.argsort(rise)[::-1]
    drops = []
    for i in idx:
        if all(abs(bt[i] - d) > 8 for d in drops):
            drops.append(float(bt[i]))
        if len(drops) == 4: break
    name = path.split("/")[-1].rsplit(".", 1)[0]
    out[name] = {
        "duration": round(len(y) / sr, 2),
        "bpm": round(float(np.atleast_1d(tempo)[0]), 1),
        "first_beat": round(float(bt[0]), 3),
        "beat_count": len(bt),
        "drops": sorted(round(d, 2) for d in drops),
        "beats": [round(float(b), 3) for b in bt],
        "loudness_by_8s": [round(float(rms[(t >= s) & (t < s + 8)].mean()), 3) for s in range(0, int(len(y) / sr), 8)],
    }
json.dump(out, open("/home/claude/beatmap/beatmap.json", "w"))
for k, v in out.items():
    print(k, {x: v[x] for x in ("duration", "bpm", "first_beat", "beat_count", "drops", "loudness_by_8s")})

#!/usr/bin/env python3
"""Builds the test-pool review folder from rendered reels.

Usage: python3 scripts/pool-docs.py <renderDir> <poolDir>
renderDir holds <id>.mp4 plus manifest.json from render-pool.mjs.
poolDir (content/reels/pool) gets 540p previews, per-idea contact sheets,
README.md, SCRIPTS.md and picks.csv.
"""
import csv, json, re, subprocess, sys
from pathlib import Path

BEAT, END = 16, 48  # keep in step with src/pool/PoolReelVideo.tsx
render, pool = Path(sys.argv[1]), Path(sys.argv[2])
reels = json.loads((render / "manifest.json").read_text())
(pool / "previews").mkdir(parents=True, exist_ok=True)
(pool / "sheets").mkdir(exist_ok=True)


def run(*cmd):
    subprocess.run(cmd, check=True)


def plain(s):
    return re.sub(r"[*~_]", "", s).replace("\n", " ")


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(out.stdout.strip() or 0)


def describe(s):
    t = s["type"]
    if t == "text":
        return " / ".join(plain(l) for l in s["lines"]) + (f"  [{s['kicker']}]" if s.get("kicker") else "")
    if t == "ticker":
        return f"{plain(s.get('pre', ''))} → " + " · ".join(plain(w) for w in s["words"])
    if t == "chat":
        return " | ".join(("Owner: " if side == "out" else "Client: ") + plain(m) for side, m in s["msgs"])
    if t == "stat":
        return f"{s['label']}: {s.get('prefix', '')}{s['value']:,}{s.get('suffix') or ''}" + (f" — {plain(s['note'])}" if s.get("note") else "")
    if t == "stage":
        return f"Stage {s['i']}/{s['n']}: {s['name']}" + (f" — {plain(s['line'])}" if s.get("line") else "")
    if t == "vs":
        return f"{s['left']['title']} ({'; '.join(map(plain, s['left']['lines']))}) vs {s['right']['title']} ({'; '.join(map(plain, s['right']['lines']))})"
    if t == "poll":
        return f"{plain(s['q'])} " + " · ".join(f"{plain(l)} {p}%" for l, p in s["options"])
    if t == "grid":
        return f"{plain(s['title'])}: " + ", ".join(f"{e} {plain(l)}" for e, l in s["tiles"])
    if t == "rank":
        return f"#{s['n']} {plain(s['text'])}" + (f" — {plain(s['sub'])}" if s.get("sub") else "")
    if t == "check":
        return (plain(s["title"]) + ": " if s.get("title") else "") + " ✓ ".join(plain(i) for i in s["items"])
    if t in ("notif",):
        return f"Phone notification: “{s['message']}”"
    if t == "calls":
        return f"Calling {', '.join(s['names'])}: no answer"
    if t == "openSlot":
        return f"App: slot marked free, waitlist pinged — {plain(s['headline'])}"
    if t == "claim":
        return f"Claim page: {s['slot']} — {plain(s['headline'])}"
    if t == "timer":
        return f"Countdown → claimed — {plain(s['headline'])}"
    if t == "flip":
        return f"{s['time']}: Cancelled → {s['after']}" + (f" ({s['amount']})" if s.get("amount") else "")
    if t == "counter":
        return f"{s.get('label', '')}: " + " → ".join(f"₹{st['value']:,} {st['note']}" for st in s["steps"])
    if t == "chair":
        return f"Empty chair — {plain(s['headline'])}"
    if t == "gap":
        return f"Diary ({s['state']}) — {plain(s['headline'])}"
    if t == "quotes":
        return " / ".join(plain(q) for q in s["quotes"])
    if t == "rating":
        return f"{plain(s['text'])}: {s['score']}/10" + (f" — {s['note']}" if s.get("note") else "")
    if t == "flag":
        return f"{s['color']} flag: {plain(s['text'])}"
    return t


by_idea = {}
for r in reels:
    by_idea.setdefault(r["idea"], []).append(r)

for r in reels:
    src = render / f"{r['id']}.mp4"
    dst = pool / "previews" / f"{r['id']}.mp4"
    if src.exists() and not dst.exists():
        run("ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-vf", "scale=540:960:flags=lanczos", "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(dst))
    r["seconds"] = round(duration(dst), 1) if dst.exists() else None

# One sheet per idea: a row of 6 frames for each of its 5 scripts.
for key, rs in by_idea.items():
    name = re.sub(r"[^a-z0-9]+", "-", key.split(" · ")[0].lower())
    sheet = pool / "sheets" / f"{name}.png"
    rows = []
    for r in rs:
        v = pool / "previews" / f"{r['id']}.mp4"
        if not v.exists():
            continue
        row = render / f".row-{r['id']}.png"
        fps = 6 / max(r["seconds"] or 6, 1)
        run("ffmpeg", "-loglevel", "error", "-y", "-i", str(v), "-vf", f"fps={fps:.4f},scale=180:-1,tile=6x1", "-frames:v", "1", str(row))
        rows.append(row)
    if rows:
        inputs = sum((["-i", str(p)] for p in rows), [])
        run("ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", f"vstack=inputs={len(rows)}" if len(rows) > 1 else "null", str(sheet))
        for p in rows:
            p.unlink()

total = sum(1 for r in reels if r.get("seconds"))
lines = [
    "# Reel test pool",
    "",
    f"{len(reels)} scripted reels: 5 takes on each of {len(by_idea)} ideas from the [Reel ideas bank](https://claude.ai/artifact/FbSGotfQLXxMVE7u4z9Lmc). {total} are rendered here as 540p previews. Pick the ones you want, and I'll render those at full 1080p for posting.",
    "",
    "**How to pick:** watch the previews (or skim the sheets), then mark `pick` with `y` in [picks.csv](picks.csv) or just send me the ids.",
    "",
    "- No music is baked in. Add a trending sound in Instagram. The cuts sit on a 112.5 BPM grid, so 110–115 BPM (or 225 at double time) sounds land on the beat. Sound effects (whooshes, pops, ticks) are included, and you can turn them down in the IG editor.",
    "- Every number is example maths and every poll is marked illustrative. There are no fake testimonials.",
    "- Left out on purpose: pillar 7 (#111–116), C4 and C6, which need real pilot results, and #94, which you'd only post once a first pilot says yes.",
    "- Check before posting: #82 says the claim link runs for 10 minutes and then moves on, so confirm the product does this. #93 promises a free demo only and puts pilot pricing in DMs. #100 uses Konkani phrases, so run them past a local speaker.",
    "- Source: `content/reels/studio/src/pool/` (the React shot components are in `glass.tsx`, and the scripts are in `ideas-*.ts`). Re-render with `node scripts/render-pool.mjs <out> --only=<id>`.",
    "",
]
current_pillar = None
for key, rs in by_idea.items():
    name = re.sub(r"[^a-z0-9]+", "-", key.split(" · ")[0].lower())
    lines += [f"## {key}", "", f"![{key}](sheets/{name}.png)", "", "| # | Angle | Title | Length | CTA | Preview |", "| --- | --- | --- | --- | --- | --- |"]
    for r in rs:
        secs = f"{r['seconds']}s" if r.get("seconds") else "not rendered"
        lines.append(f"| v{r['variant']} | {r['angle']} | [{r['title']}](SCRIPTS.md#{r['id']}) | {secs} | {r.get('cta') or 'DM “DEMO” for a free demo'} | [mp4](previews/{r['id']}.mp4) |")
    lines.append("")
(pool / "README.md").write_text("\n".join(lines))

s = ["# Test pool scripts", "", "Every shot in order. The first shot is the hook (about 1.5s). `[kicker]` is the small pill above the headline.", ""]
for key, rs in by_idea.items():
    s += [f"## {key}", ""]
    for r in rs:
        s += [f"### {r['id']}", "", f"**v{r['variant']} · {r['angle']} · {r['title']}**" + (f" · badge: {r['badge']}" if r.get("badge") else ""), ""]
        for i, shot in enumerate([r["hook"], *r["shots"]]):
            s.append(f"{i + 1}. {'**Hook** · ' if i == 0 else ''}{shot['type']} — {describe(shot)}")
        s += [f"{len(r['shots']) + 2}. End card — {r.get('cta') or 'DM “DEMO” for a free demo'}", ""]
(pool / "SCRIPTS.md").write_text("\n".join(s))

with open(pool / "picks.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id", "idea", "variant", "angle", "title", "seconds", "pick"])
    for r in reels:
        w.writerow([r["id"], r["idea"], r["variant"], r["angle"], r["title"], r.get("seconds") or "", ""])
print(f"previews {total}/{len(reels)}, sheets {len(list((pool / 'sheets').glob('*.png')))}")

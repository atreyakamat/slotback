# SlotBack reel studio

This Remotion project renders every SlotBack Instagram reel at 1080×1920, 30 fps. Scripts and the posting calendar: [SlotBack reel series: 20 scripts](https://claude.ai/artifact/LbYJ3Nt5mTXQ5fPKPh7msm). Brand film script: [SlotBack brand reel script](https://claude.ai/artifact/CyWMEn4sbBEgPQDoUpvuBE).

Finished **posting files** live in [`../exports/`](../exports). They carry sound effects and voiceover only. Add the song in Instagram's audio picker, with the trim set to the song start in `../exports/README.md`. Never bake a licensed song into a file you post.

## Setup

```bash
npm i
npm run dev   # Remotion Studio: SlotBackReel (brand film) and the Series01 folder
```

Licensed songs are **not** in git. To preview or render with music, put the four MP3s in `public/music/` (that folder is gitignored): `windows-in-brazil.mp3`, `paixao-sped-up.mp3`, `cavuca-funk.mp3`, `struct-slowed.mp3`.

## Rendering

```bash
# Series reels: a posting file plus a song preview for each (preview only if the MP3 is present)
REMOTION_BROWSER=/path/to/chrome scripts/render-series.sh out r01-4pm-ghost r02-20800-math

# Contact sheet of every shot, for a quick visual check
npx tsx scripts/contact-sheet.ts out/sheet

# Brand film (reel 4)
npm run render:ig
```

## How a series reel works

| Path | What it holds |
| --- | --- |
| `src/series/reels.ts` | One config per reel: track, song start, drop time, hook shot, and shots counted **in beats** |
| `src/series/beatmaps.ts` | Beat times for the 4 songs, from `scripts/beatmap.py` (librosa) |
| `src/series/timeline.ts` | Snaps every cut to the song's beat grid. The hook runs up to the drop, and the end card follows the last shot |
| `src/series/shots.tsx` | 14 shot types: slam, notif, counter, calls, openSlot, claim, flip, step, quotes, timer, list, chair, gap, pins |
| `src/series/SeriesReelVideo.tsx` | Puts the shots on the timeline with transitions, a drop flash, a beat bump, and auto sound effects |
| `src/SlotBackReel.tsx`, `src/scenes/` | The brand film (reel 4) |
| `public/audio/vo`, `public/audio/vo-series` | Kokoro voiceover WAVs |
| `scripts/` | `tts.py` (voiceover), `synth.py` (SFX and placeholder beat), `beatmap.py`, render and contact-sheet scripts |

To add a reel, add a config to `reels.ts`. Text takes `*lime*`, `~red~` and `_muted_` markup. The composition appears in Studio automatically.

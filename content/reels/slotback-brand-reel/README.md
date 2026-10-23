# SlotBack brand reel

A 26.7s vertical (1080×1920, 30 fps) Instagram reel built in [Remotion](https://www.remotion.dev/). Script and phonetic voiceover script: [SlotBack brand reel script](https://claude.ai/artifact/CyWMEn4sbBEgPQDoUpvuBE).

Latest renders are in [`exports/`](exports):

- `04-brand-film-v2-post.mp4` has voice and sound effects only, and uses logo B. In Instagram, add **WINDOWS IN BRAZIL** from the audio picker with the song start at **0:00**. Its first drop lands on the logo slam.

To preview against a song locally, put the MP3 in `public/music/` (it's gitignored, so licensed songs never get committed) and render with `--props='{"music":"music/windows-in-brazil.mp3","musicStart":0,"musicDelay":4,"captions":true}'`.

Don't bake copyrighted music into an export. Instagram can mute the reel if you do.

## Commands

```bash
npm i
npm run dev        # Remotion Studio preview
npm run render     # with placeholder beat -> out/
npm run render:ig  # voice + SFX only -> out/
```

## How it is put together

| Path | What it holds |
| --- | --- |
| `src/theme.ts` | Brand colours, fonts and the **scene length table**. Every cut is timed from here. |
| `src/vo.ts` | Voiceover lines (these also drive the burned-in captions) |
| `src/scenes/` | The 10 scenes: `Problem.tsx` (hook, chair, counter, calling), `Solution.tsx` (logo, open slot, claim, filled), `Close.tsx` (features, CTA) |
| `src/SlotBackReel.tsx` | Main timeline: scenes, flashes, VO and SFX cue list |
| `public/audio/vo/` | One WAV per scene, named after the scene id |
| `public/audio/sfx/`, `music-placeholder.wav` | Synthesised sound effects and beat |
| `scripts/` | `tts.py` (Kokoro voiceover), `synth.py` (beat + SFX) |

### Swapping audio

- **Your own voiceover:** drop `hook.wav`, `counter.wav` and so on into `public/audio/vo/`, update the `seconds` values in `src/vo.ts`, and stretch any scene in `src/theme.ts` whose line runs long.
- **Beat-sync to a song:** put the file in `public/audio/` and render with `--props='{"music":"audio/<file>","captions":true}'`. Use this only to time cuts. Export the final with `"music":"none"`.
- **Regenerate the scratch VO** (free, local): `pip install kokoro-onnx soundfile`, download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the [kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0), then run `python scripts/tts.py af_heart en-us 1.15 public/audio/vo` from the folder holding the model files. Edit `scripts/vo-lines.json` first if you're changing lines.

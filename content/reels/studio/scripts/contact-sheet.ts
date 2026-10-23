// Renders a still from late in every shot of each series reel, for a quick
// visual check: npx tsx scripts/contact-sheet.ts <outDir> [reelId...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { reels } from "../src/series/reels";
import { buildTimeline } from "../src/series/timeline";
import { series04 } from "../src/kinetic/reels-04";
import { kTimeline } from "../src/kinetic/timeline";

const main = async () => {
  const [outDir, ...only] = process.argv.slice(2);
  mkdirSync(outDir, { recursive: true });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const jobs = [
    ...reels.map((r) => ({ id: r.id, frames: () => { const t = buildTimeline(r); return [...t.shots.map((s) => s.from + Math.round(s.duration * 0.8)), t.endCardFrom + 20]; } })),
    ...series04.map((r) => ({ id: r.id, frames: () => { const t = kTimeline(r); return [...t.placed.map((s) => s.from + Math.round(s.duration * 0.8)), t.endCardFrom + 20]; } })),
  ];
  for (const reel of jobs) {
    if (only.length && !only.includes(reel.id)) continue;
    const frames = reel.frames();
    const inputProps = { reelId: reel.id, withSong: false };
    const composition = await selectComposition({ serveUrl, id: reel.id, inputProps, browserExecutable });
    for (const frame of frames) {
      await renderStill({ composition, serveUrl, frame, inputProps, browserExecutable, output: `${outDir}/${reel.id}-${String(frame).padStart(4, "0")}.png` });
    }
    console.log("done", reel.id);
  }
};
main();

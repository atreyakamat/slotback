// Renders a still from late in every shot of each series reel, for a quick
// visual check: npx tsx scripts/contact-sheet.ts <outDir> [reelId...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { reels } from "../src/series/reels";
import { buildTimeline } from "../src/series/timeline";

const main = async () => {
  const [outDir, ...only] = process.argv.slice(2);
  mkdirSync(outDir, { recursive: true });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  for (const reel of reels) {
    if (only.length && !only.includes(reel.id)) continue;
    const t = buildTimeline(reel);
    const frames = [...t.shots.map((s) => s.from + Math.round(s.duration * 0.8)), t.endCardFrom + 20];
    const inputProps = { reelId: reel.id, withSong: false };
    const composition = await selectComposition({ serveUrl, id: reel.id, inputProps, browserExecutable });
    for (const frame of frames) {
      await renderStill({ composition, serveUrl, frame, inputProps, browserExecutable, output: `${outDir}/${reel.id}-${String(frame).padStart(4, "0")}.png` });
    }
    console.log("done", reel.id);
  }
};
main();

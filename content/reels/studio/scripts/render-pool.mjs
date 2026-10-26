// Renders test-pool reels. Bundles once, then renders each reel by id.
// Usage: node scripts/render-pool.mjs <outDir> [--scale=0.6667] [--crf=23] [--only=id,id] [--shard=i/n]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { buildSync } from "esbuild";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, "").split("=")));
const out = path.resolve(process.argv[2] ?? "out/pool");
const scale = Number(args.scale ?? 2 / 3);
const crf = Number(args.crf ?? 23);
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
fs.mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
// Load the scripts straight from TypeScript and write a manifest beside the videos.
const tmp = path.join(os.tmpdir(), `pool-reels-${process.pid}.mjs`);
buildSync({ entryPoints: [path.resolve("src/pool/reels.ts")], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "error" });
const { poolReels } = await import(tmp);
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(poolReels, null, 1));
let todo = args.only ? args.only.split(",") : poolReels.map((r) => r.id);
if (args.shard) {
  const [i, n] = args.shard.split("/").map(Number);
  todo = todo.filter((_, k) => k % n === i);
}
for (const reelId of todo) {
  const file = path.join(out, `${reelId}.mp4`);
  if (fs.existsSync(file) && !args.force) continue;
  const t0 = Date.now();
  const composition = await selectComposition({ serveUrl, id: "PoolReel", inputProps: { reelId }, browserExecutable });
  await renderMedia({ composition, serveUrl, codec: "h264", crf, scale, outputLocation: file + ".part.mp4", inputProps: { reelId }, browserExecutable, concurrency: Number(args.concurrency ?? 2), logLevel: "error" });
  fs.renameSync(file + ".part.mp4", file);
  console.log(`rendered ${reelId} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

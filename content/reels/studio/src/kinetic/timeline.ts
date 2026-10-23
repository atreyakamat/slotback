import { random } from "remotion";
import { FPS } from "../theme";
import { beatMaps } from "../series/beatmaps";
import { beatUnit } from "../series/timeline";
import { envCycle, themeCycle } from "./themes";
import { El, EnvKind, KReel, ThemeId } from "./types";

export const END_CARD = 45;

export type Placed = { el: El; from: number; duration: number; beats: number[]; theme: ThemeId; env: EnvKind; index: number };

export const kTimeline = (reel: KReel) => {
  const unit = beatUnit[reel.track];
  const all = beatMaps[reel.track].beats.filter((t) => t >= reel.songStart).map((t) => Math.round((t - reel.songStart) * FPS));
  const dropTarget = Math.round((reel.drop - reel.songStart) * FPS);
  let dropIdx = 0;
  all.forEach((f, i) => {
    if (Math.abs(f - dropTarget) < Math.abs(all[dropIdx] - dropTarget)) dropIdx = i;
  });
  const grid = all.slice(dropIdx).filter((_, i) => i % unit === 0);
  const hookBeats = all.slice(0, dropIdx).filter((_, i) => (dropIdx - i) % unit === 0);
  const dropMarks = (reel.laterDrops ?? []).map((d) => {
    const target = Math.round((d - reel.songStart) * FPS);
    let best = 0;
    grid.forEach((f, i) => {
      if (Math.abs(f - target) < Math.abs(grid[best] - target)) best = i;
    });
    return best;
  });
  // Themes cycle without repeating back to back; the seed varies the order per reel.
  const rot = Math.floor(random(`t${reel.seed}`) * themeCycle.length);
  const envRot = Math.floor(random(`e${reel.seed}`) * envCycle.length);
  let prev: ThemeId | undefined = reel.hookTheme ?? "ink";
  const pickTheme = (i: number): ThemeId => {
    let th = themeCycle[(i + rot) % themeCycle.length];
    if (th === prev) th = themeCycle[(i + rot + 1) % themeCycle.length];
    prev = th;
    return th;
  };
  const placed: Placed[] = [
    { el: reel.hook, from: 0, duration: grid[0], beats: hookBeats.length ? hookBeats : [0], theme: reel.hookTheme ?? "ink", env: "solid", index: 0 },
  ];
  let g = 0;
  reel.cuts.forEach((c, i) => {
    const target = (reel.length ?? 26) * FPS - END_CARD;
    const len =
      c.beats === "drop"
        ? (dropMarks.find((m) => m > g) ?? NaN) - g
        : c.beats === "rest"
          ? grid.findIndex((f, k) => k > g && f >= target) - g
          : c.beats;
    if (!(len > 0)) throw new Error(`${reel.id}: cut ${i} has no later drop to run to`);
    const start = grid[g];
    const end = grid[g + len];
    if (end === undefined) throw new Error(`${reel.id}: cut ${i} runs past the song's beat map`);
    const theme = c.theme ?? pickTheme(i);
    if (c.theme) prev = c.theme;
    placed.push({ el: c.el, from: start, duration: end - start, beats: grid.slice(g, g + len).map((f) => f - start), theme, env: c.env ?? envCycle[(i + envRot) % envCycle.length], index: i + 1 });
    g += len;
  });
  const endCardFrom = grid[g];
  return {
    placed,
    dropFrame: grid[0],
    laterDropFrames: dropMarks.filter((m) => m <= g).map((m) => grid[m]),
    endCardFrom,
    total: endCardFrom + END_CARD,
  };
};


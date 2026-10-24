import { FPS } from "../theme";
import { beatMaps } from "./beatmaps";
import { SeriesReel, Shot, TrackId } from "./types";

// WINDOWS IN BRAZIL is mapped at 172 BPM, so one musical "beat" for cuts
// is two detected beats there.
export const beatUnit: Record<TrackId, number> = { windows: 2, paixao: 1, cavuca: 1, struct: 1, phonk: 1 };

export const DEFAULT_END_CARD = 45;

export type PlacedShot = {
  shot: Shot;
  from: number;
  duration: number;
  // Beat frames inside the shot, relative to its start (first is 0).
  beats: number[];
  index: number;
};

export type Timeline = {
  shots: PlacedShot[];
  dropFrame: number;
  laterDropFrames: number[];
  beatFrames: number[];
  endCardFrom: number;
  total: number;
};

export const buildTimeline = (reel: SeriesReel): Timeline => {
  const unit = beatUnit[reel.track];
  const all = beatMaps[reel.track].beats
    .filter((t) => t >= reel.songStart)
    .map((t) => Math.round((t - reel.songStart) * FPS));
  const dropTarget = Math.round((reel.drop - reel.songStart) * FPS);
  let dropIdx = 0;
  all.forEach((f, i) => {
    if (Math.abs(f - dropTarget) < Math.abs(all[dropIdx] - dropTarget)) dropIdx = i;
  });
  const grid = all.slice(dropIdx).filter((_, i) => i % unit === 0);
  const dropFrame = grid[0];

  // Hook beats count back from the drop on the same grid.
  const hookBeats = all.slice(0, dropIdx).filter((_, i) => (dropIdx - i) % unit === 0);
  const shots: PlacedShot[] = [
    { shot: reel.hook, from: 0, duration: dropFrame, beats: hookBeats.length ? hookBeats : [0], index: 0 },
  ];
  // Grid indices of the later drops, in order.
  const dropMarks = (reel.laterDrops ?? []).map((d) => {
    const target = Math.round((d - reel.songStart) * FPS);
    let best = 0;
    grid.forEach((f, i) => {
      if (Math.abs(f - target) < Math.abs(grid[best] - target)) best = i;
    });
    return best;
  });
  let g = 0;
  reel.shots.forEach((shot, i) => {
    const start = grid[g];
    const len = shot.beats === "drop" ? (dropMarks.find((m) => m > g) ?? NaN) - g : shot.beats;
    if (!(len > 0)) throw new Error(`${reel.id}: shot ${i} has no later drop to run to`);
    const end = grid[g + len];
    if (end === undefined) throw new Error(`${reel.id}: shot ${i} runs past the song's beat map`);
    shots.push({
      shot,
      from: start,
      duration: end - start,
      beats: grid.slice(g, g + len).map((f) => f - start),
      index: i + 1,
    });
    g += len;
  });
  const endCardFrom = grid[g];
  const total = endCardFrom + (reel.endCardFrames ?? DEFAULT_END_CARD);
  const laterDropFrames = dropMarks.filter((m) => m <= g).map((m) => grid[m]);
  return { shots, dropFrame, laterDropFrames, beatFrames: grid.slice(0, g + 1), endCardFrom, total };
};

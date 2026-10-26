import React from "react";
import { Composition, Folder, delayRender, continueRender } from "remotion";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";
import { fontsLoaded } from "./fonts";
import { ReelProps, SlotBackReel } from "./SlotBackReel";
import { reels } from "./series/reels";
import { SeriesReelProps, SeriesReelVideo, seriesDuration } from "./series/SeriesReelVideo";
import { KineticProps, KineticVideo, kineticDuration } from "./kinetic/KineticVideo";
import { series04 } from "./kinetic/reels-04";
import { PoolReelProps, PoolReelVideo, poolDuration } from "./pool/PoolReelVideo";
import { poolReels } from "./pool/reels";
import { MovieReelProps, MovieReelVideo, movieDuration } from "./movie/MovieReel";
import { movieReels } from "./movie/reels";

const handle = delayRender("Loading fonts");
fontsLoaded.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SlotBackReel"
      component={SlotBackReel}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ music: "placeholder", captions: true } satisfies ReelProps}
    />
    {(["01", "02", "03"] as const).map((series) => (
      <Folder key={series} name={`Series${series}`}>
        {reels
          .filter((r) => (r.series ?? "01") === series)
          .map((r) => (
            <Composition
              key={r.id}
              id={r.id}
              component={SeriesReelVideo}
              durationInFrames={seriesDuration(r.id)}
              fps={FPS}
              width={WIDTH}
              height={HEIGHT}
              defaultProps={{ reelId: r.id, withSong: true } satisfies SeriesReelProps}
            />
          ))}
      </Folder>
    ))}
    <Folder name="Series04">
      {series04.map((r) => (
        <Composition
          key={r.id}
          id={r.id}
          component={KineticVideo}
          durationInFrames={kineticDuration(r.id)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ reelId: r.id, withSong: true } satisfies KineticProps}
        />
      ))}
    </Folder>
    {/* Test pool: one composition; the reel is picked by props. */}
    <Composition
      id="PoolReel"
      component={PoolReelVideo}
      durationInFrames={poolDuration(poolReels[0].id)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ reelId: poolReels[0].id } satisfies PoolReelProps}
      calculateMetadata={({ props }) => ({ durationInFrames: poolDuration(props.reelId) })}
    />
    <Folder name="Movie">
      {movieReels.map((r) => (
        <Composition
          key={r.id}
          id={r.id}
          component={MovieReelVideo}
          durationInFrames={movieDuration(r.id)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ reelId: r.id } satisfies MovieReelProps}
        />
      ))}
    </Folder>
  </>
);

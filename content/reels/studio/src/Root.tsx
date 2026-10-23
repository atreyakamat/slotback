import React from "react";
import { Composition, Folder, delayRender, continueRender } from "remotion";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";
import { fontsLoaded } from "./fonts";
import { ReelProps, SlotBackReel } from "./SlotBackReel";
import { reels } from "./series/reels";
import { SeriesReelProps, SeriesReelVideo, seriesDuration } from "./series/SeriesReelVideo";

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
    <Folder name="Series01">
      {reels.map((r) => (
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
  </>
);

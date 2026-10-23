import React from "react";
import { Composition, delayRender, continueRender } from "remotion";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";
import { fontsLoaded } from "./fonts";
import { ReelProps, SlotBackReel } from "./SlotBackReel";

const handle = delayRender("Loading fonts");
fontsLoaded.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SlotBackReel"
    component={SlotBackReel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{ music: "placeholder", captions: true } satisfies ReelProps}
  />
);

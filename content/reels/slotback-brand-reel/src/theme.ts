export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const colors = {
  ink: "#07140F",
  green: "#0F2E22",
  greenLight: "#1A4434",
  lime: "#C6F432",
  cream: "#F5EFE1",
  red: "#FF4D3D",
  muted: "#8FA89B",
};

export const fonts = {
  display: "ArchivoBlack, ArchivoBlackExt, sans-serif",
  body: "InterTight, InterTightExt, sans-serif",
};

// Scene lengths in frames. Cuts land on these boundaries, so the music
// beat grid and the voiceover are both laid out against this table.
export const scenes = {
  hook: 54,
  emptyChair: 60,
  counter: 111,
  calling: 60,
  logo: 33,
  openSlot: 120,
  claim: 90,
  filled: 90,
  features: 108,
  cta: 75,
} as const;

export type SceneId = keyof typeof scenes;

export const sceneStarts = (() => {
  const starts = {} as Record<SceneId, number>;
  let t = 0;
  for (const id of Object.keys(scenes) as SceneId[]) {
    starts[id] = t;
    t += scenes[id];
  }
  return starts;
})();

export const TOTAL_FRAMES = Object.values(scenes).reduce((a, b) => a + b, 0);

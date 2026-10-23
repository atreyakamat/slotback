import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Latin and latin-ext are loaded as separate families so the ₹ glyph
// (only in latin-ext) resolves through the font stack in theme.ts.
export const fontsLoaded = Promise.all([
  loadFont({ family: "ArchivoBlack", url: staticFile("fonts/archivo-black-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "ArchivoBlackExt", url: staticFile("fonts/archivo-black-latin-ext-400-normal.woff2"), weight: "400" }),
  ...(["500", "700", "800"] as const).flatMap((w) => [
    loadFont({ family: "InterTight", url: staticFile(`fonts/inter-tight-latin-${w}-normal.woff2`), weight: w }),
    loadFont({ family: "InterTightExt", url: staticFile(`fonts/inter-tight-latin-ext-${w}-normal.woff2`), weight: w }),
  ]),
]);

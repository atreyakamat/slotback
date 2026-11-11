import { useColorScheme } from "react-native";

/** SlotBack brand: cream and green in light mode, ink and lime in dark. Lime is never used for text on cream. */
const brand = { ink: "#07140F", green: "#0F2E22", greenLight: "#1A4434", lime: "#C6F432", cream: "#F5EFE1", muted: "#8FA89B" };

const light = {
  bg: brand.cream,
  surface: "#FFFBF2",
  raised: "#EDE5D3",
  text: brand.ink,
  muted: "#55685E",
  border: "#E2D8C3",
  primary: brand.green,
  onPrimary: brand.cream,
  highlight: brand.lime,
  onHighlight: brand.ink,
  success: "#1F7A45",
  warning: "#9A5B00",
  danger: "#B42318",
};

const dark: typeof light = {
  bg: brand.ink,
  surface: brand.green,
  raised: brand.greenLight,
  text: brand.cream,
  muted: brand.muted,
  border: "#21463A",
  primary: brand.lime,
  onPrimary: brand.ink,
  highlight: brand.lime,
  onHighlight: brand.ink,
  success: "#7BDC9B",
  warning: "#F2B84B",
  danger: "#FF8A7A",
};

export type Theme = typeof light;
export { brand };

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = (n: number) => n * 4;

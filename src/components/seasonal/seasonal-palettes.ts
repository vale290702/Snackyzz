import type { CSSProperties } from "react";
import type { SeasonalTheme } from "../../../supabase/functions/_shared/seasonal-theme";
interface SeasonalPalette {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  tint: string;
  action: string;
  actionHover: string;
  onAction: string;
  highlight: string;
  secondary: string;
  gold: string;
}
export const seasonalPalettes: Record<
  Exclude<SeasonalTheme, "original">,
  SeasonalPalette
> = {
  valentines: {
    canvas: "#fcf0f1",
    surface: "#fff9f8",
    ink: "#4d2736",
    muted: "#825866",
    border: "#e6cbd2",
    tint: "#f4dfe5",
    action: "#9e3152",
    actionHover: "#842442",
    onAction: "#fff9f8",
    highlight: "#eeb6c7",
    secondary: "#b96d89",
    gold: "#ad8050",
  },
  easter: {
    canvas: "#f5f4e9",
    surface: "#fffdf4",
    ink: "#34452c",
    muted: "#5c684f",
    border: "#cfd5bd",
    tint: "#e6ead8",
    action: "#526b37",
    actionHover: "#405628",
    onAction: "#fffdf4",
    highlight: "#d1bde6",
    secondary: "#9f8aba",
    gold: "#a58a3a",
  },
  halloween: {
    canvas: "#f5edf2",
    surface: "#fff8ef",
    ink: "#301c3c",
    muted: "#72546d",
    border: "#dcc6d2",
    tint: "#ead9df",
    action: "#b14f17",
    actionHover: "#913c12",
    onAction: "#fff8ef",
    highlight: "#ffc18a",
    secondary: "#614766",
    gold: "#bd8644",
  },
  thanksgiving: {
    canvas: "#f7efe1",
    surface: "#fffaf0",
    ink: "#4a2d22",
    muted: "#7b5b43",
    border: "#dfcdb0",
    tint: "#eee0c8",
    action: "#99502e",
    actionHover: "#7c3c21",
    onAction: "#fffaf0",
    highlight: "#f2c779",
    secondary: "#9a7838",
    gold: "#ac8233",
  },
  christmas: {
    canvas: "#f3f3e8",
    surface: "#fffdf4",
    ink: "#193e31",
    muted: "#526458",
    border: "#c9d3c2",
    tint: "#e2e8da",
    action: "#9b363c",
    actionHover: "#812832",
    onAction: "#fffdf4",
    highlight: "#e8c98f",
    secondary: "#45654e",
    gold: "#a87928",
  },
  "new-year": {
    canvas: "#f6f0e2",
    surface: "#fffaf0",
    ink: "#30271f",
    muted: "#72614c",
    border: "#d9caab",
    tint: "#eee2c7",
    action: "#896124",
    actionHover: "#70501a",
    onAction: "#fffaf0",
    highlight: "#edd39a",
    secondary: "#876d42",
    gold: "#b28b40",
  },
};
type SeasonalStyle = CSSProperties & Record<`--${string}`, string>;
export function seasonalPaletteStyle(
  theme: SeasonalTheme,
): SeasonalStyle | undefined {
  if (theme === "original") return undefined;
  const p = seasonalPalettes[theme];
  return {
    "--cream": p.canvas,
    "--paper": p.surface,
    "--chocolate": p.ink,
    "--muted": p.muted,
    "--line": p.border,
    "--tint": p.tint,
    "--orange": p.action,
    "--orange-dark": p.actionHover,
    "--season-accent": p.action,
    "--season-ink": p.actionHover,
    "--season-secondary": p.secondary,
    "--season-soft": p.surface,
    "--season-wash": p.tint,
    "--season-gold": p.gold,
    "--season-action-ink": p.onAction,
    "--season-highlight": p.highlight,
  } satisfies SeasonalStyle;
}

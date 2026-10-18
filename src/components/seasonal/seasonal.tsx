"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SeasonalTheme } from "../../../supabase/functions/_shared/seasonal-theme";
import { seasonalCampaigns } from "./seasonal-campaigns";
import { seasonalPaletteStyle } from "./seasonal-palettes";
import { SeasonalMark } from "./seasonal-marks";
import "./seasonal.css";
const SeasonContext = createContext<SeasonalTheme>("original");
export function useSeasonalCampaign() {
  const theme = useContext(SeasonContext);
  return { theme, campaign: seasonalCampaigns[theme] };
}
export function SeasonalFeature() {
  const theme = useContext(SeasonContext);
  return theme === "original" ? <>s.</> : <SeasonalMark theme={theme} />;
}
export function SeasonalSurface({
  theme,
  children,
  page,
}: {
  theme: SeasonalTheme;
  children: ReactNode;
  page?: string;
}) {
  return (
    <SeasonContext.Provider value={theme}>
      <div
        className="season-shell"
        data-season={theme}
        data-season-page={page}
        style={seasonalPaletteStyle(theme)}
      >
        {children}
      </div>
    </SeasonContext.Provider>
  );
}
export function SeasonalDecor({
  placement = "hero",
}: {
  placement?: "hero" | "header" | "footer" | "sample" | "divider";
}) {
  const theme = useContext(SeasonContext);
  if (theme === "original") return null;
  const count =
    placement === "divider"
      ? 8
      : placement === "header" || placement === "footer"
        ? 6
        : 4;
  return (
    <div
      className={`season-decor season-decor--${placement}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <span className={`season-ornament season-ornament--${i}`} key={i}>
          <SeasonalMark theme={theme} variant={i} />
        </span>
      ))}
    </div>
  );
}

import { expect, test } from "vitest";
import {
  seasonalThemes,
  normalizeSeasonalTheme,
} from "../supabase/functions/_shared/seasonal-theme";
test("seasonal themes include every approved holiday and preserve a safe original fallback", () => {
  expect(Object.keys(seasonalThemes)).toEqual([
    "original",
    "valentines",
    "easter",
    "halloween",
    "thanksgiving",
    "christmas",
    "new-year",
  ]);
  expect(normalizeSeasonalTheme("christmas")).toBe("christmas");
  for (const value of ["unknown", "__proto__", null, {}, ""])
    expect(normalizeSeasonalTheme(value)).toBe("original");
});

import { createElement } from "react";
import { renderComponent } from "./render";
import {
  SeasonalSurface,
  SeasonalDecor,
} from "../src/components/seasonal/seasonal";
test("every celebration uses the same decorative rhythm with its own clean motif", () => {
  const motifs = {
    valentines: "heart",
    easter: "egg",
    halloween: "pumpkin",
    thanksgiving: "leaf",
    christmas: "tree",
    "new-year": "firework",
  } as const;
  for (const [theme, motif] of Object.entries(motifs)) {
    const html = renderComponent(SeasonalSurface, {
      theme: normalizeSeasonalTheme(theme),
      children: createElement(SeasonalDecor, { placement: "divider" }),
    });
    expect(html).toContain("season-decor--divider");
    expect((html.match(/<svg/g) ?? []).length).toBeGreaterThan(4);
    expect(html).toContain(`data-motif="${motif}"`);
    expect(html).toContain('aria-hidden="true"');
  }
});

import {
  seasonalPalettes,
  seasonalPaletteStyle,
} from "../src/components/seasonal/seasonal-palettes";
function luminance(hex: string) {
  const [r, g, b] = hex.match(/[a-f0-9]{2}/gi)!.map((value) => {
    const c = parseInt(value, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const l = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l[0] + 0.05) / (l[1] + 0.05);
}
test("every seasonal palette keeps body, secondary text and action states readable", () => {
  for (const palette of Object.values(seasonalPalettes)) {
    expect(contrast(palette.ink, palette.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.muted, palette.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.onAction, palette.action)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrast(palette.onAction, palette.actionHover),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.highlight, palette.ink)).toBeGreaterThanOrEqual(
      4.5,
    );
  }
});

test("original clears overrides while each holiday supplies a complete scoped palette", () => {
  expect(seasonalPaletteStyle("original")).toBeUndefined();
  for (const theme of Object.keys(seasonalPalettes)) {
    const style = seasonalPaletteStyle(normalizeSeasonalTheme(theme));
    expect(style?.["--cream"]).toBe(seasonalPalettes[theme].canvas);
    expect(style?.["--orange"]).toBe(seasonalPalettes[theme].action);
  }
});

import { seasonalCampaigns } from "../src/components/seasonal/seasonal-campaigns";
test("each seasonal campaign has its own copy and asset while original remains intact", () => {
  expect(seasonalCampaigns.original.emphasis).toBe("tan bien.");
  expect(seasonalCampaigns.original.image).toBe("/assets/hero-cookies.webp");
  for (const [theme, campaign] of Object.entries(seasonalCampaigns)) {
    expect(campaign.headline.length).toBeGreaterThan(8);
    expect(campaign.cta).toBeTruthy();
    if (theme !== "original") {
      expect(campaign.headline).not.toBe(seasonalCampaigns.original.headline);
      expect(campaign.image).toBe(`/assets/seasons/${theme}.webp`);
    }
  }
});

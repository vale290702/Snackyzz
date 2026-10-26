"use client";

import { ACCENT_COLOR_PATTERN, ACCENT_PALETTE } from "../../domain/fields";
import { NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";

/**
 * Keeps the native picker valid while the typed hex value is incomplete.
 * @param color The form's current accent, possibly half typed.
 * @returns The picker value, the matching palette swatch ("" for a custom color) and the palette.
 */
export function useAccentColorField(color: string) {
  const pickerColor = ACCENT_COLOR_PATTERN.test(color) ? color : NEW_PRODUCT_ACCENT_COLOR;
  const swatch = ACCENT_PALETTE.find((entry) => entry.value.toLowerCase() === color.toLowerCase());

  return { pickerColor, swatchValue: swatch?.value ?? "", palette: ACCENT_PALETTE };
}

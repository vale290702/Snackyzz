"use client";

import { useState } from "react";

import { ACCENT_COLOR_PATTERN, ACCENT_PALETTE } from "../../domain/fields";
import { NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";

/**
 * Preserves incomplete typed hex values while keeping the native picker valid.
 * @param initialColor Existing product accent.
 * @returns Typed value, picker value, the matching palette swatch ("" for a custom color) and
 * the shared change handler.
 */
export function useAccentColorField(initialColor: string) {
  const [color, setColor] = useState(initialColor);
  const pickerColor = ACCENT_COLOR_PATTERN.test(color) ? color : NEW_PRODUCT_ACCENT_COLOR;
  const swatch = ACCENT_PALETTE.find((entry) => entry.value.toLowerCase() === color.toLowerCase());

  return {
    color,
    pickerColor,
    swatchValue: swatch?.value ?? "",
    setColor,
    palette: ACCENT_PALETTE,
  };
}

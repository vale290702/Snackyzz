"use client";

import { useState } from "react";

import { ACCENT_COLOR_PATTERN, ACCENT_PALETTE } from "../../domain/fields";
import { NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";

/**
 * Preserves incomplete typed hex values while keeping the native picker valid.
 * @param initialColor Existing product accent.
 * @returns Typed value, picker value and shared change handler.
 */
export function useAccentColorField(initialColor: string) {
  const [color, setColor] = useState(initialColor);
  const pickerColor = ACCENT_COLOR_PATTERN.test(color) ? color : NEW_PRODUCT_ACCENT_COLOR;
  return { color, pickerColor, setColor, palette: ACCENT_PALETTE };
}

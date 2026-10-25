import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's default scales. Without these, `text-display` is read as a
// color and `rounded-control` / `shadow-float` never override each other. Mirror tokens.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "wordmark"],
      leading: ["display"],
      tracking: ["display"],
      radius: ["control", "surface", "round"],
      shadow: ["float"],
      container: ["page"],
    },
  },
});

/**
 * Joins class names and resolves conflicting Tailwind utilities.
 * @param inputs Class values in increasing priority.
 * @returns One class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const seasonalThemes = {
  original: {
    name: "Original Snackyzz",
    description: "Crema, chocolate y el naranja de siempre.",
  },
  valentines: {
    name: "San Valentín",
    description: "Corazones de trazo fino y detalles rosa frambuesa.",
  },
  easter: {
    name: "Pascua",
    description: "Huevos de Pascua, brotes y pequeños detalles pistacho.",
  },
  halloween: {
    name: "Halloween",
    description: "Calabazas y murciélagos de trazo fino, en naranja especiado.",
  },
  thanksgiving: {
    name: "Thanksgiving · Acción de Gracias",
    description: "Hojas y espigas de trazo fino en tonos cobre.",
  },
  christmas: {
    name: "Navidad",
    description: "Árboles de Navidad, esferas y pequeñas estrellas doradas.",
  },
  "new-year": {
    name: "Año Nuevo",
    description: "Destellos de trazo fino y detalles dorados para celebrar.",
  },
} as const;
export type SeasonalTheme = keyof typeof seasonalThemes;
export function isSeasonalTheme(value: unknown): value is SeasonalTheme {
  return typeof value === "string" && Object.hasOwn(seasonalThemes, value);
}
export function normalizeSeasonalTheme(value: unknown): SeasonalTheme {
  return isSeasonalTheme(value) ? value : "original";
}

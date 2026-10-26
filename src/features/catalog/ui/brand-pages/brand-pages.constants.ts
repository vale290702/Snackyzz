import type { ComponentType } from "react";

import { BakingStereoPage } from "./baking-stereo.component";
import type { BrandPageProps } from "./brand-page.types";

/**
 * Brands with a bespoke page, by slug. Every other brand gets the generic page; this lookup is
 * the only place a brand's slug may decide anything.
 */
export const BESPOKE_BRAND_PAGES: Readonly<Record<string, ComponentType<BrandPageProps>>> = {
  "baking-stereo": BakingStereoPage,
};

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import catalog from "@/i18n/messages/es-CR/catalog.json";

import { CatalogManagerSkeleton, CatalogShelfSkeleton } from "./catalog-skeleton.component";

describe("catalog loading", () => {
  it.each([CatalogShelfSkeleton, CatalogManagerSkeleton])("announces loading once", (Skeleton) => {
    render(
      <NextIntlClientProvider locale="es-CR" messages={{ catalog }}>
        <Skeleton />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Cargando catálogo…");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});

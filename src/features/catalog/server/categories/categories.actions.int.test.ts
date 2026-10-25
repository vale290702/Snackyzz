import { updateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SharedError } from "@/shared/lib/result";

import {
  archiveCategoryAction,
  createCategoryAction,
  updateCategoryAction,
} from "./categories.actions";
import { CatalogError } from "../../domain/errors";
import { CATALOG_CACHE_TAG } from "../mutation";
import { CatalogFixtures, DemoAdmin, SIGN_IN_REDIRECT } from "../testing/catalog-fixtures.helper";
import { RequestCookies } from "../testing/request-cookies.helper";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("category actions without catalog.manage", () => {
  it("send visitors to sign-in", async () => {
    const fields = { slug: CatalogFixtures.uniqueSlug("visitor"), name: "Visitante" };

    await expect(createCategoryAction(fields)).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuse staff", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);
    const fields = { slug: CatalogFixtures.uniqueSlug("staff"), name: "Personal" };

    expect(await createCategoryAction(fields)).toEqual({ ok: false, error: SharedError.Forbidden });
  });
});

describe("category actions for owners", () => {
  beforeEach(async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("create, rename and archive a category", async () => {
    const slug = CatalogFixtures.uniqueSlug("category");

    const created = await createCategoryAction({ slug, name: "Temporada", sortOrder: "2" });
    expect(created).toEqual({
      ok: true,
      value: expect.objectContaining({ slug, name: "Temporada", sortOrder: 2, archivedAt: null }),
    });
    if (!created.ok) {
      return;
    }

    const renamed = await updateCategoryAction({ id: created.value.id, slug, name: "Navidad" });
    expect(renamed.ok && renamed.value.name).toBe("Navidad");

    const archived = await archiveCategoryAction({ id: created.value.id });
    expect(archived.ok && archived.value.archivedAt).toEqual(expect.any(String));
    expect(updateTag).toHaveBeenCalledTimes(3);
    expect(updateTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG);

    expect(await updateCategoryAction({ id: created.value.id, slug, name: "Tarde" })).toEqual({
      ok: false,
      error: CatalogError.CategoryNotFound,
    });
  });

  it("report taken slugs", async () => {
    const fields = { slug: CatalogFixtures.uniqueSlug("taken"), name: "Repetida" };
    await createCategoryAction(fields);

    expect(await createCategoryAction(fields)).toEqual({
      ok: false,
      error: CatalogError.SlugTaken,
    });
    expect(updateTag).toHaveBeenCalledTimes(1);
  });
});

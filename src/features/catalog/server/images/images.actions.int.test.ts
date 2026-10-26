import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerClient } from "@/integrations/supabase/server-client";
import { TRUSTED_CLIENT_IP_HEADER } from "@/shared/lib/client-ip";
import { SharedError } from "@/shared/lib/result";

import { createCatalogImageUploadAction, registerCatalogImageUploadAction } from "./images.actions";
import { CatalogImagePurpose } from "../mutation";
import { CatalogFixtures, DemoAdmin } from "../testing/catalog-fixtures.helper";

const request = vi.hoisted(() => ({ jar: new Map<string, string>(), ip: "" }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ [TRUSTED_CLIENT_IP_HEADER]: request.ip }),
  cookies: async () => ({
    getAll: () => [...request.jar].map(([name, value]) => ({ name, value })),
    get: (name: string) =>
      request.jar.has(name) ? { name, value: request.jar.get(name) } : undefined,
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (value === "" || options?.maxAge === 0) {
        request.jar.delete(name);
        return;
      }

      request.jar.set(name, value);
    },
    delete: (name: string) => request.jar.delete(name),
  }),
}));
vi.mock("next/server", () => ({ connection: async () => undefined }));

const TINY_PNG = new URL("../../../../../tests/fixtures/media/tiny.png", import.meta.url);

function freshClientIp(): string {
  const groups = Array.from({ length: 3 }, () => randomInt(0x10000).toString(16));

  return `2001:db8::${groups.join(":")}`;
}

beforeEach(() => {
  request.jar.clear();
  request.ip = freshClientIp();
});

describe("catalog image uploads", () => {
  it("refuse purposes that are not catalog images, before any session check", async () => {
    const proof = { purpose: "payment_proof", mimeType: "image/png", sizeBytes: 10 };

    expect(await createCatalogImageUploadAction(proof)).toEqual({
      ok: false,
      error: "unsupported_purpose",
    });
    expect(await registerCatalogImageUploadAction({ purpose: "refund_proof" })).toEqual({
      ok: false,
      error: "unsupported_purpose",
    });
  });

  it("refuse staff, who may not manage the catalog", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);

    const result = await createCatalogImageUploadAction({
      purpose: CatalogImagePurpose.ProductImage,
      mimeType: "image/png",
      sizeBytes: 10,
    });

    expect(result).toEqual({ ok: false, error: SharedError.Forbidden });
  });

  it("upload and register a product image for owners", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
    const bytes = await readFile(TINY_PNG);
    const purpose = CatalogImagePurpose.ProductImage;

    const ticket = await createCatalogImageUploadAction({
      purpose,
      mimeType: "image/png",
      sizeBytes: bytes.byteLength,
    });
    if (!ticket.ok) {
      throw new Error(ticket.error);
    }

    const client = await createServerClient();
    const upload = await client.storage
      .from("catalog-images")
      .uploadToSignedUrl(ticket.value.objectPath, ticket.value.token, bytes, {
        contentType: "image/png",
      });
    expect(upload.error).toBeNull();

    const registered = await registerCatalogImageUploadAction({
      purpose,
      objectPath: ticket.value.objectPath,
    });

    expect(registered).toEqual({
      ok: true,
      value: expect.objectContaining({ purpose, mimeType: "image/png" }),
    });
  });
});

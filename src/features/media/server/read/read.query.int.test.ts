import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_SIGN_IN_PATH } from "@/features/access";
import { createServerClient } from "@/integrations/supabase/server-client";
import { createServiceClient } from "@/integrations/supabase/service-client";
import { SharedError } from "@/shared/lib/result";

import { PROOF_READ_SECONDS } from "./read.constants";
import { getSignedReadUrl, publicImageUrl } from "./read.query";
import { MediaError } from "../../domain/errors";
import { FilePurpose, ImageMime, ObjectPath, UPLOAD_POLICIES } from "../../domain/upload-policy";

// An in-memory stand-in for the request's cookie jar.
const jar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (value === "" || options?.maxAge === 0) {
        jar.delete(name);
        return;
      }

      jar.set(name, value);
    },
  }),
}));

vi.mock("next/server", () => ({ connection: async () => undefined }));

// Next's own redirect: runAction must let it through rather than report a failure.
const SIGN_IN_REDIRECT = { digest: expect.stringContaining(ADMIN_SIGN_IN_PATH) };

const service = createServiceClient();
const files = { proofId: "", catalogId: "" };
const stored: { bucket: string; objectPath: string }[] = [];

/**
 * Stores a fixture and its metadata directly, as a registered upload would be.
 */
async function storeFile(
  purpose: typeof FilePurpose.PaymentProof | typeof FilePurpose.ProductImage,
) {
  const bytes = await readFile("tests/fixtures/media/tiny.png");
  const { bucket } = UPLOAD_POLICIES[purpose];
  const objectPath = ObjectPath.create(purpose, ImageMime.Png, new Date(), randomUUID());

  const upload = await service.storage
    .from(bucket)
    .upload(objectPath, bytes, { contentType: ImageMime.Png });
  if (upload.error) {
    throw upload.error;
  }

  stored.push({ bucket, objectPath });
  const { data, error } = await service
    .schema("media")
    .from("files")
    .insert({
      bucket,
      object_path: objectPath,
      purpose,
      mime_type: ImageMime.Png,
      size_bytes: bytes.length,
      width: 1,
      height: 1,
      sha256: "read-query-int-test",
    })
    .select("id")
    .single();
  if (error) {
    throw error;
  }

  return data.id;
}

async function signInAs(email: string, password = "snackyzz-demo"): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

beforeAll(async () => {
  files.proofId = await storeFile(FilePurpose.PaymentProof);
  files.catalogId = await storeFile(FilePurpose.ProductImage);
});

beforeEach(() => {
  jar.clear();
});

afterAll(async () => {
  await service.schema("media").from("files").delete().in("id", Object.values(files));

  for (const { bucket, objectPath } of stored) {
    await service.storage.from(bucket).remove([objectPath]);
  }
});

describe("publicImageUrl", () => {
  it("returns a working public URL for a catalog image", async () => {
    const result = await publicImageUrl(files.catalogId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((await fetch(result.value)).status).toBe(200);
    }
  });

  it("never resolves a proof", async () => {
    expect(await publicImageUrl(files.proofId)).toEqual({
      ok: false,
      error: MediaError.FileNotFound,
    });
  });

  it("refuses an id that is not a UUID", async () => {
    expect(await publicImageUrl("../secret")).toEqual({
      ok: false,
      error: SharedError.InvalidInput,
    });
  });
});

describe("getSignedReadUrl", () => {
  it("sends visitors without an admin session to sign-in", async () => {
    await expect(getSignedReadUrl(files.proofId)).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("sends signed-in customers to sign-in", async () => {
    const email = `media-customer-${randomUUID()}@media.test`;
    const password = randomUUID();
    const customer = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (customer.error) {
      throw customer.error;
    }

    try {
      await signInAs(email, password);
      await expect(getSignedReadUrl(files.proofId)).rejects.toMatchObject(SIGN_IN_REDIRECT);
    } finally {
      await service.auth.admin.deleteUser(customer.data.user.id);
    }
  });

  it("gives staff a working URL that expires within five minutes", async () => {
    await signInAs("staff@snackyzz.test");

    const result = await getSignedReadUrl(files.proofId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect((await fetch(result.value)).status).toBe(200);
    const token = new URL(result.value).searchParams.get("token") ?? "";
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(PROOF_READ_SECONDS);
  });

  it("does not sign catalog images", async () => {
    await signInAs("staff@snackyzz.test");

    expect(await getSignedReadUrl(files.catalogId)).toEqual({
      ok: false,
      error: MediaError.FileNotFound,
    });
  });
});

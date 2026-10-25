import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_SIGN_IN_PATH } from "@/features/access";
import { createServerClient } from "@/integrations/supabase/server-client";
import { createServiceClient } from "@/integrations/supabase/service-client";
import { TRUSTED_CLIENT_IP_HEADER } from "@/shared/lib/client-ip";
import { SharedError } from "@/shared/lib/result";

import { createUploadAction, registerUploadAction } from "./upload.actions";
import { UPLOAD_RATE_LIMIT } from "./upload.constants";
import { MediaError } from "../../domain/errors";
import {
  FilePurpose,
  ImageMime,
  UPLOAD_POLICIES,
  type ImageMimeType,
  type UploadPurpose,
} from "../../domain/upload-policy";

// In-memory stand-ins for the request's cookie jar and headers.
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

// Next's own redirect: runAction must let it through rather than report a failure.
const SIGN_IN_REDIRECT = { digest: expect.stringContaining(ADMIN_SIGN_IN_PATH) };

const Fixture = {
  Photo: "photo-4032x3024.jpeg",
  OverPixelLimit: "over-pixel-limit.jpeg",
  TinyPng: "tiny.png",
  TinyWebp: "tiny.webp",
} as const;

const DemoAdmin = { Owner: "owner@snackyzz.test", Staff: "staff@snackyzz.test" } as const;
const DEMO_PASSWORD = "snackyzz-demo";

const service = createServiceClient();
const uploaded: { purpose: UploadPurpose; objectPath: string }[] = [];
const registeredIds: string[] = [];

async function fixture(name: (typeof Fixture)[keyof typeof Fixture]): Promise<Buffer> {
  return readFile(`tests/fixtures/media/${name}`);
}

async function signInAs(email: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error) {
    throw error;
  }
}

/**
 * A fresh documentation-range IPv6 address, so each test has its own rate-limit window.
 */
function freshClientIp(): string {
  const groups = Array.from({ length: 3 }, () => randomInt(0x10000).toString(16));

  return `2001:db8::${groups.join(":")}`;
}

type UploadOptions = {
  purpose?: UploadPurpose;
  mimeType?: ImageMimeType;
  sizeBytes?: number;
};

async function uploadBytes(bytes: Buffer, options: UploadOptions = {}): Promise<string> {
  const { purpose = FilePurpose.PaymentProof, mimeType = ImageMime.Jpeg } = options;
  const created = await createUploadAction({
    purpose,
    mimeType,
    sizeBytes: options.sizeBytes ?? bytes.length,
  });
  if (!created.ok) {
    throw new Error(created.error);
  }

  const { objectPath, token } = created.value;
  uploaded.push({ purpose, objectPath });
  const { error } = await service.storage
    .from(UPLOAD_POLICIES[purpose].bucket)
    .uploadToSignedUrl(objectPath, token, bytes, { contentType: mimeType });
  if (error) {
    throw error;
  }

  return objectPath;
}

async function isStored(purpose: UploadPurpose, objectPath: string): Promise<boolean> {
  const { error } = await service.storage
    .from(UPLOAD_POLICIES[purpose].bucket)
    .download(objectPath);

  return error === null;
}

beforeEach(() => {
  request.jar.clear();
  request.ip = freshClientIp();
});

afterAll(async () => {
  if (registeredIds.length) {
    await service.schema("media").from("files").delete().in("id", registeredIds);
  }

  for (const { purpose, objectPath } of uploaded) {
    await service.storage.from(UPLOAD_POLICIES[purpose].bucket).remove([objectPath]);
  }
});

describe("createUploadAction", () => {
  it("refuses purposes that cannot be uploaded", async () => {
    for (const input of [{ purpose: FilePurpose.MessageAttachment }, { purpose: "avatar" }, null]) {
      expect(await createUploadAction(input)).toEqual({
        ok: false,
        error: MediaError.UnsupportedPurpose,
      });
    }
  });

  it("refuses malformed or out-of-policy claims", async () => {
    const proof = UPLOAD_POLICIES[FilePurpose.PaymentProof];
    const invalid = { ok: false, error: SharedError.InvalidInput };

    const wrongType = { purpose: FilePurpose.PaymentProof, mimeType: 42, sizeBytes: 100 };
    const tooLarge = {
      purpose: FilePurpose.PaymentProof,
      mimeType: ImageMime.Jpeg,
      sizeBytes: proof.maxBytes + 1,
    };

    expect(await createUploadAction(wrongType)).toEqual(invalid);
    expect(await createUploadAction(tooLarge)).toEqual(invalid);
  });

  it("sends staff purposes without a session to sign-in", async () => {
    const input = { purpose: FilePurpose.RefundProof, mimeType: ImageMime.Png, sizeBytes: 100 };

    await expect(createUploadAction(input)).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuses catalog uploads to staff without catalog.manage", async () => {
    await signInAs(DemoAdmin.Staff);
    const input = { purpose: FilePurpose.ProductImage, mimeType: ImageMime.Jpeg, sizeBytes: 100 };

    expect(await createUploadAction(input)).toEqual({ ok: false, error: SharedError.Forbidden });
  });

  it("refuses upload URLs past the per-IP limit", async () => {
    const input = { purpose: FilePurpose.PaymentProof, mimeType: ImageMime.Jpeg, sizeBytes: 100 };

    for (let index = 0; index < UPLOAD_RATE_LIMIT.maxRequests; index++) {
      expect((await createUploadAction(input)).ok).toBe(true);
    }

    expect(await createUploadAction(input)).toEqual({ ok: false, error: MediaError.RateLimited });
  });
});

describe("registerUploadAction", () => {
  it("registers a 4032 × 3024 payment proof without exposing its path", async () => {
    const objectPath = await uploadBytes(await fixture(Fixture.Photo));

    const result = await registerUploadAction({ purpose: FilePurpose.PaymentProof, objectPath });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    registeredIds.push(result.value.id);
    expect(result.value).toMatchObject({ width: 4032, height: 3024, mimeType: ImageMime.Jpeg });
    expect(JSON.stringify(result.value)).not.toContain(objectPath);
  });

  it("returns the same file when registration is retried", async () => {
    const objectPath = await uploadBytes(await fixture(Fixture.Photo));
    const input = { purpose: FilePurpose.PaymentProof, objectPath };

    const first = await registerUploadAction(input);
    const retry = await registerUploadAction(input);

    if (first.ok) {
      registeredIds.push(first.value.id);
    }

    expect(retry).toEqual(first);
  });

  it.each([
    ["PNG", Fixture.TinyPng],
    ["WebP", Fixture.TinyWebp],
  ])("rejects and deletes a %s uploaded as a JPEG", async (_format, name) => {
    const objectPath = await uploadBytes(await fixture(name));

    const result = await registerUploadAction({ purpose: FilePurpose.PaymentProof, objectPath });

    expect(result).toEqual({ ok: false, error: MediaError.InvalidFileType });
    expect(await isStored(FilePurpose.PaymentProof, objectPath)).toBe(false);
  });

  it("rejects and deletes an SVG uploaded as a JPEG", async () => {
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    const objectPath = await uploadBytes(svg);

    const result = await registerUploadAction({ purpose: FilePurpose.PaymentProof, objectPath });

    expect(result).toEqual({ ok: false, error: MediaError.InvalidFileType });
    expect(await isStored(FilePurpose.PaymentProof, objectPath)).toBe(false);
  });

  it("rejects and deletes images over the pixel ceiling", async () => {
    const objectPath = await uploadBytes(await fixture(Fixture.OverPixelLimit));

    const result = await registerUploadAction({ purpose: FilePurpose.PaymentProof, objectPath });

    expect(result).toEqual({ ok: false, error: MediaError.InvalidDimensions });
    expect(await isStored(FilePurpose.PaymentProof, objectPath)).toBe(false);
  });

  it("rejects and deletes a truncated JPEG", async () => {
    const truncated = (await fixture(Fixture.Photo)).subarray(0, 100);
    const objectPath = await uploadBytes(truncated);

    const result = await registerUploadAction({ purpose: FilePurpose.PaymentProof, objectPath });

    expect(result).toEqual({ ok: false, error: MediaError.InvalidImage });
    expect(await isStored(FilePurpose.PaymentProof, objectPath)).toBe(false);
  });

  it("rejects and deletes a logo over its ceiling, though the shared bucket accepts it", async () => {
    await signInAs(DemoAdmin.Owner);
    const padding = Buffer.alloc(UPLOAD_POLICIES[FilePurpose.BrandLogo].maxBytes);
    const oversized = Buffer.concat([await fixture(Fixture.Photo), padding]);
    const objectPath = await uploadBytes(oversized, {
      purpose: FilePurpose.BrandLogo,
      sizeBytes: 100,
    });

    const result = await registerUploadAction({ purpose: FilePurpose.BrandLogo, objectPath });

    expect(result).toEqual({ ok: false, error: MediaError.FileTooLarge });
    expect(await isStored(FilePurpose.BrandLogo, objectPath)).toBe(false);
  });

  it("refuses a missing or tampered receipt and leaves the object alone", async () => {
    const objectPath = await uploadBytes(await fixture(Fixture.Photo));
    const input = { purpose: FilePurpose.PaymentProof, objectPath };
    const receipts = new Map(request.jar);
    const invalid = { ok: false, error: MediaError.InvalidUpload };

    request.jar.clear();
    expect(await registerUploadAction(input)).toEqual(invalid);

    for (const [name, value] of receipts) {
      request.jar.set(name, `${value}tampered`);
    }
    expect(await registerUploadAction(input)).toEqual(invalid);
    expect(await isStored(FilePurpose.PaymentProof, objectPath)).toBe(true);
  });

  it.each([FilePurpose.ProductImage, FilePurpose.BrandLogo])(
    "registers a WebP %s for the owner",
    async (purpose) => {
      await signInAs(DemoAdmin.Owner);
      const objectPath = await uploadBytes(await fixture(Fixture.TinyWebp), {
        purpose,
        mimeType: ImageMime.Webp,
      });

      const result = await registerUploadAction({ purpose, objectPath });

      expect(result).toMatchObject({ ok: true, value: { purpose, mimeType: ImageMime.Webp } });
      if (result.ok) {
        registeredIds.push(result.value.id);
      }
    },
  );

  it("registers a refund proof for staff with orders.decide", async () => {
    await signInAs(DemoAdmin.Staff);
    const objectPath = await uploadBytes(await fixture(Fixture.TinyPng), {
      purpose: FilePurpose.RefundProof,
      mimeType: ImageMime.Png,
    });

    const result = await registerUploadAction({ purpose: FilePurpose.RefundProof, objectPath });

    expect(result).toMatchObject({ ok: true, value: { purpose: FilePurpose.RefundProof } });
    if (result.ok) {
      registeredIds.push(result.value.id);
    }
  });
});

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_PENDING_RECEIPTS, RECEIPT_LIFETIME_SECONDS } from "./upload-receipt.constants";
import { issueReceipt, readReceipt } from "./upload-receipt.service";
import type { UploadClaims } from "./upload-receipt.types";
import { FilePurpose, ImageMime } from "../../domain/upload-policy";

const jar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));
vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { MEDIA_SIGNING_SECRET: "test-secret-with-at-least-32-characters" },
}));
vi.mock("@/shared/config/runtime", () => ({ isProduction: () => true }));

function claims(): UploadClaims {
  return {
    objectPath: `payment_proof/2026/10/${randomUUID()}.jpg`,
    purpose: FilePurpose.PaymentProof,
    mimeType: ImageMime.Jpeg,
    sizeBytes: 100,
    uploaderId: null,
  };
}

describe("upload receipts", () => {
  beforeEach(() => {
    jar.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the claims for the exact object they were issued for", async () => {
    const issued = claims();
    await issueReceipt(issued);

    expect(await readReceipt(issued.objectPath)).toMatchObject(issued);
    expect(await readReceipt(claims().objectPath)).toBeNull();
  });

  it("refuses an expired receipt", async () => {
    vi.useFakeTimers();
    const issued = claims();
    await issueReceipt(issued);

    vi.advanceTimersByTime(RECEIPT_LIFETIME_SECONDS * 1000 + 1);

    expect(await readReceipt(issued.objectPath)).toBeNull();
  });

  it("refuses a tampered payload", async () => {
    const issued = claims();
    await issueReceipt(issued);
    const [name = "", value = ""] = [...jar][0] ?? [];
    const [, signature] = value.split(".");
    const forged = Buffer.from(JSON.stringify({ ...issued, sizeBytes: 999 })).toString("base64url");

    jar.set(name, `${forged}.${signature}`);

    expect(await readReceipt(issued.objectPath)).toBeNull();
  });

  it("keeps at most the newest eight pending receipts", async () => {
    const oldest = claims();
    await issueReceipt(oldest);

    for (let index = 0; index < MAX_PENDING_RECEIPTS; index++) {
      await issueReceipt(claims());
    }

    expect(jar.size).toBe(MAX_PENDING_RECEIPTS);
    expect(await readReceipt(oldest.objectPath)).toBeNull();
  });
});

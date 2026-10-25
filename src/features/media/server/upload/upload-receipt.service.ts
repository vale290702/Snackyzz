import "server-only";

import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { isProduction } from "@/shared/config/runtime";

import {
  MAX_PENDING_RECEIPTS,
  RECEIPT_COOKIE_PREFIX,
  RECEIPT_LIFETIME_SECONDS,
} from "./upload-receipt.constants";
import { uploadReceiptSchema } from "./upload-receipt.schema";
import type { UploadClaims, UploadReceipt } from "./upload-receipt.types";
import { MediaSigning, SigningScope } from "../signing";

type CookieJar = Awaited<ReturnType<typeof cookies>>;

/**
 * Records in a signed HttpOnly cookie what this browser may register. Registration requires
 * the receipt, so nobody can register or delete an object issued to another caller.
 * @param claims The object path, purpose, format, size and uploader the URL was issued for.
 * @returns Once the cookie is set.
 */
export async function issueReceipt(claims: UploadClaims): Promise<void> {
  const jar = await cookies();
  evictOldestReceipts(jar);

  const receipt: UploadReceipt = {
    ...claims,
    expiresAt: Date.now() + RECEIPT_LIFETIME_SECONDS * 1000,
  };
  jar.set(receiptCookieName(claims.objectPath), encode(receipt), {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    path: "/",
    maxAge: RECEIPT_LIFETIME_SECONDS,
  });
}

/**
 * Reads this browser's receipt for an object.
 * @param objectPath The object the browser wants to register.
 * @returns The authentic, unexpired receipt, or null.
 */
export async function readReceipt(objectPath: string): Promise<UploadReceipt | null> {
  const value = (await cookies()).get(receiptCookieName(objectPath))?.value;
  if (!value) {
    return null;
  }

  const receipt = decode(value);
  const isCurrent = receipt?.objectPath === objectPath && receipt.expiresAt > Date.now();
  return isCurrent ? receipt : null;
}

function evictOldestReceipts(jar: CookieJar): void {
  // Browsers send older cookies first. Keep room for the receipt about to be issued.
  const pending = jar.getAll().filter((cookie) => cookie.name.startsWith(RECEIPT_COOKIE_PREFIX));
  const overflow = pending.length - (MAX_PENDING_RECEIPTS - 1);

  for (const cookie of pending.slice(0, Math.max(overflow, 0))) {
    jar.delete(cookie.name);
  }
}

function receiptCookieName(objectPath: string): string {
  return RECEIPT_COOKIE_PREFIX + createHash("sha256").update(objectPath).digest("hex");
}

function encode(receipt: UploadReceipt): string {
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");

  return `${payload}.${MediaSigning.sign(SigningScope.UploadReceipt, payload)}`;
}

function decode(value: string): UploadReceipt | null {
  const [payload = "", signature = ""] = value.split(".");
  if (!MediaSigning.verify(SigningScope.UploadReceipt, payload, signature)) {
    return null;
  }

  // An authentic payload was written by encode(), so it is valid JSON.
  const parsed = uploadReceiptSchema.safeParse(
    JSON.parse(Buffer.from(payload, "base64url").toString()),
  );
  return parsed.success ? parsed.data : null;
}

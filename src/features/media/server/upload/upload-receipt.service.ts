import "server-only";

import { errors, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { isProduction } from "@/shared/config/runtime";

import {
  MAX_PENDING_RECEIPTS,
  RECEIPT_ALGORITHM,
  RECEIPT_COOKIE_PREFIX,
  RECEIPT_LIFETIME_SECONDS,
} from "./upload-receipt.constants";
import { uploadReceiptClaimsSchema } from "./upload-receipt.schema";
import type { UploadReceipt } from "./upload-receipt.types";
import { MediaSigning, SigningScope } from "../signing";

type CookieJar = Awaited<ReturnType<typeof cookies>>;

/**
 * Records in a signed HttpOnly cookie what this browser may register. Registration requires
 * the receipt, so nobody can register or delete an object issued to another caller.
 * @param receipt The object path, purpose, format, size and uploader the URL was issued for.
 * @returns Once the cookie is set.
 */
export async function issueReceipt(receipt: UploadReceipt): Promise<void> {
  const { objectPath, ...claims } = receipt;
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: RECEIPT_ALGORITHM })
    .setAudience(SigningScope.UploadReceipt)
    .setSubject(objectPath)
    .setExpirationTime(`${RECEIPT_LIFETIME_SECONDS}s`)
    .sign(MediaSigning.key());

  const jar = await cookies();
  evictOldestReceipts(jar);
  jar.set(receiptCookieName(objectPath), token, {
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
 * @returns The authentic, unexpired receipt for exactly this object, or null.
 */
export async function readReceipt(objectPath: string): Promise<UploadReceipt | null> {
  const token = (await cookies()).get(receiptCookieName(objectPath))?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, MediaSigning.key(), {
      algorithms: [RECEIPT_ALGORITHM],
      audience: SigningScope.UploadReceipt,
      subject: objectPath,
    });

    return uploadReceiptClaimsSchema.parse(payload);
  } catch (error) {
    // Forged, tampered, expired or issued for another object.
    if (error instanceof errors.JOSEError) {
      return null;
    }

    throw error;
  }
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

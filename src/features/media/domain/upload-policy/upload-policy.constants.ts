import type { Permission } from "@/features/access";

import type { ImageMimeType, UploadPolicy, UploadPurpose } from "./upload-policy.types";

const MEBIBYTE = 1024 * 1024;

/**
 * Every value of `media.file_purpose`; a unit test keeps this list in step with SQL.
 */
export const FilePurpose = {
  PaymentProof: "payment_proof",
  RefundProof: "refund_proof",
  ProductImage: "product_image",
  BrandLogo: "brand_logo",
  MessageAttachment: "message_attachment",
} as const;

/**
 * Purposes that can be uploaded today. Message attachments wait for the messaging feature.
 */
export const UPLOAD_PURPOSES = [
  FilePurpose.PaymentProof,
  FilePurpose.RefundProof,
  FilePurpose.ProductImage,
  FilePurpose.BrandLogo,
] as const;

/**
 * Image formats the media feature accepts. SVG is never accepted.
 */
export const ImageMime = {
  Jpeg: "image/jpeg",
  Png: "image/png",
  Webp: "image/webp",
} as const;

/**
 * All accepted image formats, for schemas.
 */
export const IMAGE_MIME_TYPES = [ImageMime.Jpeg, ImageMime.Png, ImageMime.Webp] as const;

/**
 * File extension used in object paths for each accepted format.
 */
export const IMAGE_EXTENSION: Record<ImageMimeType, string> = {
  [ImageMime.Jpeg]: "jpg",
  [ImageMime.Png]: "png",
  [ImageMime.Webp]: "webp",
};

/**
 * Storage buckets provisioned by `supabase/migrations/*_media_buckets.sql`.
 */
export const MediaBucket = {
  PaymentProofs: "payment-proofs",
  RefundProofs: "refund-proofs",
  CatalogImages: "catalog-images",
} as const;

/**
 * Permissions that guard staff uploads. Payment proofs come from customers and need none.
 */
export const UploadPermission = {
  RefundProofs: "orders.decide",
  Catalog: "catalog.manage",
} as const satisfies Record<string, Permission>;

const PROOF_FORMATS: readonly ImageMimeType[] = [ImageMime.Jpeg, ImageMime.Png];
const CATALOG_FORMATS: readonly ImageMimeType[] = IMAGE_MIME_TYPES;

// Binary ceilings: 12 MiB of pixels admits an ordinary 4032 × 3024 phone photo.
const PHOTO_LIMITS = { maxBytes: 5 * MEBIBYTE, maxPixels: 12 * MEBIBYTE };
const LOGO_LIMITS = { maxBytes: 2 * MEBIBYTE, maxPixels: 4 * MEBIBYTE };

/**
 * Where each purpose is stored, who may upload it and which images it accepts.
 */
export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
  [FilePurpose.PaymentProof]: {
    bucket: MediaBucket.PaymentProofs,
    permission: null,
    mimeTypes: PROOF_FORMATS,
    ...PHOTO_LIMITS,
  },
  [FilePurpose.RefundProof]: {
    bucket: MediaBucket.RefundProofs,
    permission: UploadPermission.RefundProofs,
    mimeTypes: PROOF_FORMATS,
    ...PHOTO_LIMITS,
  },
  [FilePurpose.ProductImage]: {
    bucket: MediaBucket.CatalogImages,
    permission: UploadPermission.Catalog,
    mimeTypes: CATALOG_FORMATS,
    ...PHOTO_LIMITS,
  },
  [FilePurpose.BrandLogo]: {
    bucket: MediaBucket.CatalogImages,
    permission: UploadPermission.Catalog,
    mimeTypes: CATALOG_FORMATS,
    ...LOGO_LIMITS,
  },
};

/**
 * Private purposes, readable only through short-lived signed URLs.
 */
export const PROOF_PURPOSES: ReadonlySet<string> = new Set([
  FilePurpose.PaymentProof,
  FilePurpose.RefundProof,
]);

/**
 * Public purposes, readable by anyone through the catalog bucket.
 */
export const CATALOG_PURPOSES: ReadonlySet<string> = new Set([
  FilePurpose.ProductImage,
  FilePurpose.BrandLogo,
]);

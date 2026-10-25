import { describe, expect, it } from "vitest";

import { Constants } from "@/integrations/supabase/database.types";

import { FilePurpose, ImageMime, UPLOAD_POLICIES } from "./upload-policy.constants";
import { createUploadInputSchema, uploadTargetSchema } from "./upload-policy.schema";
import { MediaError } from "../errors";

function issueMessages(input: unknown): string[] {
  const parsed = createUploadInputSchema.safeParse(input);

  return parsed.success ? [] : parsed.error.issues.map((issue) => issue.message);
}

describe("upload policies", () => {
  it("cover the same purposes as media.file_purpose", () => {
    expect(Object.values(FilePurpose).sort()).toEqual(
      [...Constants.media.Enums.file_purpose].sort(),
    );
  });
});

describe("uploadTargetSchema", () => {
  it("reports unsupported_purpose for message attachments and unknown purposes", () => {
    for (const purpose of [FilePurpose.MessageAttachment, "avatar", 42]) {
      const parsed = uploadTargetSchema.safeParse({ purpose });

      expect(parsed.error?.issues[0]?.message).toBe(MediaError.UnsupportedPurpose);
    }
  });
});

describe("createUploadInputSchema", () => {
  const photo = UPLOAD_POLICIES[FilePurpose.PaymentProof];
  const logo = UPLOAD_POLICIES[FilePurpose.BrandLogo];

  it("accepts a JPEG proof at the byte ceiling", () => {
    const input = {
      purpose: FilePurpose.PaymentProof,
      mimeType: ImageMime.Jpeg,
      sizeBytes: photo.maxBytes,
    };

    expect(issueMessages(input)).toEqual([]);
  });

  it("reports invalid_file_type for WebP proofs and SVG", () => {
    const webpProof = {
      purpose: FilePurpose.PaymentProof,
      mimeType: ImageMime.Webp,
      sizeBytes: 10,
    };
    const svgLogo = { purpose: FilePurpose.BrandLogo, mimeType: "image/svg+xml", sizeBytes: 10 };

    expect(issueMessages(webpProof)).toEqual([MediaError.InvalidFileType]);
    expect(issueMessages(svgLogo)).toEqual([MediaError.InvalidFileType]);
  });

  it("reports file_too_large past each purpose's ceiling", () => {
    const largeProof = {
      purpose: FilePurpose.PaymentProof,
      mimeType: ImageMime.Jpeg,
      sizeBytes: photo.maxBytes + 1,
    };
    const largeLogo = {
      purpose: FilePurpose.BrandLogo,
      mimeType: ImageMime.Webp,
      sizeBytes: logo.maxBytes + 1,
    };

    expect(issueMessages(largeProof)).toEqual([MediaError.FileTooLarge]);
    expect(issueMessages(largeLogo)).toEqual([MediaError.FileTooLarge]);
  });

  it("admits a 4032 × 3024 photo for proofs and product images", () => {
    for (const purpose of [FilePurpose.PaymentProof, FilePurpose.ProductImage] as const) {
      expect(4032 * 3024).toBeLessThanOrEqual(UPLOAD_POLICIES[purpose].maxPixels);
    }

    expect(4032 * 3024).toBeGreaterThan(logo.maxPixels);
  });
});

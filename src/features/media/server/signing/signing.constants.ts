/**
 * Separates the messages signed with `MEDIA_SIGNING_SECRET`, so a signature made for one use
 * can never verify as another.
 */
export const SigningScope = {
  RateKey: "media-rate-key",
  UploadReceipt: "media-upload-receipt",
} as const;

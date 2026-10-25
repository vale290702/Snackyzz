import type { z } from "zod";

import type { uploadReceiptSchema } from "./upload-receipt.schema";

/**
 * A verified upload receipt.
 */
export type UploadReceipt = z.output<typeof uploadReceiptSchema>;

/**
 * The claims a receipt records; the expiry is added when it is issued.
 */
export type UploadClaims = Omit<UploadReceipt, "expiresAt">;

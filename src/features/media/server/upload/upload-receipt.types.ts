import type { z } from "zod";

import type { uploadReceiptClaimsSchema } from "./upload-receipt.schema";

/**
 * What the server promised a browser when it issued an upload URL.
 */
export type UploadReceipt = z.output<typeof uploadReceiptClaimsSchema>;

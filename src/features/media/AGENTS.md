# features/media

## Purpose

Uploaded files: signed upload URLs, validation, metadata records (`media.files`), signed read URLs, and orphan cleanup.

## Owns / does not own

- **Owns:** schema `media` (files), bucket policies, upload rules per purpose, and the cleanup of unreferenced proofs.
- **Does not own:** what a file means. Payments, refunds, products and brands hold the `*_file_id` FK.

## Public API (`index.ts`)

- Types: `FileRef`, `FilePurpose`
- Server: `createUploadAction(purpose, claimedMime, claimedSize)`, `registerUploadAction(purpose, objectPath)`, `getSignedReadUrl(fileId)` (admin, short-lived), `publicImageUrl(fileId)`
- UI: `FileDropzone`, `ProofPreview`

## Invariants

- Upload rules per purpose live in `domain/upload-rules.ts`. Payment and refund proofs: JPG/PNG, ≤ 5 MB, ≤ 12 MP (Q-06).
- Claims from the browser are **re-checked** after upload against the stored object (real mime from magic bytes, size, dimensions). Failing objects are deleted.
- Proof buckets are private; read URLs expire within 5 minutes and are only issued after `requirePermission("orders.view")`.
- Object paths are server-generated (`<purpose>/<yyyy>/<mm>/<uuid>.<ext>`); never use client file names.
- Unreferenced `payment_proof` files older than 24 h are deleted by the cleanup job.

## Dependencies

`src/integrations/supabase` (storage), `access`.

## Testing

- Unit: upload rules, magic-byte sniffing.
- Integration: register rejects oversized or wrong-type objects and deletes them.

## Gotchas

- Customers upload anonymously, so rate-limit `createUploadAction` together with checkout.

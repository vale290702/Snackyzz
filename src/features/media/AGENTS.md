# features/media

## Purpose and ownership

Owns `media.files`, the media storage buckets and policies, upload validation and file URLs. Payments, refunds, products and brands will hold file FKs; attaching those records is outside this item.

## Public API (`index.ts`)

- Types: `FileRef` (id, purpose, MIME type, byte count, width, height; never a storage path), `FilePurpose` (the five `media.file_purpose` values), `UploadTicket`.
- `createUploadAction({ purpose, mimeType, sizeBytes })` → `ActionResult<UploadTicket>` (`{ objectPath, signedUrl, token }`). Upload the bytes directly with the token, then register.
- `registerUploadAction({ purpose, objectPath })` → `ActionResult<FileRef>` after checking the receipt, the bytes and the decoded image.
- `getSignedReadUrl(fileId)` → `ActionResult<string>`: a proof URL valid for five minutes; requires `orders.view`.
- `publicImageUrl(fileId)` → `ActionResult<string>` for catalog images, resolved with the anon client and RLS.
- All entry points run in `runAction`; Next redirects and 403 interrupts propagate.

## Layout

- `domain/upload-policy/`: `UPLOAD_POLICIES` (bucket, permission, formats and ceilings per purpose) and the `FilePurpose`, `ImageMime`, `MediaBucket` and `UploadPermission` constants; browser-safe input schemas whose messages are `MediaError` codes; `ObjectPath`.
- `domain/errors/`: `MediaError`; Spanish copy in `errors.media`.
- `server/upload/`: `upload.actions.ts` picks the path from the policy (anonymous for payment proofs, otherwise the capability for the policy's permission); `create-upload` and `register-upload` services orchestrate admission, receipts, storage, inspection and metadata.
- `server/files/` (`media.files` repository), `server/storage/` (bucket I/O; provider failures become `storage_unavailable`), `server/signing/` (`MEDIA_SIGNING_SECRET`: scoped HMAC for rate keys, key bytes for receipts), `server/read/` (read queries).
- Shared pieces: `@/shared/lib/client-ip` resolves the trusted client IP; `@/integrations/supabase/rate-limit` is the atomic limiter.

## Invariants

- To add or change a purpose, edit its row in `UPLOAD_POLICIES` and the bucket migration; nothing else branches on purpose names. A unit test keeps `FilePurpose` equal to the SQL enum.
- Proofs: JPG/PNG, 5 MiB, 12 MiB of pixels. Product images: the same plus WebP. Logos: JPG/PNG/WebP, 2 MiB and 4 MiB of pixels. 12 MiB of pixels admits a 4032×3024 photo. No SVG or animated images.
- `message_attachment` exists in SQL but is not in `UPLOAD_PURPOSES`, so actions answer `unsupported_purpose`. Its bucket waits for messaging.
- `payment-proofs` and `refund-proofs` are private; `catalog-images` is public-read. Only payment proofs are anonymous. Refund proofs need `orders.decide` and catalog images `catalog.manage`; capabilities check the permission before parsing, and also refuse purposes their permission does not guard. Registration re-authorizes.
- Object keys are `<purpose>/<yyyy>/<mm>/<uuid-v4>.<ext>`, generated on the server. Signed upload tokens never overwrite. Client file names never reach a path.
- An HttpOnly, SameSite=Strict receipt (an HS256 JWT via jose; subject = path, audience pinned) binds the path, purpose, format, size and uploader to the browser for two hours. At most eight receipts are kept; a ninth evicts the oldest, whose upload must restart. Retried registrations return the same record (unique bucket and path; files are immutable).
- Registration re-reads the object and requires: size within the ceiling and equal to the claim; the format detected from content (file-type), the stored content type and the claim all agree; a single frame within the pixel ceiling; a clean full decode. Rejected objects are deleted; a failed deletion is `unexpected`, never reported as cleaned up. Never log paths, URLs, bytes or receipts.
- Upload URLs are limited to 20 per 10 minutes per client IP, keyed by an HMAC of the IP. Production trusts only Vercel's overwritten `x-vercel-forwarded-for`; a missing or invalid IP, or a limiter failure, refuses the upload. Local development falls back to loopback.

## Dependencies and tests

Depends on `access`, Supabase repositories and adapters, `sharp`, `jose` and `file-type` (ADR 0011). Unit tests cover the schemas, paths, signing, receipts and admission. Integration tests mock only Next request state and use real Auth, Storage and Postgres for uploads, rejected objects, receipts, limits and reads. Fixtures live in `tests/fixtures/media/`. pgTAP covers the enum, columns, grants, RLS and the limiter.

## Follow-ups

`FileDropzone` and `ProofPreview` ship with checkout and order review under the Forms and Server Actions standard, reusing `createUploadInputSchema`. Jobs own orphan payment-proof cleanup after 24 hours. Attachments to products, payments and refunds, and messaging uploads, are deferred. Telegram will need a trusted server ingestion entry point, since registration requires a browser receipt.

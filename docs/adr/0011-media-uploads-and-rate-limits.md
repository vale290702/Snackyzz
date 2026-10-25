# 0011. Validate uploaded images before registration and rate-limit URL issuance

- **Status:** proposed
- **Date:** 2026-10-25
- **Approver:** Alejandro Loaiza
- **Refs:** ER §4, Q-06, ADRs 0007, 0008 and 0010

## Context

Anonymous customers upload payment proofs directly to Supabase Storage. Browser MIME, byte counts and filenames cannot establish the object's contents or authorize another caller to register/delete it. Serverless instances need a shared atomic admission limit. Catalog limits, WebP support, the limiter schema and sharp dependency were explicitly approved for this work item.

## Decision

Keep all five `media.file_purpose` values and exactly the ER file columns, including nullable `uploaded_by` referencing `access.admins`. Files are immutable (`created_at` only); the unique `(bucket, object_path)` constraint makes registration retryable. Provision private `payment-proofs`/`refund-proofs` and public-read `catalog-images`. Defer the messaging bucket and reject its purpose with `unsupported_purpose`.

Generate UTC `<purpose>/<yyyy>/<mm>/<uuid-v4>.<ext>` paths exclusively on the server. One upload-policy table per purpose (bucket, required permission, formats, byte and pixel ceilings) drives validation, authorization and storage. Claims are validated by a browser-safe domain schema whose issue messages are media error codes, so a file picker can report them before sending; the server re-parses and answers `invalid_input` to anything that bypassed it. Then it issues a non-upserting signed upload token. Supabase tokens last [two hours](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl). A two-hour signed HttpOnly/SameSite=Strict cookie binds the path, purpose, MIME, byte count and admin id to its browser. Retain at most eight receipts to bound header size; older pending uploads must restart. This preserves the requested action signatures without adding a pending-uploads table. Receipt HMACs use a distinct message prefix from rate keys. Recheck admin permission at registration; anonymous uploads are only payment proofs.

Registration downloads the object, checks its actual byte count and magic bytes against the original claims and stored MIME, then uses sharp to fully decode it under a pixel limit. Reject corrupt, animated, wrong-type, oversized or over-pixel-limit images and delete them. Compute SHA-256 of the accepted original bytes and insert metadata; return a minimal FileRef. Storage I/O and metadata queries remain in the media repository. All public server entry points use runAction and log only safe step names. Admin mutations use capabilities with existing `orders.decide` or `catalog.manage`; no permission enum changes. Proof reads require `orders.view`, RLS and a 300-second signed URL; public reads use the anon client.

Byte/pixel ceilings are explicit binary quantities: proofs and products allow 5 × 1024² bytes and 12 × 1024² pixels (so 4032×3024 passes); logos allow 2 × 1024² bytes and 4 × 1024² pixels. Proofs accept JPG/PNG; products/logos also accept WebP. SVG is unsupported. Bucket limits reject proof/product byte oversize early; registration independently enforces limits, including the smaller logo ceiling in the shared bucket.

The approved `private.rate_limits` table has one row per scoped HMAC key. `private.consume_rate_limit` uses one conditional INSERT … ON CONFLICT UPDATE to admit at most 20 requests in a fixed 600-second window; denied requests do not increment. The function is security definer with an empty search path, executable only by service_role. The table itself has RLS and no API-role privileges. An invoker wrapper `public.consume_rate_limit`, also executable only by service_role, lets PostgREST call it without exposing `private`. The reusable Supabase adapter accepts key and limits from the feature. Errors fail closed.

Keys are `media-upload:` plus HMAC-SHA256 of the canonical IP under `MEDIA_SIGNING_SECRET`; receipts and rate keys sign under distinct scopes, so neither verifies as the other. Production reads only [Vercel's overwritten IP header](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for), rejecting missing/invalid values; localhost falls back to loopback. Rotating the secret resets rate keys and invalidates outstanding receipts. No IP, digest, URL, path or contents are logged. New Vercel variable: `MEDIA_SIGNING_SECRET` (at least 32 cryptographically random characters), set separately in Preview and Production. Add `media` to hosted Data API exposed schemas when applying migrations; local config and db:types include it.

## Alternatives

- In-memory counters fail across serverless instances and restarts. Redis adds another provider for a low-volume shop; the existing database can serialize one upsert cheaply.
- A plain IP hash is enumerable. HMAC protects the stored identifier while keeping deterministic admission keys.
- Header parsing alone cannot reject corrupt compressed image data. sharp was approved as a direct dependency instead of writing and maintaining decoders.
- Trusting arbitrary registration paths permits registration or deletion of another caller's object. Pending-upload rows would solve ownership but change the ER shape; signed browser receipts avoid that additional table.

## Consequences and follow-ups

Catalog objects are publicly reachable as soon as Storage accepts them, before registration; only validated rows are discoverable through the feature API. Signed upload URLs and receipts are bearer credentials and must stay out of logs. A leaked token cannot overwrite an existing object. Full decoding adds CPU work but is bounded by byte and pixel ceilings.

Fixed windows can allow a burst near a boundary and users behind one NAT share a limit. The private limiter table retains one opaque row per encountered key; retention can be handled with the jobs work item. No scheduler is added here.

Defer FileDropzone/ProofPreview (checkout and order review, using the Forms and Server Actions standard), orphan proof cleanup (jobs, unreferenced payment proofs after 24 hours), and attaching files to products/payments/refunds. Messaging owns its bucket and trusted server ingestion API. No e2e journey exists yet.

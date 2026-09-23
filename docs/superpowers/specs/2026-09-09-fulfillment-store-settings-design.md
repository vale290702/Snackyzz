# Fulfillment and Store Settings Design

## Goal

Let Snackyzz administrators manage customer-facing store details and pickup locations, and require every checkout to record either pickup or Uber delivery instructions.

## Data and security

`store_settings` remains the single source of truth for SINPE, contact, social, and delivery settings. It gains WhatsApp, public email, Instagram, Uber-delivery enabled, and delivery-disclaimer fields. `sales_points` gains an `active` flag. Only active locations are public; authenticated members of `admin_users` manage all settings and locations through a new Edge Function.

Orders store an immutable fulfillment snapshot: `fulfillment_type` (`pickup` or `uber`), pickup location id/name/address when applicable, or the customer's delivery address. The order creation function validates the selected active location or the delivery address and snapshots it so later location edits do not alter existing orders.

## Customer flow

Checkout presents two accessible choices. Pickup requires an active location and shows its address and hours. Uber delivery requires a customer address and displays: “El costo del servicio de mensajería por Uber corre por cuenta del cliente y se paga por separado.” The cart summary also reflects the selected method.

The success page includes a WhatsApp link when a valid number is configured. Its prefilled Spanish message references the order number. The footer uses the settings returned by the catalog API.

## Administration

The admin shell adds “Configuración”. Administrators can edit SINPE details, WhatsApp, email, Instagram, Uber availability, and the delivery disclaimer. On the same page they can create, edit, archive, restore, and position pickup locations.

Order detail shows the fulfillment snapshot. The interface explains when email delivery is unavailable because the provider secrets are absent, while provider secrets remain exclusively in Supabase.

## Email diagnosis

The current project lacks `RESEND_API_KEY` and `FROM_EMAIL`; the Edge Function intentionally marks confirmation delivery as failed in that state. A verified Resend sender and API key must be configured as Supabase secrets before retrying a failed email.

## Validation

Unit/render tests cover settings, location forms, checkout requirements, order payloads, and WhatsApp URLs. Database and Edge Function tests cover authorization and fulfillment snapshots. Playwright covers responsive customer and admin flows. Production build and the complete existing suite must pass.

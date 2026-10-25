create type media.file_purpose as enum (
  'payment_proof',
  'refund_proof',
  'product_image',
  'brand_logo',
  'message_attachment'
);

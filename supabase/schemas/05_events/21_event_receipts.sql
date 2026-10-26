-- Delivery bookkeeping, not admin-edited data; processed_at records successful delivery only.
create table events.event_receipts (
  consumer text not null,
  event_id uuid not null,
  status events.receipt_status not null,
  attempts integer not null default 1,
  last_error text,
  processed_at timestamptz,

  constraint event_receipts_pkey primary key (consumer, event_id),
  constraint event_receipts_event_id_fkey foreign key (event_id)
    references events.domain_events (id),
  constraint event_receipts_consumer_check check (char_length(btrim(consumer)) between 1 and 100),
  constraint event_receipts_attempts_check check (attempts between 1 and 5),
  constraint event_receipts_outcome_check check (
    (status = 'processed' and processed_at is not null and last_error is null)
    or (status = 'failed' and processed_at is null and last_error is not null)
  )
);

create index event_receipts_event_id_idx on events.event_receipts (event_id);

alter table events.event_receipts enable row level security;

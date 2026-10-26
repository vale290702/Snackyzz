-- btree_gist lets exclusion constraints combine equality on plain columns with range overlap
-- (fulfillment hours may not overlap on the same weekday).
create extension if not exists btree_gist with schema extensions;

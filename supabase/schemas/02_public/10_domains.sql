-- Money in whole Costa Rican colones (DB-04).
create domain public.amount_crc as integer
  constraint amount_crc_check check (value >= 0);

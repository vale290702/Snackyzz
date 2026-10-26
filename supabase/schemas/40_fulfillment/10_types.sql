-- A span of wall-clock time within one day, so hour rows can be compared with range operators.
create type fulfillment.time_range as range (
  subtype = time
);

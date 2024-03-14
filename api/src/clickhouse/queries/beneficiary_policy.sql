INSERT INTO "beneficiary_policy" (
  "version",
  "timestamp",
  "change_index",
  "lifetime_pledged",
  "lifetime_withdrawn",
  "amount_available",
  "pledgers_count"
)
SELECT
  "version",
  "timestamp",
  "change_index",
  "lifetime_pledged",
  "lifetime_withdrawn",
  "amount_available",
  "pledgers_count"
FROM
  input('
    version UInt64,
    timestamp UInt64,
    change_index UInt64,
    lifetime_pledged UInt64,
    lifetime_withdrawn UInt64,
    amount_available UInt64,
    pledgers_count UInt64,
  ')
  FORMAT Parquet
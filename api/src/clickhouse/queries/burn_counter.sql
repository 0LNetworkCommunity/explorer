INSERT INTO "burn_counter" (
  "version",
  "timestamp",
  "change_index",

  "lifetime_burned",
  "lifetime_recycled"
)
SELECT
  "version",
  "timestamp",
  "change_index",
  "lifetime_burned",
  "lifetime_recycled"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,
      lifetime_burned UInt64,
      lifetime_recycled UInt64
  ')
  FORMAT Parquet
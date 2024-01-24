INSERT INTO "total_supply" (
  "version",
  "timestamp",
  "amount",
  "change_index"
)
SELECT
  "version",
  "timestamp",
  "amount",
  "change_index"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      amount UInt128,
      change_index UInt64
  ')
  FORMAT Parquet
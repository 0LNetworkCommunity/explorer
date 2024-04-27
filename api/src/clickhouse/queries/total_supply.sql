INSERT INTO "total_supply" (
  "version",
  "amount",
  "change_index"
)
SELECT
  "version",
  "amount",
  "change_index"
FROM
  input('
      version UInt64,
      amount UInt128,
      change_index UInt64
  ')
  FORMAT Parquet
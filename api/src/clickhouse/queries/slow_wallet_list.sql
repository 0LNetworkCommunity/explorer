INSERT INTO "slow_wallet_list" (
  "version",
  "timestamp",
  "change_index",

  "list_count"
)
SELECT
  "version",
  "timestamp",
  "change_index",

  "list_count"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,
      list_count UInt64
  ')
  FORMAT Parquet
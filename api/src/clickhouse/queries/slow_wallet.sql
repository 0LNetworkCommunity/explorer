INSERT INTO "slow_wallet" (
  "version",
  "timestamp",
  "change_index",
  "address",

  "unlocked",
  "transferred"
)
SELECT
  "version",
  "timestamp",
  "change_index",
  "address",

  "unlocked",
  "transferred"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,
      address UInt256,
      unlocked UInt64,
      transferred UInt64
  ')
  FORMAT Parquet
INSERT INTO "burn_tracker" (
  "version",
  "timestamp",
  "change_index",
  "address",
  "burn_at_last_calc",
  "cumu_burn",
  "prev_balance",
  "prev_supply"
)
SELECT
  "version",
  "timestamp",
  "change_index",
  "address",
  "burn_at_last_calc",
  "cumu_burn",
  "prev_balance",
  "prev_supply"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,
      address UInt256,
      burn_at_last_calc UInt64,
      cumu_burn UInt64,
      prev_balance UInt64,
      prev_supply UInt64
  ')
  FORMAT Parquet
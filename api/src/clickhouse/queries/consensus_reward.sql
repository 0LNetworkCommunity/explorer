INSERT INTO "consensus_reward" (
  "version",
  "timestamp",
  "change_index",

  "nominal_reward",
  "net_reward",
  "entry_fee",
  "clearing_bid",
  "median_win_bid",
  "median_history"
)
SELECT
  "version",
  "timestamp",
  "change_index",

  "nominal_reward",
  "net_reward",
  "entry_fee",
  "clearing_bid",
  "median_win_bid",
  "median_history"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,

      nominal_reward UInt64,
      net_reward UInt64,
      entry_fee UInt64,
      clearing_bid UInt64,
      median_win_bid UInt64,
      median_history String
  ')
  FORMAT Parquet
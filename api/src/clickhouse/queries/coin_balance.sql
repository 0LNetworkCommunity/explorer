INSERT INTO "coin_balance" (
  "address",
  "version",
  "balance",
  "change_index",
  "coin_address",
  "coin_module",
  "coin_name"
)
SELECT
  "address",
  "version",
  "balance",
  "change_index",
  "coin_address",
  "coin_module",
  "coin_name"
FROM
  input('
      address UInt256,
      version UInt64,
      balance UInt64,
      change_index UInt64,
      coin_address UInt256,
      coin_module String,
      coin_name String
  ')
  FORMAT Parquet
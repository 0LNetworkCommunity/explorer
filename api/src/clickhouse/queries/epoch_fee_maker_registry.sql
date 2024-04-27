INSERT INTO "epoch_fee_maker_registry" (
  "version",
  "change_index",

  "epoch_fees_made"
)
SELECT
  "version",
  "change_index",

  "epoch_fees_made"
FROM
  input('
      version UInt64,
      change_index UInt64,
      epoch_fees_made UInt64
  ')
  FORMAT Parquet
INSERT INTO "state_checkpoint_transaction" (
  "version",
  "timestamp"
)
SELECT
  "version",
  "timestamp"
FROM
  input(
    '
      version UInt64,
      timestamp UInt64
    '
  )
  FORMAT Parquet
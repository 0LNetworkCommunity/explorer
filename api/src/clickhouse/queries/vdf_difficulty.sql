INSERT INTO "vdf_difficulty" (
  "version",
  "timestamp",
  "change_index",

  "difficulty"
)
SELECT
  "version",
  "timestamp",
  "change_index",

  "difficulty"
FROM
  input('
      version UInt64,
      timestamp UInt64,
      change_index UInt64,
      difficulty UInt64
  ')
  FORMAT Parquet
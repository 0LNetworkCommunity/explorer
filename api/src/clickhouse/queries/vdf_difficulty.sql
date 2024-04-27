INSERT INTO "vdf_difficulty" (
  "version",
  "change_index",

  "difficulty"
)
SELECT
  "version",
  "change_index",

  "difficulty"
FROM
  input('
      version UInt64,
      change_index UInt64,
      difficulty UInt64
  ')
  FORMAT Parquet
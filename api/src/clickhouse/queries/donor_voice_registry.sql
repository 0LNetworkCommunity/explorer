INSERT INTO "donor_voice_registry" (
  "version",
  "change_index",
  "registry"
)
SELECT
  "version",
  "change_index",
  arrayMap(it -> reinterpretAsUInt256(it), "registry")
FROM
  input('
    version UInt64,
    change_index UInt64,
    registry Array(String)
  ')
  FORMAT Parquet
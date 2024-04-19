INSERT INTO "ancestry" (
  "address",
  "tree"
)
SELECT
  "address",
  arrayMap(it -> reinterpretAsUInt256(it), "tree")
FROM
  input('
    address UInt256,
    tree Array(String)
  ')
  FORMAT Parquet
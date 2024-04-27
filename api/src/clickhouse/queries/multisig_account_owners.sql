INSERT INTO "multisig_account_owners" (
  "version",
  "change_index",
  "address",
  "owners"
)
SELECT
  "version",
  "change_index",
  "address",
  arrayMap(it -> reinterpretAsUInt256(it), "owners")
FROM
  input('
      version UInt64,
      change_index UInt64,
      address UInt256,
      owners Array(String)
  ')
  FORMAT Parquet
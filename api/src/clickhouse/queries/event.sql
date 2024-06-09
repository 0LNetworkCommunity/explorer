INSERT INTO "event" (
  "version",
  "index",
  "creation_number",
  "account_address",
  "sequence_number",
  "module_address",
  "module_name",
  "struct_name",
  "data"
)
SELECT
  "version",
  "index",
  "creation_number",
  "account_address",
  "sequence_number",
  "module_address",
  "module_name",
  "struct_name",
  "data"
FROM
  input(
    '
      version UInt64,
      index UInt64,
      creation_number UInt64,
      account_address UInt256,
      sequence_number UInt64,
      module_address UInt256,
      module_name String,
      struct_name String,
      data String
    '
  )
FORMAT Parquet
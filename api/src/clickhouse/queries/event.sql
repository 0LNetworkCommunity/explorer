INSERT INTO "event" (
  "version",
  "timestamp",
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
  "timestamp",
  "creation_number",
  reinterpretAsUInt256(reverse(unhex("account_address"))),
  "sequence_number",
  reinterpretAsUInt256(reverse(unhex("module_address"))),
  "module_name",
  "struct_name",
  "data"
FROM
  input(
    '
      version UInt64,
      timestamp UInt64,
      creation_number UInt64,
      account_address String,
      sequence_number UInt64,
      module_address String,
      module_name String,
      struct_name String,
      data String
    '
  )
FORMAT Parquet
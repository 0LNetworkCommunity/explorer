INSERT INTO "multi_action" (
  "version",
  "change_index",
  "address",
  "tally_type_module_address",
  "tally_type_module_name",
  "tally_type_struct_name",
  "change"
)
SELECT
  "version",
  "change_index",
  "address",
  "tally_type_module_address",
  "tally_type_module_name",
  "tally_type_struct_name",
  "change"
FROM
  input('
      version UInt64,
      change_index UInt64,
      address UInt256,
      tally_type_module_address UInt256,
      tally_type_module_name String,
      tally_type_struct_name String,
      change String
  ')
  FORMAT Parquet
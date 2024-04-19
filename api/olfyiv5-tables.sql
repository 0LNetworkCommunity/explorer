CREATE TABLE "state" (
  "version" UInt64,
  "address" UInt128,
  "module_address" UInt128,
  "struct_name" String,
  "module_name" String,
  "payload" String
)
ENGINE = MergeTree
ORDER BY "version";
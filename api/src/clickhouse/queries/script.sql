INSERT INTO "script" (
  "version",
  "hash",
  "gas_used",
  "success",
  "vm_status",
  "sender",
  "sequence_number",
  "max_gas_amount",
  "gas_unit_price",
  "expiration_timestamp",
  "type_arguments",
  "arguments",
  "abi",
  "timestamp"
)
SELECT
  "version",
  "hash",
  "gas_used",
  "success",
  "vm_status",
  "sender",
  "sequence_number",
  "max_gas_amount",
  "gas_unit_price",
  "expiration_timestamp",
  "type_arguments",
  "arguments",
  "abi",
  "timestamp"
FROM
  input('
      version UInt64,
      hash UInt256,
      gas_used UInt64,
      success Boolean,
      vm_status String,
      sender UInt256,
      sequence_number UInt64,
      max_gas_amount UInt64,
      gas_unit_price UInt64,
      expiration_timestamp UInt64,
      type_arguments String,
      arguments String,
      abi String,
      timestamp UInt64
  ')
  FORMAT Parquet
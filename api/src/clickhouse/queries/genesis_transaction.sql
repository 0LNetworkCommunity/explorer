INSERT INTO "genesis_transaction" (
  "version",
  "hash",
  "state_change_hash",
  "event_root_hash",
  "state_checkpoint_hash",
  "gas_used",
  "success",
  "vm_status",
  "accumulator_root_hash"
)
SELECT
  "version",
  "hash",
  "state_change_hash",
  "event_root_hash",
  "state_checkpoint_hash",
  "gas_used",
  "success",
  "vm_status",
  "accumulator_root_hash"
FROM
  input('
    id String,
    version UInt64,
    hash UInt256,
    state_change_hash UInt256,
    event_root_hash UInt256,
    state_checkpoint_hash UInt256,
    gas_used UInt64,
    success Boolean,
    vm_status String,
    accumulator_root_hash UInt256
  ')
  FORMAT Parquet
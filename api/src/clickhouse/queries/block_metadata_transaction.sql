INSERT INTO "block_metadata_transaction" (
  "id",
  "version",
  "hash",
  "epoch",
  "round",
  "previous_block_votes_bitvec",
  "proposer",
  -- "failed_proposer_indices",
  "timestamp"
)
SELECT
  "id",
  "version",
  "hash",
  "epoch",
  "round",
  "previous_block_votes_bitvec",
  "proposer",
  -- "failed_proposer_indices",
  "timestamp"
FROM
  input(
    '
      id UInt256,
      version UInt64,
      hash UInt256,
      epoch UInt64,
      round UInt64,
      previous_block_votes_bitvec String,
      proposer UInt256,
      -- failed_proposer_indices Array(UInt32),
      timestamp UInt64
    '
  )
  FORMAT Parquet
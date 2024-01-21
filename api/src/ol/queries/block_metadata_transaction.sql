INSERT INTO "block_metadata_transaction_v7" (
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
  reinterpretAsUInt256(reverse(unhex("id"))),
  "version",
  reinterpretAsUInt256(reverse(unhex("hash"))),
  "epoch",
  "round",
  unhex("previous_block_votes_bitvec"),
  reinterpretAsUInt256(reverse(unhex("proposer"))),
  -- "failed_proposer_indices",
  "timestamp"
FROM
  input(
    '
      id String,
      version UInt64,
      hash String,
      epoch UInt64,
      round UInt64,
      previous_block_votes_bitvec String,
      proposer String,
      -- failed_proposer_indices Array(UInt32),
      timestamp UInt64
    '
  )
  FORMAT Parquet
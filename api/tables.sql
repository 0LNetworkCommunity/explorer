CREATE TABLE "user_transaction" ON CLUSTER "olfyi" (
  "version" UInt64,
  "hash" UInt256,
  "gas_used" UInt64,
  "success" Boolean,
  "vm_status" String,
  "sender" UInt256,
  "sequence_number" UInt64,
  "max_gas_amount" UInt64,
  "gas_unit_price" UInt64,
  "expiration_timestamp" UInt64,
  "module_address" UInt256,
  "module_name" String,
  "function_name" String,
  "type_arguments" String,
  "arguments" String,
  "timestamp" UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "script" ON CLUSTER "olfyi" (
  "version" UInt64,
  "hash" UInt256,
  "gas_used" UInt64,
  "success" Boolean,
  "vm_status" String,
  "sender" UInt256,
  "sequence_number" UInt64,
  "max_gas_amount" UInt64,
  "gas_unit_price" UInt64,
  "expiration_timestamp" UInt64,
  "type_arguments" String,
  "arguments" String,
  "abi" String,
  "timestamp" UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "event" ON CLUSTER "olfyi" (
	"version" UInt64,
	"creation_number" UInt64,
	"account_address" UInt256,
	"sequence_number" UInt64,
	"module_address" UInt256,
	"module_name" String,
	"struct_name" String,
	"data" String
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "block_metadata_transaction" ON CLUSTER "olfyi" (
  `id` UInt256,
  `version` UInt64,
  `hash` UInt256,
  `epoch` UInt64,
  `round` UInt64,
  `previous_block_votes_bitvec` String,
  `proposer` UInt256,
--   `failed_proposer_indices` Array(UInt32),
  `timestamp` UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY version;

CREATE TABLE "genesis_transaction" ON CLUSTER "olfyi" (
  `version` UInt64,
  `hash` UInt256,
  `state_change_hash` UInt256,
  `event_root_hash` UInt256,
  `state_checkpoint_hash` Nullable(UInt256),
  `gas_used` UInt64,
  `success` Boolean,
  `vm_status` String,
  `accumulator_root_hash` UInt256
)
ENGINE = ReplicatedMergeTree
ORDER BY version;

CREATE TABLE "state_checkpoint_transaction" ON CLUSTER "olfyi" (
  `version` UInt64,
--   `hash` UInt256,
--   `state_change_hash` UInt256,
--   `event_root_hash` UInt256,
--   `state_checkpoint_hash` Nullable(UInt256),
--   `gas_used` UInt64,
--   `success` Boolean,
--   `vm_status` String,
--   `accumulator_root_hash` UInt256,
  `timestamp` UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY version;

CREATE TABLE "ingested_files" ON CLUSTER "olfyi" (
    `name` String
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY ("name");

CREATE TABLE "ingested_versions" ON CLUSTER "olfyi" (
	`version` UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY ("version");

CREATE TABLE "total_supply" ON CLUSTER "olfyi" (
    "version" UInt64,
    "amount" UInt128,
    "change_index" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY ("version", "change_index")
ORDER BY ("version", "change_index");

CREATE TABLE "coin_balance" ON CLUSTER "olfyi" (
    "version" UInt64,
    "address" UInt256,
    "balance" UInt128,
    "change_index" UInt64,
    "coin_address" UInt256,
    "coin_module" String,
    "coin_name" String
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "coin_address",
    "coin_module", "coin_name",
    "version", "change_index",
    "address"
)
ORDER BY (
    "coin_address",
    "coin_module", "coin_name",
    "version", "change_index",
    "address"
);

CREATE TABLE "tower_list" ON CLUSTER "olfyi" (
  "version" UInt64,
  "change_index" UInt64,
  "list_count" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
  "version", "change_index"
)
ORDER BY (
  "version", "change_index"
);

CREATE TABLE "burn_tracker" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
    "address" UInt256,
    "burn_at_last_calc" UInt64,
    "cumu_burn" UInt64,
    "prev_balance" UInt64,
    "prev_supply" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index",
    "address"
)
ORDER BY (
    "version", "change_index",
    "address"
);

CREATE TABLE "burn_counter" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
    "lifetime_burned" UInt64,
    "lifetime_recycled" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);


CREATE TABLE "slow_wallet" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
    "address" UInt256,

    "unlocked" UInt64,
    "transferred" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index",
    "address"
)
ORDER BY (
    "version", "change_index",
    "address"
);

CREATE TABLE "epoch_fee_maker_registry" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,

    "epoch_fees_made" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "slow_wallet_list" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,

    "list_count" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "vdf_difficulty" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,

    "difficulty" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "consensus_reward" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,

    "nominal_reward" UInt64,
    "net_reward" UInt64,
    "entry_fee" UInt64,
    "clearing_bid" UInt64,
    "median_win_bid" UInt64,
    "median_history" Array(UInt64)
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "boundary_status" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,

    "incoming_fees" UInt64,
    "outgoing_nominal_reward_to_vals" UInt64,
    "outgoing_total_reward" UInt64,
    "system_fees_collected" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "beneficiary_policy" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
    "lifetime_pledged" UInt64,
    "lifetime_withdrawn" UInt64,
    "amount_available" UInt64,
    "pledgers_count" UInt64
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "community_wallet" ON CLUSTER "olfyi" (
	"address" UInt256
)
ENGINE = ReplicatedMergeTree
ORDER BY "address";

CREATE TABLE "ol_swap_1h" ON CLUSTER "olfyi" (
    "timestamp" UInt64,
    "volume" Decimal64(6),
    "open" Decimal64(6),
    "high" Decimal64(6),
    "low" Decimal64(6),
    "close" Decimal64(6)
)
ENGINE = ReplicatedReplacingMergeTree
ORDER BY "timestamp";

CREATE TABLE "ancestry" ON CLUSTER "olfyi" (
	"address" UInt256,
    "tree" Array(UInt256)
)
ENGINE = ReplicatedMergeTree
ORDER BY "address";

CREATE TABLE "multi_action" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
	"address" UInt256,
    "tally_type_module_address" UInt256,
    "tally_type_module_name" String,
    "tally_type_struct_name" String,
    "change" String
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "address"
)
ORDER BY (
    "address", "version", "change_index"
);

CREATE TABLE "multisig_account_owners" ON CLUSTER "olfyi" (
    "version" UInt64,
    "change_index" UInt64,
	"address" UInt256,
    "owners" Array(UInt256)
)
ENGINE = ReplicatedMergeTree
PRIMARY KEY (
    "address"
)
ORDER BY (
    "address", "version", "change_index"
);

CREATE TABLE "user_transaction" (
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
ENGINE = MergeTree
ORDER BY "version";

CREATE TABLE "script" (
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
ENGINE = MergeTree
ORDER BY "version";

CREATE TABLE "event" (
	"version" UInt64,
	"timestamp" UInt64,
	"creation_number" UInt64,
	"account_address" UInt256,
	"sequence_number" UInt64,
	"module_address" UInt256,
	"module_name" String,
	"struct_name" String,
	"data" String
)
ENGINE = MergeTree
ORDER BY "version";

CREATE TABLE "block_metadata_transaction" (
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
ENGINE = MergeTree
ORDER BY version;

-- CREATE TABLE "state_checkpoint_transaction" (
--   `version` UInt64,
--   `hash` UInt256,
--   `state_change_hash` UInt256,
--   `event_root_hash` UInt256,
--   `state_checkpoint_hash` Nullable(UInt256),
--   `gas_used` UInt64,
--   `success` Boolean,
--   `vm_status` String,
--   `accumulator_root_hash` UInt256,
--   `timestamp` UInt64
-- )
-- ENGINE = MergeTree
-- ORDER BY version;

CREATE TABLE "ingested_files"
(
    `name` String
)
ENGINE = MergeTree
PRIMARY KEY ("name");

CREATE TABLE "ingested_versions" (
	`version` UInt64
)
ENGINE = MergeTree
PRIMARY KEY ("version");

CREATE TABLE "total_supply"
(
    "version" UInt64,
    "timestamp" UInt64,
    "amount" UInt128,
    "change_index" UInt64
)
ENGINE = MergeTree
PRIMARY KEY ("version", "change_index")
ORDER BY ("version", "change_index");

CREATE TABLE "coin_balance"
(
    "version" UInt64,
    "timestamp" UInt64,
    "address" UInt256,
    "balance" UInt128,
    "change_index" UInt64,
    "coin_address" UInt256,
    "coin_module" String,
    "coin_name" String
)
ENGINE = MergeTree
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

CREATE TABLE "tower_list"
(
  "version" UInt64,
  "timestamp" UInt64,
  "change_index" UInt64,
  "list_count" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
  "version", "change_index"
)
ORDER BY (
  "version", "change_index"
);

CREATE TABLE "burn_tracker"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,
    "address" UInt256,
    "burn_at_last_calc" UInt64,
    "cumu_burn" UInt64,
    "prev_balance" UInt64,
    "prev_supply" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index",
    "address"
)
ORDER BY (
    "version", "change_index",
    "address"
);

CREATE TABLE "burn_counter"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,
    "lifetime_burned" UInt64,
    "lifetime_recycled" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);


CREATE TABLE "slow_wallet"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,
    "address" UInt256,

    "unlocked" UInt64,
    "transferred" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index",
    "address"
)
ORDER BY (
    "version", "change_index",
    "address"
);

CREATE TABLE "epoch_fee_maker_registry"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,

    "epoch_fees_made" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "slow_wallet_list"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,

    "list_count" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "vdf_difficulty"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,

    "difficulty" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "consensus_reward"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,

    "nominal_reward" UInt64,
    "net_reward" UInt64,
    "entry_fee" UInt64,
    "clearing_bid" UInt64,
    "median_win_bid" UInt64,
    "median_history" Array(UInt64)
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);

CREATE TABLE "boundary_status"
(
    "version" UInt64,
    "timestamp" UInt64,
    "change_index" UInt64,

    "incoming_fees" UInt64,
    "outgoing_nominal_reward_to_vals" UInt64,
    "outgoing_total_reward" UInt64,
    "system_fees_collected" UInt64
)
ENGINE = MergeTree
PRIMARY KEY (
    "version", "change_index"
)
ORDER BY (
    "version", "change_index"
);
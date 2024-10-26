-- INSERT INTO total_supply SELECT * FROM
--   remote('clickhouse-server-1.clickhouse.svc.cluster.local', 'olfyi_v6', 'total_supply', 'ol_rw', '********************************');

CREATE TABLE olfyi_v6.boundary_status
(
    `version` UInt64,
    `change_index` UInt64,
    `incoming_fees` UInt64,
    `outgoing_nominal_reward_to_vals` UInt64,
    `outgoing_total_reward` UInt64,
    `system_fees_collected` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v6.burn_counter
(
    `version` UInt64,
    `change_index` UInt64,
    `lifetime_burned` UInt64,
    `lifetime_recycled` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v6.burn_tracker
(
    `version` UInt64,
    `change_index` UInt64,
    `address` UInt256,
    `burn_at_last_calc` UInt64,
    `cumu_burn` UInt64,
    `prev_balance` UInt64,
    `prev_supply` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index, address)
ORDER BY (version, change_index, address);

CREATE TABLE olfyi_v6.coin_balance
(
    `version` UInt64,
    `address` UInt256,
    `balance` UInt128,
    `change_index` UInt64,
    `coin_address` UInt256,
    `coin_module` String,
    `coin_name` String
)
ENGINE = MergeTree
PRIMARY KEY (coin_address, coin_module, coin_name, version, change_index, address)
ORDER BY (coin_address, coin_module, coin_name, version, change_index, address);

CREATE TABLE olfyi_v6.community_wallet
(
    `address` UInt256
)
ENGINE = MergeTree
ORDER BY address;

CREATE TABLE olfyi_v6.consensus_reward
(
    `version` UInt64,
    `change_index` UInt64,
    `nominal_reward` UInt64,
    `net_reward` UInt64,
    `entry_fee` UInt64,
    `clearing_bid` UInt64,
    `median_win_bid` UInt64,
    `median_history` Array(UInt64)
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

 CREATE TABLE olfyi_v6.epoch_fee_maker_registry
(
    `version` UInt64,
    `change_index` UInt64,
    `epoch_fees_made` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

 CREATE TABLE olfyi_v6.event
(
    `version` UInt64,
    `creation_number` UInt64,
    `account_address` UInt256,
    `sequence_number` UInt64,
    `module_address` UInt256,
    `module_name` String,
    `struct_name` String,
    `data` String
)
ENGINE = MergeTree
ORDER BY version;

 CREATE TABLE olfyi_v6.genesis_transaction
(
    `version` UInt64,
    `hash` UInt256,
    `state_change_hash` UInt256,
    `event_root_hash` UInt256,
    `state_checkpoint_hash` Nullable(UInt256),
    `gas_used` UInt64,
    `success` Bool,
    `vm_status` String,
    `accumulator_root_hash` UInt256
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v6.ingested_files
(
    `name` String
)
ENGINE = MergeTree
PRIMARY KEY name
ORDER BY name;

CREATE TABLE olfyi_v6.ingested_versions
(
    `version` UInt64
)
ENGINE = MergeTree
PRIMARY KEY version
ORDER BY version;

CREATE TABLE olfyi_v6.multi_action
(
    `version` UInt64,
    `change_index` UInt64,
    `address` UInt256,
    `tally_type_module_address` UInt256,
    `tally_type_module_name` String,
    `tally_type_struct_name` String,
    `change` String
)
ENGINE = MergeTree
PRIMARY KEY address
ORDER BY (address, version, change_index);

CREATE TABLE olfyi_v6.multisig_account_owners
(
    `version` UInt64,
    `change_index` UInt64,
    `address` UInt256,
    `owners` Array(UInt256)
)
ENGINE = MergeTree
PRIMARY KEY address
ORDER BY (address, version, change_index);

CREATE TABLE olfyi_v6.ol_swap_1h
(
    `timestamp` UInt64,
    `volume` Decimal(18, 6),
    `open` Decimal(18, 6),
    `high` Decimal(18, 6),
    `low` Decimal(18, 6),
    `close` Decimal(18, 6)
)
ENGINE = ReplacingMergeTree
ORDER BY timestamp;

CREATE TABLE olfyi_v6.script
(
    `version` UInt64,
    `hash` UInt256,
    `gas_used` UInt64,
    `success` Bool,
    `vm_status` String,
    `sender` UInt256,
    `sequence_number` UInt64,
    `max_gas_amount` UInt64,
    `gas_unit_price` UInt64,
    `expiration_timestamp` UInt64,
    `type_arguments` String,
    `arguments` String,
    `abi` String,
    `timestamp` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v6.slow_wallet
(
    `version` UInt64,
    `change_index` UInt64,
    `address` UInt256,
    `unlocked` UInt64,
    `transferred` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index, address)
ORDER BY (version, change_index, address);

CREATE TABLE olfyi_v6.slow_wallet_list
(
    `version` UInt64,
    `change_index` UInt64,
    `list_count` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v6.state_checkpoint_transaction
(
    `version` UInt64,
    `timestamp` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v6.total_supply
(
    `version` UInt64,
    `amount` UInt128,
    `change_index` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

---------------------------------


 CREATE TABLE olfyi_v6.tower_list
(
    `version` UInt64,
    `change_index` UInt64,
    `list_count` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v6.block_metadata_transaction
(
    `id` UInt256,
    `version` UInt64,
    `hash` UInt256,
    `epoch` UInt64,
    `round` UInt64,
    `previous_block_votes_bitvec` String,
    `proposer` UInt256,
    `timestamp` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v6.beneficiary_policy
(
    `version` UInt64,
    `change_index` UInt64,
    `lifetime_pledged` UInt64,
    `lifetime_withdrawn` UInt64,
    `amount_available` UInt64,
    `pledgers_count` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v6.ancestry
(
    `address` UInt256,
    `tree` Array(UInt256)
)
ENGINE = MergeTree
ORDER BY address;

CREATE TABLE olfyi_v6.user_transaction
(
    `version` UInt64,
    `hash` UInt256,
    `gas_used` UInt64,
    `success` Bool,
    `vm_status` String,
    `sender` UInt256,
    `sequence_number` UInt64,
    `max_gas_amount` UInt64,
    `gas_unit_price` UInt64,
    `expiration_timestamp` UInt64,
    `module_address` UInt256,
    `module_name` String,
    `function_name` String,
    `type_arguments` String,
    `arguments` String,
    `timestamp` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v6.vdf_difficulty
(
    `version` UInt64,
    `change_index` UInt64,
    `difficulty` UInt64
)
ENGINE = MergeTree
PRIMARY KEY (version, change_index)
ORDER BY (version, change_index);

CREATE TABLE olfyi_v5.burn
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `amount` UInt64,
    `currency` String,
    `preburn_address` UInt128
)
ENGINE = MergeTree
ORDER BY version;


CREATE TABLE olfyi_v5.create_account
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `role_id` UInt64,
    `created_address` UInt128
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v5.mint
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `amount` UInt64,
    `currency` String
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v5.new_block
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `round` UInt64,
    `proposer` UInt128,
    `proposed_time` UInt64,
    `gas_used` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v5.received_payment
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `amount` UInt64,
    `currency` String,
    `sender` UInt128,
    `receiver` UInt128,
    `metadata` String
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v5.sent_payment
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `amount` UInt64,
    `currency` String,
    `sender` UInt128,
    `receiver` UInt128,
    `metadata` String
)
ENGINE = MergeTree
ORDER BY version;

CREATE TABLE olfyi_v5.state
(
    `version` UInt64,
    `address` UInt128,
    `module_address` UInt128,
    `struct_name` String,
    `module_name` String,
    `payload` String
)
ENGINE = MergeTree
ORDER BY version;


 CREATE TABLE olfyi_v5.user_transaction
(
    `version` UInt64,
    `timestamp_usecs` UInt64,
    `sender` UInt128,
    `sequence_number` UInt64,
    `max_gas_amount` UInt64,
    `gas_unit_price` UInt64,
    `gas_currency` String,
    `module_address` UInt128,
    `module_name` String,
    `function_name` String,
    `arguments` Array(String),
    `vm_status` String,
    `gas_used` UInt64
)
ENGINE = MergeTree
ORDER BY version
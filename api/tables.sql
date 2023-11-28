CREATE TABLE "create_account"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "role_id" UInt64,
    "created_address" Binary(16)
)
ENGINE = MergeTree
PRIMARY KEY ("created_address");

CREATE TABLE "burn"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "amount" UInt64,
    "currency" String,
    "preburn_address" Binary(16)
)
ENGINE = MergeTree
ORDER BY "version";


CREATE TABLE "received_payment"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "amount" UInt64,
    "currency" String,
    "sender" Binary(16),
    "receiver" Binary(16),
    "metadata" String
)
ENGINE = MergeTree
PRIMARY KEY ("version");


CREATE TABLE "sent_payment"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "amount" UInt64,
    "currency" String,
    "sender" Binary(16),
    "receiver" Binary(16),
    "metadata" String
)
ENGINE = MergeTree
PRIMARY KEY ("version");


CREATE TABLE "mint"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "amount" UInt64,
    "currency" String
)
ENGINE = MergeTree
PRIMARY KEY ("version");

CREATE TABLE "user_transaction"
(
    "version" UInt64,
    "timestamp_usecs" UInt64,
    "sender" Binary(16),
    -- "signature_scheme" String,
    -- "signature" String,
    -- "public_key" String,
    "sequence_number" UInt64,
    "max_gas_amount" UInt64,
    "gas_unit_price" UInt64,
    "gas_currency" String,
    -- "expiration_timestamp_secs" UInt64,
    -- "script_hash" String,
    -- "script_bytes" String,
    "module_address" Binary(16),
    "module_name" String,
    "function_name" String,
    "arguments" Array(String),
    "vm_status" String,
    "gas_used" UInt64
)
ENGINE = MergeTree
ORDER BY "version";

CREATE TABLE "ingested_files"
(
    "name" String
)
ENGINE = MergeTree
PRIMARY KEY ("name");

create table "ingested_versions" (
	version UInt64
)
ENGINE = MergeTree
PRIMARY KEY ("version");

create table "new_block" (
	"version" UInt64,
    "timestamp_usecs" UInt64,
    "round" UInt64,
    "proposer" String,
    "proposed_time" UInt64,
    "gas_used" UInt64
)
ENGINE = MergeTree
PRIMARY KEY ("version");

CREATE TABLE "user_transaction_v7" (
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
  "arguments" Array(String),
  "timestamp" UInt64
)
ENGINE = MergeTree
ORDER BY "version";

CREATE TABLE "event_v7" (
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

CREATE TABLE "block_metadata_transaction_v7" (
  `id` UInt256,
  `version` UInt64,
  `hash` UInt256,
  `epoch` UInt64,
  `round` UInt64,
  `previous_block_votes_bitvec` String,
  `proposer` UInt256,
  `failed_proposer_indices` UInt32,
  `timestamp` UInt64
)
ENGINE = MergeTree
ORDER BY version;

CREATE DATABASE IF NOT EXISTS "olfyi_v5" ON CLUSTER "olfyi";

CREATE TABLE "state" ON CLUSTER "olfyi" (
  "version" UInt64,
  "address" UInt128,
  "module_address" UInt128,
  "struct_name" String,
  "module_name" String,
  "payload" String
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "burn" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "amount" UInt64,
  "currency" String,
  "preburn_address" UInt128
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "create_account" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "role_id" UInt64,
  "created_address" UInt128
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "mint" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "amount" UInt64,
  "currency" String
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "new_block" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "round" UInt64,
  "proposer" UInt128,
  "proposed_time" UInt64,
  "gas_used" UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "received_payment" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "amount" UInt64,
  "currency" String,
  "sender" UInt128,
  "receiver" UInt128,
  "metadata" String
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "sent_payment" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "amount" UInt64,
  "currency" String,
  "sender" UInt128,
  "receiver" UInt128,
  "metadata" String
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";

CREATE TABLE "user_transaction" ON CLUSTER "olfyi" (
  "version" UInt64,
  "timestamp_usecs" UInt64,
  "sender" UInt128,
  "sequence_number" UInt64,
  "max_gas_amount" UInt64,
  "gas_unit_price" UInt64,
  "gas_currency" String,
  "module_address" UInt128,
  "module_name" String,
  "function_name" String,
  "arguments" Array(String),
  "vm_status" String,
  "gas_used" UInt64
)
ENGINE = ReplicatedMergeTree
ORDER BY "version";
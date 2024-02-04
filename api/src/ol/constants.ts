// Version 0's timestamp is calculated by dedubting the intervation between epoch 2 and 3 to epoch 2's timestamp.
//
// ┌─version─┬────────timestamp─┬─creation_number─┬─account_address─┬─sequence_number─┬─module_address─┬─module_name─────┬─struct_name───┬─data──────────┐
// │       0 │                0 │               2 │               1 │               0 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"1"} │
// │       3 │ 1701289679612335 │               2 │               1 │               1 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"2"} │
// │  383074 │ 1701376079939922 │               2 │               1 │               2 │              1 │ reconfiguration │ NewEpochEvent │ {"epoch":"3"} │
// └─────────┴──────────────────┴─────────────────┴─────────────────┴─────────────────┴────────────────┴─────────────────┴───────────────┴───────────────┘

// Math.floor((1701289679612335 - (1701376079939922 - 1701289679612335)) / 1_000 / 1_000)
// 1701203279 - (1701203279 % 3600)

export const V0_TIMESTAMP = 1701201600;

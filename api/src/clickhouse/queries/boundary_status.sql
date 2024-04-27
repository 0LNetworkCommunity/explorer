INSERT INTO "boundary_status" (
    "version",
    "change_index",
    "incoming_fees",
    "outgoing_nominal_reward_to_vals",
    "outgoing_total_reward",
    "system_fees_collected"
)
SELECT
    "version",
    "change_index",
    "incoming_fees",
    "outgoing_nominal_reward_to_vals",
    "outgoing_total_reward",
    "system_fees_collected"
FROM
  input(
    '
      version UInt64,
      change_index UInt64,
      incoming_fees UInt64,
      outgoing_nominal_reward_to_vals UInt64,
      outgoing_total_reward UInt64,
      system_fees_collected UInt64
    '
  )
  FORMAT Parquet
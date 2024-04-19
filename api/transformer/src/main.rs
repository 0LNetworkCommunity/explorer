use std::str::FromStr;

use clap::Parser;
use diem_api_types::{HexEncodedBytes, IdentifierWrapper, MoveType, Transaction, WriteSetChange};
use lazy_static::lazy_static;

mod models;
mod to_array_data;

use models::{
    AncestryCollection, BeneficiaryPolicyCollection, BlockMetadataTransactionCollection,
    BoundaryStatusCollection, BurnCounterCollection, BurnTrackerCollection, CoinBalanceCollection,
    ConsensusRewardCollection, EpochFeeMakerRegistryCollection, EventCollection,
    GenesisTransactionCollection, ScriptCollection, SlowWalletCollection, SlowWalletListCollection,
    StateCheckpointTransactionCollection, TotalSupplyCollection, TowerListCollection,
    UserTransactionCollection, VdfDifficultyCollection,
};
use serde_json::Value;

#[derive(Parser, Debug)]
struct Args {
    // input files
    #[arg(required = true)]
    files: Vec<String>,

    // output directory
    #[arg(required = true)]
    dest: String,
}

lazy_static! {
    static ref LIBRA_COIN_HANDLE: HexEncodedBytes = HexEncodedBytes::from_str(
        "FC074A2B7638A50BA678CE381A2350A28264F4DA004603ADB8DC36D125750108"
    )
    .unwrap();
    static ref LIBRA_COIN_KEY: HexEncodedBytes = HexEncodedBytes::from_str(
        "A7E1AF6D61E958DBEFE8F35550AAB562F8923634CD7F438BC5190E99CA5FB07C"
    )
    .unwrap();
    static ref ROOT_ACCOUNT_ADDRESS: HexEncodedBytes = HexEncodedBytes::from_str(
        "0000000000000000000000000000000000000000000000000000000000000001"
    )
    .unwrap();
    static ref NULL_ADDRESS: HexEncodedBytes = HexEncodedBytes::from_str(
        "0000000000000000000000000000000000000000000000000000000000000000"
    )
    .unwrap();
}

/**
 * 0x1::tower_state::TowerList : XX
 * 0x1::ol_account::BurnTracker: XX
 * 0x1::burn::BurnCounter: XX
 * 0x1::slow_wallet::SlowWallet: XX
 * 0x1::pledge_accounts::BeneficiaryPolicy: XX
 * 0x1::fee_maker::EpochFeeMakerRegistry: X
 * 0x1::slow_wallet::SlowWalletList: X
 * 0x1::tower_state::VDFDifficulty: X
 * 0x1::proof_of_fee::ConsensusReward: X
 * 0x1::epoch_boundary::BoundaryStatus: X
 *
 */

fn process_changes(
    total_supply_collection: &mut TotalSupplyCollection,
    coin_balance_collection: &mut CoinBalanceCollection,

    beneficiary_policy_collection: &mut BeneficiaryPolicyCollection,
    tower_list_collection: &mut TowerListCollection,
    burn_tracker_collection: &mut BurnTrackerCollection,
    burn_counter_collection: &mut BurnCounterCollection,
    slow_wallet_collection: &mut SlowWalletCollection,
    epoch_fee_maker_registry_collection: &mut EpochFeeMakerRegistryCollection,
    slow_wallet_list_collection: &mut SlowWalletListCollection,
    vdf_difficulty_collection: &mut VdfDifficultyCollection,
    consensus_reward_collection: &mut ConsensusRewardCollection,
    boundary_status_collection: &mut BoundaryStatusCollection,
    ancestry_collection: &mut AncestryCollection,

    version: u64,
    timestamp: u64,
    changes: &Vec<WriteSetChange>,
) {
    for (change_index, change) in changes.iter().enumerate() {
        let change_index = change_index as u64;

        match change {
            // diem_api_types::WriteSetChange::DeleteModule(_) => todo!(),
            // diem_api_types::WriteSetChange::DeleteResource(_) => todo!(),
            // diem_api_types::WriteSetChange::DeleteTableItem(_) => todo!(),
            // diem_api_types::WriteSetChange::WriteModule(_) => todo!(),
            diem_api_types::WriteSetChange::WriteResource(change) => {
                let address = change.address.inner().to_vec();
                let type_address = change.data.typ.address.inner().to_vec();
                let type_module = change.data.typ.module.as_str();
                let type_name = change.data.typ.name.as_str();
                let type_generic_type_params_len = change.data.typ.generic_type_params.len();

                // coin_balance
                if type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "coin"
                    && type_name == "CoinStore"
                    && type_generic_type_params_len == 1
                {
                    let param = &change.data.typ.generic_type_params[0];

                    if let MoveType::Struct(param) = param {
                        let coin_identifier = IdentifierWrapper::from_str("coin").unwrap();

                        if let Some(Value::Object(coin)) = change.data.data.0.get(&coin_identifier)
                        {
                            if let Some(Value::String(value)) = coin.get("value") {
                                if let Ok(balance) = value.parse::<u64>() {
                                    let address = change.address.inner().to_vec();
                                    let coin_address = param.address.inner().to_vec();
                                    let coin_module = param.module.as_str();
                                    let coin_name = param.name.as_str();
                                    coin_balance_collection.push(
                                        address,
                                        balance,
                                        timestamp,
                                        version,
                                        change_index,
                                        coin_address,
                                        coin_module.to_string(),
                                        coin_name.to_string(),
                                    );
                                }
                            }
                        }
                    }
                }

                // 0x1::pledge_accounts::BeneficiaryPolicy
                if address == NULL_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "pledge_accounts"
                    && type_name == "BeneficiaryPolicy"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;
                    let amount_available: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("amount_available").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let amount_available = amount_available.parse::<u64>().unwrap();

                    let lifetime_pledged: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("lifetime_pledged").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let lifetime_pledged = lifetime_pledged.parse::<u64>().unwrap();

                    let lifetime_withdrawn: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("lifetime_withdrawn").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let lifetime_withdrawn = lifetime_withdrawn.parse::<u64>().unwrap();

                    let pledgers: Vec<String> = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("pledgers").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let pledgers_count = pledgers.len() as u64;

                    beneficiary_policy_collection.push(
                        version,
                        timestamp,
                        change_index,
                        lifetime_pledged,
                        lifetime_withdrawn,
                        amount_available,
                        pledgers_count,
                    );
                }

                // 0x1::slow_wallet::SlowWallet
                if type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "slow_wallet"
                    && type_name == "SlowWallet"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let transferred: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("transferred").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    let unlocked: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("unlocked").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let unlocked = unlocked.parse::<u64>().unwrap();
                    let transferred = transferred.parse::<u64>().unwrap();

                    slow_wallet_collection.push(
                        version,
                        timestamp,
                        change_index,
                        address.clone(),
                        unlocked,
                        transferred,
                    );
                }

                // 0x1::burn::BurnCounter
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "burn"
                    && type_name == "BurnCounter"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let lifetime_burned: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("lifetime_burned").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    let lifetime_recycled: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("lifetime_recycled").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    let lifetime_burned = lifetime_burned.parse::<u64>().unwrap();
                    let lifetime_recycled = lifetime_recycled.parse::<u64>().unwrap();

                    burn_counter_collection.push(
                        version,
                        timestamp,
                        change_index,
                        lifetime_burned,
                        lifetime_recycled,
                    );
                }

                // 0x1::ol_account::BurnTracker
                if type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "ol_account"
                    && type_name == "BurnTracker"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let burn_at_last_calc: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("burn_at_last_calc").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let burn_at_last_calc = burn_at_last_calc.parse::<u64>().unwrap();

                    let cumu_burn: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("cumu_burn").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let cumu_burn = cumu_burn.parse::<u64>().unwrap();

                    let prev_balance: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("prev_balance").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let prev_balance = prev_balance.parse::<u64>().unwrap();

                    let prev_supply: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("prev_balance").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let prev_supply = prev_supply.parse::<u64>().unwrap();

                    burn_tracker_collection.push(
                        version,
                        timestamp,
                        change_index,
                        address.clone(),
                        burn_at_last_calc,
                        cumu_burn,
                        prev_balance,
                        prev_supply,
                    );
                }

                // 0x1::tower_state:TowerList
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "tower_state"
                    && type_name == "TowerList"
                    && type_generic_type_params_len == 0
                {
                    let list: Vec<String> = serde_json::from_value(
                        change
                            .data
                            .data
                            .0
                            .get(&IdentifierWrapper::from_str("list").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    tower_list_collection.push(version, timestamp, change_index, list.len() as u64);
                }

                // 0x1::fee_maker::EpochFeeMakerRegistry
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "fee_maker"
                    && type_name == "EpochFeeMakerRegistry"
                    && type_generic_type_params_len == 0
                {
                    let epoch_fees_made: String = serde_json::from_value(
                        change
                            .data
                            .data
                            .0
                            .get(&IdentifierWrapper::from_str("epoch_fees_made").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let epoch_fees_made = epoch_fees_made.parse::<u64>().unwrap();

                    epoch_fee_maker_registry_collection.push(
                        version,
                        timestamp,
                        change_index,
                        epoch_fees_made,
                    );
                }

                // 0x1::slow_wallet::SlowWalletList
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "slow_wallet"
                    && type_name == "SlowWalletList"
                    && type_generic_type_params_len == 0
                {
                    let list: Vec<String> = serde_json::from_value(
                        change
                            .data
                            .data
                            .0
                            .get(&IdentifierWrapper::from_str("list").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    slow_wallet_list_collection.push(
                        version,
                        timestamp,
                        change_index,
                        list.len() as u64,
                    );
                }

                // 0x1::tower_state::VDFDifficulty
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "tower_state"
                    && type_name == "VDFDifficulty"
                    && type_generic_type_params_len == 0
                {
                    let difficulty: String = serde_json::from_value(
                        change
                            .data
                            .data
                            .0
                            .get(&IdentifierWrapper::from_str("difficulty").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let difficulty = difficulty.parse::<u64>().unwrap();

                    vdf_difficulty_collection.push(version, timestamp, change_index, difficulty);
                }

                // 0x1::proof_of_fee::ConsensusReward
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "proof_of_fee"
                    && type_name == "ConsensusReward"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let clearing_bid: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("clearing_bid").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let clearing_bid = clearing_bid.parse::<u64>().unwrap();

                    let entry_fee: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("entry_fee").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let entry_fee = entry_fee.parse::<u64>().unwrap();

                    let median_history: Vec<String> = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("median_history").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let median_history = median_history
                        .iter()
                        .map(|value| value.parse::<u64>().unwrap())
                        .collect();

                    let median_win_bid: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("median_win_bid").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let median_win_bid = median_win_bid.parse::<u64>().unwrap();

                    let net_reward: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("net_reward").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let net_reward = net_reward.parse::<u64>().unwrap();

                    let nominal_reward: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("nominal_reward").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let nominal_reward = nominal_reward.parse::<u64>().unwrap();

                    consensus_reward_collection.push(
                        version,
                        timestamp,
                        change_index,
                        nominal_reward,
                        net_reward,
                        entry_fee,
                        clearing_bid,
                        median_win_bid,
                        median_history,
                    );
                }

                // 0x1::epoch_boundary::BoundaryStatus
                if address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "epoch_boundary"
                    && type_name == "BoundaryStatus"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let incoming_fees: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("incoming_fees").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let incoming_fees = incoming_fees.parse::<u64>().unwrap();

                    let outgoing_nominal_reward_to_vals: String = serde_json::from_value(
                        data.get(
                            &IdentifierWrapper::from_str("outgoing_nominal_reward_to_vals")
                                .unwrap(),
                        )
                        .unwrap()
                        .clone(),
                    )
                    .unwrap();
                    let outgoing_nominal_reward_to_vals =
                        outgoing_nominal_reward_to_vals.parse::<u64>().unwrap();

                    let outgoing_total_reward: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("outgoing_total_reward").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let outgoing_total_reward = outgoing_total_reward.parse::<u64>().unwrap();

                    let system_fees_collected: String = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("system_fees_collected").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();
                    let system_fees_collected = system_fees_collected.parse::<u64>().unwrap();

                    boundary_status_collection.push(
                        version,
                        timestamp,
                        change_index,
                        incoming_fees,
                        outgoing_nominal_reward_to_vals,
                        outgoing_total_reward,
                        system_fees_collected,
                    );
                }

                if type_address == ROOT_ACCOUNT_ADDRESS.inner()
                    && type_module == "ancestry"
                    && type_name == "Ancestry"
                    && type_generic_type_params_len == 0
                {
                    let data = &change.data.data.0;

                    let tree: Vec<String> = serde_json::from_value(
                        data.get(&IdentifierWrapper::from_str("tree").unwrap())
                            .unwrap()
                            .clone(),
                    )
                    .unwrap();

                    let tree = tree
                        .iter()
                        .map(|addr| HexEncodedBytes::from_str(addr).unwrap().0)
                        .collect::<Vec<_>>();
                    ancestry_collection.push(address.clone(), tree);
                }
            }
            diem_api_types::WriteSetChange::WriteTableItem(change) => {
                if change.handle.eq(&LIBRA_COIN_HANDLE) && change.key.eq(&LIBRA_COIN_KEY) {
                    let libra_coin_total_supply_change = change;

                    // let value: u128 = from_bytes(&libra_coin_total_supply_change.value.0).unwrap();
                    total_supply_collection.push(
                        version,
                        timestamp,
                        libra_coin_total_supply_change.value.0.clone(),
                        change_index as u64,
                    );
                }
            }
            _ => {}
        }
    }
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let mut block_metadata_transaction_collection = BlockMetadataTransactionCollection::new();
    let mut state_checkpoint_transaction_collection = StateCheckpointTransactionCollection::new();
    let mut user_transaction_collection = UserTransactionCollection::new();
    let mut genesis_transaction_collection = GenesisTransactionCollection::new();
    let mut ancestry_collection = AncestryCollection::new();
    let mut script_collection = ScriptCollection::new();
    let mut total_supply_collection = TotalSupplyCollection::new();
    let mut coin_balance_collection = CoinBalanceCollection::new();

    let mut beneficiary_policy_collection = BeneficiaryPolicyCollection::new();
    let mut tower_list_collection = TowerListCollection::new();
    let mut burn_tracker_collection = BurnTrackerCollection::new();
    let mut burn_counter_collection = BurnCounterCollection::new();
    let mut slow_wallet_collection = SlowWalletCollection::new();
    let mut epoch_fee_maker_registry_collection = EpochFeeMakerRegistryCollection::new();
    let mut slow_wallet_list_collection = SlowWalletListCollection::new();
    let mut vdf_difficulty_collection = VdfDifficultyCollection::new();
    let mut consensus_reward_collection = ConsensusRewardCollection::new();
    let mut boundary_status_collection = BoundaryStatusCollection::new();

    std::fs::create_dir_all(&args.dest).unwrap();

    let mut event_collection = EventCollection::new();

    for file in args.files.iter() {
        let content = std::fs::read_to_string(file).unwrap();
        let value: serde_json::Value = serde_json::from_str(&content).unwrap();

        let transactions: Vec<diem_api_types::transaction::Transaction> = match value {
            serde_json::Value::Array(transactions) => {
                serde_json::from_value(serde_json::Value::Array(transactions)).unwrap()
            }
            serde_json::Value::Object(transaction) => {
                vec![serde_json::from_value(serde_json::Value::Object(transaction)).unwrap()]
            }
            _ => {
                panic!("invalid transaction json file");
            }
        };

        let it = transactions.iter();
        for transaction in it {
            match transaction {
                Transaction::PendingTransaction(_) => {}
                Transaction::UserTransaction(user_transaction) => {
                    let info = &user_transaction.info;
                    let events = &user_transaction.events;

                    event_collection.push(
                        info.version.into(),
                        user_transaction.timestamp.into(),
                        events,
                    );

                    process_changes(
                        &mut total_supply_collection,
                        &mut coin_balance_collection,
                        &mut beneficiary_policy_collection,
                        &mut tower_list_collection,
                        &mut burn_tracker_collection,
                        &mut burn_counter_collection,
                        &mut slow_wallet_collection,
                        &mut epoch_fee_maker_registry_collection,
                        &mut slow_wallet_list_collection,
                        &mut vdf_difficulty_collection,
                        &mut consensus_reward_collection,
                        &mut boundary_status_collection,
                        &mut ancestry_collection,
                        info.version.into(),
                        user_transaction.timestamp.into(),
                        &info.changes,
                    );

                    let request = &user_transaction.request;
                    let payload = &request.payload;

                    match payload {
                        diem_api_types::TransactionPayload::EntryFunctionPayload(_) => {
                            user_transaction_collection.push(&user_transaction);
                        }

                        diem_api_types::TransactionPayload::ScriptPayload(_) => {
                            script_collection.push(&user_transaction);
                        }

                        // Deprecated. Will be removed in the future.
                        diem_api_types::TransactionPayload::ModuleBundlePayload(_) => {
                            panic!("unsupported diem_api_types::TransactionPayload::ModuleBundlePayload");
                        }
                        diem_api_types::TransactionPayload::MultisigPayload(_) => {
                            panic!("diem_api_types::TransactionPayload::MultisigPayload");
                        }
                    }
                }
                Transaction::GenesisTransaction(genesis_transaction) => {
                    let info = &genesis_transaction.info;
                    let events = &genesis_transaction.events;

                    event_collection.push(info.version.into(), 0, events);
                    genesis_transaction_collection.push(genesis_transaction);

                    process_changes(
                        &mut total_supply_collection,
                        &mut coin_balance_collection,
                        &mut beneficiary_policy_collection,
                        &mut tower_list_collection,
                        &mut burn_tracker_collection,
                        &mut burn_counter_collection,
                        &mut slow_wallet_collection,
                        &mut epoch_fee_maker_registry_collection,
                        &mut slow_wallet_list_collection,
                        &mut vdf_difficulty_collection,
                        &mut consensus_reward_collection,
                        &mut boundary_status_collection,
                        &mut ancestry_collection,
                        info.version.into(),
                        0,
                        &info.changes,
                    );
                }
                Transaction::BlockMetadataTransaction(block_metadata_transaction) => {
                    let info = &block_metadata_transaction.info;

                    assert_eq!(info.vm_status, "Executed successfully");
                    assert_eq!(info.gas_used, diem_api_types::U64(0));
                    assert_eq!(info.success, true);

                    block_metadata_transaction_collection.push(block_metadata_transaction);

                    let events = &block_metadata_transaction.events;
                    event_collection.push(info.version.into(), transaction.timestamp(), events);

                    process_changes(
                        &mut total_supply_collection,
                        &mut coin_balance_collection,
                        &mut beneficiary_policy_collection,
                        &mut tower_list_collection,
                        &mut burn_tracker_collection,
                        &mut burn_counter_collection,
                        &mut slow_wallet_collection,
                        &mut epoch_fee_maker_registry_collection,
                        &mut slow_wallet_list_collection,
                        &mut vdf_difficulty_collection,
                        &mut consensus_reward_collection,
                        &mut boundary_status_collection,
                        &mut ancestry_collection,
                        info.version.into(),
                        block_metadata_transaction.timestamp.into(),
                        &info.changes,
                    );
                }
                Transaction::StateCheckpointTransaction(state_checkpoint_transaction) => {
                    let info = &state_checkpoint_transaction.info;

                    assert_eq!(info.vm_status, "Executed successfully");
                    assert_eq!(info.gas_used, diem_api_types::U64(0));
                    assert_eq!(info.success, true);
                    assert_eq!(info.changes.len(), 0);

                    state_checkpoint_transaction_collection.push(state_checkpoint_transaction);
                }
            }
        }
    }

    event_collection.to_parquet(format!("{}/event.parquet", &args.dest));
    user_transaction_collection.to_parquet(format!("{}/user_transaction.parquet", &args.dest));
    genesis_transaction_collection
        .to_parquet(format!("{}/genesis_transaction.parquet", &args.dest));
    ancestry_collection.to_parquet(format!("{}/ancestry.parquet", &args.dest));
    block_metadata_transaction_collection
        .to_parquet(format!("{}/block_metadata_transaction.parquet", &args.dest));
    state_checkpoint_transaction_collection.to_parquet(format!(
        "{}/state_checkpoint_transaction.parquet",
        &args.dest
    ));
    total_supply_collection.to_parquet(format!("{}/total_supply.parquet", &args.dest));
    coin_balance_collection.to_parquet(format!("{}/coin_balance.parquet", &args.dest));
    script_collection.to_parquet(format!("{}/script.parquet", &args.dest));
    beneficiary_policy_collection.to_parquet(format!("{}/beneficiary_policy.parquet", &args.dest));

    tower_list_collection.to_parquet(format!("{}/tower_list.parquet", &args.dest));
    burn_tracker_collection.to_parquet(format!("{}/burn_tracker.parquet", &args.dest));
    burn_counter_collection.to_parquet(format!("{}/burn_counter.parquet", &args.dest));
    slow_wallet_collection.to_parquet(format!("{}/slow_wallet.parquet", &args.dest));
    epoch_fee_maker_registry_collection
        .to_parquet(format!("{}/epoch_fee_maker_registry.parquet", &args.dest));
    slow_wallet_list_collection.to_parquet(format!("{}/slow_wallet_list.parquet", &args.dest));
    vdf_difficulty_collection.to_parquet(format!("{}/vdf_difficulty.parquet", &args.dest));
    consensus_reward_collection.to_parquet(format!("{}/consensus_reward.parquet", &args.dest));
    boundary_status_collection.to_parquet(format!("{}/boundary_status.parquet", &args.dest));
}

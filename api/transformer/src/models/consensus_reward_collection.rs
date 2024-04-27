use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct ConsensusRewardCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    nominal_reward: Vec<u64>,
    net_reward: Vec<u64>,
    entry_fee: Vec<u64>,
    clearing_bid: Vec<u64>,
    median_win_bid: Vec<u64>,
    median_history: Vec<String>,
}

impl ConsensusRewardCollection {
    pub fn new() -> ConsensusRewardCollection {
        ConsensusRewardCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            nominal_reward: Vec::new(),
            net_reward: Vec::new(),
            entry_fee: Vec::new(),
            clearing_bid: Vec::new(),
            median_win_bid: Vec::new(),
            median_history: Vec::new(),
        }
    }

    pub fn push(
        &mut self,

        version: u64,
        change_index: u64,
        nominal_reward: u64,
        net_reward: u64,
        entry_fee: u64,
        clearing_bid: u64,
        median_win_bid: u64,
        median_history: Vec<u64>,
    ) {
        self.version.push(version);
        self.change_index.push(change_index);

        self.nominal_reward.push(nominal_reward);
        self.net_reward.push(net_reward);
        self.entry_fee.push(entry_fee);
        self.clearing_bid.push(clearing_bid);
        self.median_win_bid.push(median_win_bid);

        println!("{:?}", &median_history);
        let median_history = serde_json::to_string(&median_history).unwrap();
        println!("median_history = {median_history}");
        self.median_history.push(median_history);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());

        let nominal_reward = arrow_array::UInt64Array::from(self.nominal_reward.clone());
        let net_reward = arrow_array::UInt64Array::from(self.net_reward.clone());
        let entry_fee = arrow_array::UInt64Array::from(self.entry_fee.clone());
        let clearing_bid = arrow_array::UInt64Array::from(self.clearing_bid.clone());
        let median_win_bid = arrow_array::UInt64Array::from(self.median_win_bid.clone());
        let median_history = arrow_array::StringArray::from(self.median_history.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("nominal_reward", Arc::new(nominal_reward) as ArrayRef),
            ("net_reward", Arc::new(net_reward) as ArrayRef),
            ("entry_fee", Arc::new(entry_fee) as ArrayRef),
            ("clearing_bid", Arc::new(clearing_bid) as ArrayRef),
            ("median_win_bid", Arc::new(median_win_bid) as ArrayRef),
            ("median_history", Arc::new(median_history) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

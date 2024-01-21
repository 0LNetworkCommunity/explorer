use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct BoundaryStatusCollection {
    version: Vec<u64>,
    timestamp: Vec<u64>,
    change_index: Vec<u64>,

    incoming_fees: Vec<u64>,
    outgoing_nominal_reward_to_vals: Vec<u64>,
    outgoing_total_reward: Vec<u64>,
    system_fees_collected: Vec<u64>,
}

impl BoundaryStatusCollection {
    pub fn new() -> BoundaryStatusCollection {
        BoundaryStatusCollection {
            version: Vec::new(),
            timestamp: Vec::new(),
            change_index: Vec::new(),
            incoming_fees: Vec::new(),
            outgoing_nominal_reward_to_vals: Vec::new(),
            outgoing_total_reward: Vec::new(),
            system_fees_collected: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        timestamp: u64,
        change_index: u64,

        incoming_fees: u64,
        outgoing_nominal_reward_to_vals: u64,
        outgoing_total_reward: u64,
        system_fees_collected: u64,
    ) {
        self.version.push(version);
        self.timestamp.push(timestamp);
        self.change_index.push(change_index);

        self.incoming_fees.push(incoming_fees);
        self.outgoing_nominal_reward_to_vals
            .push(outgoing_nominal_reward_to_vals);
        self.outgoing_total_reward.push(outgoing_total_reward);
        self.system_fees_collected.push(system_fees_collected);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let incoming_fees = arrow_array::UInt64Array::from(self.incoming_fees.clone());
        let outgoing_nominal_reward_to_vals =
            arrow_array::UInt64Array::from(self.outgoing_nominal_reward_to_vals.clone());
        let outgoing_total_reward =
            arrow_array::UInt64Array::from(self.outgoing_total_reward.clone());
        let system_fees_collected =
            arrow_array::UInt64Array::from(self.system_fees_collected.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("incoming_fees", Arc::new(incoming_fees) as ArrayRef),
            (
                "outgoing_nominal_reward_to_vals",
                Arc::new(outgoing_nominal_reward_to_vals) as ArrayRef,
            ),
            (
                "outgoing_total_reward",
                Arc::new(outgoing_total_reward) as ArrayRef,
            ),
            (
                "system_fees_collected",
                Arc::new(system_fees_collected) as ArrayRef,
            ),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

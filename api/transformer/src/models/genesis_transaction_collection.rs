use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use diem_api_types::transaction::GenesisTransaction;
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

pub struct GenesisTransactionCollection {
    version: Vec<u64>,
    hash: Vec<Vec<u8>>,
    state_change_hash: Vec<Vec<u8>>,
    event_root_hash: Vec<Vec<u8>>,
    state_checkpoint_hash: Vec<Vec<u8>>,
    gas_used: Vec<u64>,
    success: Vec<bool>,
    vm_status: Vec<String>,
    accumulator_root_hash: Vec<Vec<u8>>,
}

impl GenesisTransactionCollection {
    pub fn new() -> GenesisTransactionCollection {
        GenesisTransactionCollection {
            version: Vec::new(),
            hash: Vec::new(),
            state_change_hash: Vec::new(),
            event_root_hash: Vec::new(),
            state_checkpoint_hash: Vec::new(),
            gas_used: Vec::new(),
            success: Vec::new(),
            vm_status: Vec::new(),
            accumulator_root_hash: Vec::new(),
        }
    }

    pub fn push(&mut self, genesis_transaction: &GenesisTransaction) {
        let info = &genesis_transaction.info;

        let mut hash = info.hash.0.to_vec();
        hash.reverse();

        self.version.push(info.version.into());
        self.hash.push(hash);
        self.state_change_hash
            .push(info.state_change_hash.0.to_vec());
        self.event_root_hash.push(info.event_root_hash.0.to_vec());
        self.gas_used.push(info.gas_used.into());
        self.success.push(info.success);
        self.vm_status.push(info.vm_status.clone());
        self.accumulator_root_hash
            .push(info.accumulator_root_hash.0.to_vec());

        match info.state_checkpoint_hash {
            Some(state_checkpoint_hash) => {
                self.state_checkpoint_hash
                    .push(state_checkpoint_hash.0.to_vec());
            }
            None => {
                self.state_checkpoint_hash.push(Vec::new());
            }
        }
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let hash = FixedSizeBinaryArray::try_from_iter(self.hash.iter()).unwrap();
        let state_change_hash =
            FixedSizeBinaryArray::try_from_iter(self.state_change_hash.iter()).unwrap();
        let event_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.event_root_hash.iter()).unwrap();
        let state_checkpoint_hash =
            FixedSizeBinaryArray::try_from_iter(self.state_checkpoint_hash.iter()).unwrap();
        let gas_used = arrow_array::UInt64Array::from(self.gas_used.clone());

        let success = arrow_array::BooleanArray::from(self.success.clone());
        let vm_status = arrow_array::StringArray::from(self.vm_status.clone());
        // let accumulator_root_hash = BinaryArray::from(self.accumulator_root_hash.to_array_data());
        let accumulator_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.accumulator_root_hash.iter()).unwrap();

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("hash", Arc::new(hash) as ArrayRef),
            ("state_change_hash", Arc::new(state_change_hash) as ArrayRef),
            ("event_root_hash", Arc::new(event_root_hash) as ArrayRef),
            (
                "state_checkpoint_hash",
                Arc::new(state_checkpoint_hash) as ArrayRef,
            ),
            ("gas_used", Arc::new(gas_used) as ArrayRef),
            ("success", Arc::new(success) as ArrayRef),
            ("vm_status", Arc::new(vm_status) as ArrayRef),
            (
                "accumulator_root_hash",
                Arc::new(accumulator_root_hash) as ArrayRef,
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

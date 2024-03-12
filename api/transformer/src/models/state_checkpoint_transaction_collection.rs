use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};


use diem_api_types::transaction::StateCheckpointTransaction;

pub struct StateCheckpointTransactionCollection {
    version: Vec<u64>,
    timestamp: Vec<u64>,
}

impl StateCheckpointTransactionCollection {
    pub fn new() -> StateCheckpointTransactionCollection {
      StateCheckpointTransactionCollection {
            version: Vec::new(),
            timestamp: Vec::new(),
        }
    }

    pub fn push(&mut self, state_checkpoint_transaction: &StateCheckpointTransaction) {
        let info = &state_checkpoint_transaction.info;

        self.version.push(info.version.into());
        self.timestamp
            .push(state_checkpoint_transaction.timestamp.into());
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let parquet_file = File::create(path).unwrap();

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
        ])
        .unwrap();

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}
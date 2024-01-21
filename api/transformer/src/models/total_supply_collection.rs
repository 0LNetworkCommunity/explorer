use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct TotalSupplyCollection {
    amount: Vec<Vec<u8>>,
    timestamp: Vec<u64>,
    version: Vec<u64>,
    change_index: Vec<u64>,
}

impl TotalSupplyCollection {
    pub fn new() -> TotalSupplyCollection {
        TotalSupplyCollection {
            amount: Vec::new(),
            timestamp: Vec::new(),
            version: Vec::new(),
            change_index: Vec::new(),
        }
    }

    pub fn push(&mut self, version: u64, timestamp: u64, amount: Vec<u8>, change_index: u64) {
        self.version.push(version);
        self.timestamp.push(timestamp);
        self.amount.push(amount);
        self.change_index.push(change_index);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());
        let amount = FixedSizeBinaryArray::try_from_iter(self.amount.iter()).unwrap();
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
            ("amount", Arc::new(amount) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

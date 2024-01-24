use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct TowerListCollection {
    version: Vec<u64>,
    timestamp: Vec<u64>,
    change_index: Vec<u64>,
    list_count: Vec<u64>,
}

impl TowerListCollection {
    pub fn new() -> TowerListCollection {
        TowerListCollection {
            version: Vec::new(),
            timestamp: Vec::new(),
            change_index: Vec::new(),
            list_count: Vec::new(),
        }
    }

    pub fn push(&mut self, version: u64, timestamp: u64, change_index: u64, list_count: u64) {
        self.version.push(version);
        self.timestamp.push(timestamp);
        self.change_index.push(change_index);

        self.list_count.push(list_count);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());

        let list_count = arrow_array::UInt64Array::from(self.list_count.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("list_count", Arc::new(list_count) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

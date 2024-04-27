use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct SlowWalletListCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,
    list_count: Vec<u64>,
}

impl SlowWalletListCollection {
    pub fn new() -> SlowWalletListCollection {
        SlowWalletListCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            list_count: Vec::new(),
        }
    }

    pub fn push(&mut self, version: u64, change_index: u64, list_count: u64) {
        self.version.push(version);
        self.change_index.push(change_index);
        self.list_count.push(list_count);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let list_count = arrow_array::UInt64Array::from(self.list_count.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
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

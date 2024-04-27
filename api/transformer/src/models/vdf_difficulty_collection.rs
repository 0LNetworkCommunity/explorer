use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct VdfDifficultyCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,
    difficulty: Vec<u64>,
}

impl VdfDifficultyCollection {
    pub fn new() -> VdfDifficultyCollection {
        VdfDifficultyCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            difficulty: Vec::new(),
        }
    }

    pub fn push(&mut self, version: u64, change_index: u64, difficulty: u64) {
        self.version.push(version);
        self.change_index.push(change_index);
        self.difficulty.push(difficulty);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let difficulty = arrow_array::UInt64Array::from(self.difficulty.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("difficulty", Arc::new(difficulty) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

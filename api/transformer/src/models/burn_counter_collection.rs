use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct BurnCounterCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    lifetime_burned: Vec<u64>,
    lifetime_recycled: Vec<u64>,
}

impl BurnCounterCollection {
    pub fn new() -> BurnCounterCollection {
        BurnCounterCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            lifetime_burned: Vec::new(),
            lifetime_recycled: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        change_index: u64,
        lifetime_burned: u64,
        lifetime_recycled: u64,
    ) {
        self.version.push(version);
        self.change_index.push(change_index);

        self.lifetime_burned.push(lifetime_burned);
        self.lifetime_recycled.push(lifetime_recycled);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());

        let lifetime_burned = arrow_array::UInt64Array::from(self.lifetime_burned.clone());
        let lifetime_recycled = arrow_array::UInt64Array::from(self.lifetime_recycled.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("lifetime_burned", Arc::new(lifetime_burned) as ArrayRef),
            ("lifetime_recycled", Arc::new(lifetime_recycled) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

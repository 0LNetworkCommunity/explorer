use arrow_array::{ArrayRef, ListArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

use crate::to_array_data::create_array_data_2d;

pub struct DonorVoiceRegistryCollection {
    version: Vec<u64>,
    registry: Vec<Vec<Vec<u8>>>,
    change_index: Vec<u64>,
}

impl DonorVoiceRegistryCollection {
    pub fn new() -> DonorVoiceRegistryCollection {
        DonorVoiceRegistryCollection {
            version: Vec::new(),
            registry: Vec::new(),
            change_index: Vec::new(),
        }
    }

    pub fn push(&mut self, version: u64, change_index: u64, mut registry: Vec<Vec<u8>>) {
        self.version.push(version);
        self.change_index.push(change_index);

        registry.iter_mut().for_each(|it| {
            it.reverse();
        });

        self.registry.push(registry);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let parquet_file = File::create(path).unwrap();

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let registry = create_array_data_2d(&self.registry, "registry");

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("registry", Arc::new(ListArray::from(registry)) as ArrayRef),
        ])
        .unwrap();

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

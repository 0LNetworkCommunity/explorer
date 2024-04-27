use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, FixedSizeBinaryArray, ListArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

use crate::to_array_data::create_array_data_2d;

pub struct MultisigAccountOwnersCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    address: Vec<Vec<u8>>,
    owners: Vec<Vec<Vec<u8>>>,
}

impl MultisigAccountOwnersCollection {
    pub fn new() -> MultisigAccountOwnersCollection {
        MultisigAccountOwnersCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            address: Vec::new(),
            owners: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        change_index: u64,
        address: Vec<u8>,
        mut owners: Vec<Vec<u8>>,
    ) {
        let mut address = address;
        address.reverse();
        self.address.push(address);

        owners.iter_mut().for_each(|it| {
            it.reverse();
        });

        self.owners.push(owners);

        self.version.push(version);
        self.change_index.push(change_index);
    }

    pub fn to_parquet(&self, path: String) {
        if self.address.is_empty() {
            return;
        }

        let parquet_file = File::create(path).unwrap();

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();
        let owners = create_array_data_2d(&self.owners, "owners");

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("address", Arc::new(address) as ArrayRef),
            ("owners", Arc::new(ListArray::from(owners)) as ArrayRef),
        ])
        .unwrap();

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

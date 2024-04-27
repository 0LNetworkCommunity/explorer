use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, FixedSizeBinaryArray, ListArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

use crate::to_array_data::create_array_data_2d;

pub struct AncestryCollection {
    address: Vec<Vec<u8>>,
    tree: Vec<Vec<Vec<u8>>>,
}

impl AncestryCollection {
    pub fn new() -> AncestryCollection {
        AncestryCollection {
            address: Vec::new(),
            tree: Vec::new(),
        }
    }

    pub fn push(&mut self, address: Vec<u8>, mut tree: Vec<Vec<u8>>) {
        let mut address = address;
        address.reverse();
        self.address.push(address);

        tree.iter_mut().for_each(|it| {
            it.reverse();
        });

        self.tree.push(tree);
    }

    pub fn to_parquet(&self, path: String) {
        if self.address.is_empty() {
            return;
        }

        let parquet_file = File::create(path).unwrap();

        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();
        let tree = create_array_data_2d(&self.tree, "tree");

        let batch = RecordBatch::try_from_iter(vec![
            ("address", Arc::new(address) as ArrayRef),
            ("tree", Arc::new(ListArray::from(tree)) as ArrayRef),
        ])
        .unwrap();

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

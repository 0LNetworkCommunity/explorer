use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use diem_api_types::MoveStructTag;
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

pub struct MultiActionCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    address: Vec<Vec<u8>>,

    tally_type_module_address: Vec<Vec<u8>>,
    tally_type_module_name: Vec<String>,
    tally_type_struct_name: Vec<String>,

    change: Vec<String>,
}

impl MultiActionCollection {
    pub fn new() -> MultiActionCollection {
        MultiActionCollection {
            version: Vec::new(),
            change_index: Vec::new(),

            address: Vec::new(),

            tally_type_module_address: Vec::new(),
            tally_type_module_name: Vec::new(),
            tally_type_struct_name: Vec::new(),

            change: Vec::new(),
        }
    }

    pub fn push(
        &mut self,

        version: u64,
        change_index: u64,

        address: Vec<u8>,
        tally_type: MoveStructTag,
        change: String,
    ) {
        self.version.push(version);
        self.change_index.push(change_index);

        let mut address = address;
        address.reverse();
        self.address.push(address);

        let mut tally_type_module_address = tally_type.address.inner().to_vec();
        tally_type_module_address.reverse();

        self.tally_type_module_address
            .push(tally_type_module_address);
        self.tally_type_module_name
            .push(tally_type.module.to_string());
        self.tally_type_struct_name
            .push(tally_type.name.to_string());

        self.change.push(change);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();
        let tally_type_module_address =
            FixedSizeBinaryArray::try_from_iter(self.tally_type_module_address.iter()).unwrap();
        let tally_type_module_name =
            arrow_array::StringArray::from(self.tally_type_module_name.clone());
        let tally_type_struct_name =
            arrow_array::StringArray::from(self.tally_type_struct_name.clone());
        let change = arrow_array::StringArray::from(self.change.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("address", Arc::new(address) as ArrayRef),
            (
                "tally_type_module_address",
                Arc::new(tally_type_module_address) as ArrayRef,
            ),
            (
                "tally_type_module_name",
                Arc::new(tally_type_module_name) as ArrayRef,
            ),
            (
                "tally_type_struct_name",
                Arc::new(tally_type_struct_name) as ArrayRef,
            ),
            ("change", Arc::new(change) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct SlowWalletCollection {
    version: Vec<u64>,
    timestamp: Vec<u64>,
    change_index: Vec<u64>,

    address: Vec<Vec<u8>>,

    unlocked: Vec<u64>,
    transferred: Vec<u64>,
}

impl SlowWalletCollection {
    pub fn new() -> SlowWalletCollection {
        SlowWalletCollection {
            version: Vec::new(),
            timestamp: Vec::new(),
            change_index: Vec::new(),

            address: Vec::new(),

            unlocked: Vec::new(),
            transferred: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        timestamp: u64,
        change_index: u64,

        address: Vec<u8>,

        unlocked: u64,
        transferred: u64,
    ) {
        self.version.push(version);
        self.timestamp.push(timestamp);
        self.change_index.push(change_index);

        let mut address = address;
        address.reverse();
        self.address.push(address);

        self.unlocked.push(unlocked);
        self.transferred.push(transferred);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();

        let unlocked = arrow_array::UInt64Array::from(self.unlocked.clone());
        let transferred = arrow_array::UInt64Array::from(self.transferred.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("address", Arc::new(address) as ArrayRef),
            ("unlocked", Arc::new(unlocked) as ArrayRef),
            ("transferred", Arc::new(transferred) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

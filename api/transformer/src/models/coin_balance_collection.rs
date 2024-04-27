use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct CoinBalanceCollection {
    address: Vec<Vec<u8>>,
    balance: Vec<u64>,
    version: Vec<u64>,
    change_index: Vec<u64>,
    coin_address: Vec<Vec<u8>>,
    coin_module: Vec<String>,
    coin_name: Vec<String>,
}

impl CoinBalanceCollection {
    pub fn new() -> CoinBalanceCollection {
        CoinBalanceCollection {
            address: Vec::new(),
            balance: Vec::new(),
            version: Vec::new(),
            change_index: Vec::new(),
            coin_address: Vec::new(),
            coin_module: Vec::new(),
            coin_name: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        address: Vec<u8>,
        balance: u64,
        version: u64,
        change_index: u64,
        coin_address: Vec<u8>,
        coin_module: String,
        coin_name: String,
    ) {
        let mut address = address;
        address.reverse();

        let mut coin_address = coin_address;
        coin_address.reverse();

        self.address.push(address);
        self.balance.push(balance);
        self.version.push(version);
        self.change_index.push(change_index);
        self.coin_address.push(coin_address);
        self.coin_module.push(coin_module);
        self.coin_name.push(coin_name);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();
        let balance = arrow_array::UInt64Array::from(self.balance.clone());
        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let coin_address = FixedSizeBinaryArray::try_from_iter(self.coin_address.iter()).unwrap();
        let coin_module = arrow_array::StringArray::from(self.coin_module.clone());
        let coin_name = arrow_array::StringArray::from(self.coin_name.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("address", Arc::new(address) as ArrayRef),
            ("version", Arc::new(version) as ArrayRef),
            ("balance", Arc::new(balance) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("coin_address", Arc::new(coin_address) as ArrayRef),
            ("coin_module", Arc::new(coin_module) as ArrayRef),
            ("coin_name", Arc::new(coin_name) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

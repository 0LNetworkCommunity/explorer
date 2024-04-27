use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct BurnTrackerCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    address: Vec<Vec<u8>>,

    burn_at_last_calc: Vec<u64>,
    cumu_burn: Vec<u64>,
    prev_balance: Vec<u64>,
    prev_supply: Vec<u64>,
}

impl BurnTrackerCollection {
    pub fn new() -> BurnTrackerCollection {
        BurnTrackerCollection {
            version: Vec::new(),
            change_index: Vec::new(),
            address: Vec::new(),
            burn_at_last_calc: Vec::new(),
            cumu_burn: Vec::new(),
            prev_balance: Vec::new(),
            prev_supply: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        change_index: u64,
        address: Vec<u8>,
        burn_at_last_calc: u64,
        cumu_burn: u64,
        prev_balance: u64,
        prev_supply: u64,
    ) {
        self.version.push(version);
        self.change_index.push(change_index);

        let mut address = address;
        address.reverse();
        self.address.push(address);

        self.burn_at_last_calc.push(burn_at_last_calc);
        self.cumu_burn.push(cumu_burn);
        self.prev_balance.push(prev_balance);
        self.prev_supply.push(prev_supply);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());
        let address = FixedSizeBinaryArray::try_from_iter(self.address.iter()).unwrap();

        let burn_at_last_calc = arrow_array::UInt64Array::from(self.burn_at_last_calc.clone());
        let cumu_burn = arrow_array::UInt64Array::from(self.cumu_burn.clone());
        let prev_balance = arrow_array::UInt64Array::from(self.prev_balance.clone());
        let prev_supply = arrow_array::UInt64Array::from(self.prev_supply.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("address", Arc::new(address) as ArrayRef),
            ("burn_at_last_calc", Arc::new(burn_at_last_calc) as ArrayRef),
            ("cumu_burn", Arc::new(cumu_burn) as ArrayRef),
            ("prev_balance", Arc::new(prev_balance) as ArrayRef),
            ("prev_supply", Arc::new(prev_supply) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

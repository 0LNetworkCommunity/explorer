use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, RecordBatch};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

pub struct BeneficiaryPolicyCollection {
    version: Vec<u64>,
    change_index: Vec<u64>,

    lifetime_pledged: Vec<u64>,
    lifetime_withdrawn: Vec<u64>,
    amount_available: Vec<u64>,
    pledgers_count: Vec<u64>,
}

impl BeneficiaryPolicyCollection {
    pub fn new() -> BeneficiaryPolicyCollection {
        BeneficiaryPolicyCollection {
            version: Vec::new(),
            change_index: Vec::new(),

            lifetime_pledged: Vec::new(),
            lifetime_withdrawn: Vec::new(),
            amount_available: Vec::new(),
            pledgers_count: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        version: u64,
        change_index: u64,

        lifetime_pledged: u64,
        lifetime_withdrawn: u64,
        amount_available: u64,
        pledgers_count: u64,
    ) {
        self.version.push(version);
        self.change_index.push(change_index);

        self.lifetime_pledged.push(lifetime_pledged);
        self.lifetime_withdrawn.push(lifetime_withdrawn);
        self.amount_available.push(amount_available);
        self.pledgers_count.push(pledgers_count);
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let change_index = arrow_array::UInt64Array::from(self.change_index.clone());

        let lifetime_pledged = arrow_array::UInt64Array::from(self.lifetime_pledged.clone());
        let lifetime_withdrawn = arrow_array::UInt64Array::from(self.lifetime_withdrawn.clone());
        let amount_available = arrow_array::UInt64Array::from(self.amount_available.clone());
        let pledgers_count = arrow_array::UInt64Array::from(self.pledgers_count.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("change_index", Arc::new(change_index) as ArrayRef),
            ("lifetime_pledged", Arc::new(lifetime_pledged) as ArrayRef),
            (
                "lifetime_withdrawn",
                Arc::new(lifetime_withdrawn) as ArrayRef,
            ),
            ("amount_available", Arc::new(amount_available) as ArrayRef),
            ("pledgers_count", Arc::new(pledgers_count) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

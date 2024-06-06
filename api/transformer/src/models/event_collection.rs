use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use diem_api_types::{Event, Transaction};
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};
use std::{fs::File, sync::Arc};

pub struct EventCollection {
    version: Vec<u64>,
    creation_number: Vec<u64>,
    account_address: Vec<Vec<u8>>,
    sequence_number: Vec<u64>,
    module_address: Vec<Vec<u8>>,
    module_name: Vec<String>,
    struct_name: Vec<String>,
    data: Vec<String>,
    index: Vec<u64>,
}

impl EventCollection {
    pub fn new() -> EventCollection {
        EventCollection {
            version: Vec::new(),
            creation_number: Vec::new(),
            account_address: Vec::new(),
            sequence_number: Vec::new(),
            module_address: Vec::new(),
            module_name: Vec::new(),
            struct_name: Vec::new(),
            data: Vec::new(),
            index: Vec::new(),
        }
    }

    pub fn push(
        &mut self,
        transaction: &Transaction
    ) {
        match transaction {
            Transaction::PendingTransaction(_) => {}
            Transaction::UserTransaction(user_transaction) => {
                let info = &user_transaction.info;
                let events = &user_transaction.events;
                self.push_events(info.version.into(), events);
            }
            Transaction::GenesisTransaction(genesis_transaction) => {
                let info = &genesis_transaction.info;
                let events = &genesis_transaction.events;
                self.push_events(info.version.into(), events);
            }
            Transaction::BlockMetadataTransaction(block_metadata_transaction) => {
                let info = &block_metadata_transaction.info;
                let events = &block_metadata_transaction.events;
                self.push_events(info.version.into(), events);
            }
            Transaction::StateCheckpointTransaction(_) => {}
        }
    }

    fn push_events(
        &mut self,
        version: u64,
        events: &Vec<Event>
    ) {
        for (index, event) in events.iter().enumerate() {
            self.index.push(index as u64);
            self.version.push(version);
            self.creation_number.push(event.guid.creation_number.into());

            let mut account_address = event.guid.account_address.inner().to_vec();
            account_address.reverse();
            self.account_address.push(account_address);

            self.sequence_number.push(event.sequence_number.into());
            self.data.push(serde_json::to_string(&event.data).unwrap());

            match &event.typ {
                diem_api_types::MoveType::Struct(s) => {
                    let mut module_address = s.address.inner().to_vec();
                    module_address.reverse();
                    self.module_address.push(module_address);

                    self.module_name.push(s.module.0.to_string());
                    self.struct_name.push(s.name.0.to_string());
                }
                move_type => {
                    panic!("Invalid event move type {:?}", move_type);
                }
            }
        }
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let index = arrow_array::UInt64Array::from(self.index.clone());
        let creation_number = arrow_array::UInt64Array::from(self.creation_number.clone());
        let account_address =
            FixedSizeBinaryArray::try_from_iter(self.account_address.iter()).unwrap();
        let sequence_number = arrow_array::UInt64Array::from(self.sequence_number.clone());
        let module_address =
            FixedSizeBinaryArray::try_from_iter(self.module_address.iter()).unwrap();

        let module_name = arrow_array::StringArray::from(self.module_name.clone());
        let struct_name = arrow_array::StringArray::from(self.struct_name.clone());
        let data = arrow_array::StringArray::from(self.data.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("index", Arc::new(index) as ArrayRef),
            ("creation_number", Arc::new(creation_number) as ArrayRef),
            ("account_address", Arc::new(account_address) as ArrayRef),
            ("sequence_number", Arc::new(sequence_number) as ArrayRef),
            ("module_address", Arc::new(module_address) as ArrayRef),
            ("module_name", Arc::new(module_name) as ArrayRef),
            ("struct_name", Arc::new(struct_name) as ArrayRef),
            ("data", Arc::new(data) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();

        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

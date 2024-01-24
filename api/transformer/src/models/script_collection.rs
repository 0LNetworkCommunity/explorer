use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, FixedSizeBinaryArray, RecordBatch};
use diem_api_types::UserTransaction;
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

pub struct ScriptCollection {
    version: Vec<u64>,
    hash: Vec<Vec<u8>>,
    state_change_hash: Vec<Vec<u8>>,
    event_root_hash: Vec<Vec<u8>>,
    gas_used: Vec<u64>,
    success: Vec<bool>,
    vm_status: Vec<String>,
    accumulator_root_hash: Vec<Vec<u8>>,
    sender: Vec<Vec<u8>>,
    sequence_number: Vec<u64>,
    max_gas_amount: Vec<u64>,
    gas_unit_price: Vec<u64>,
    expiration_timestamp: Vec<u64>,
    abi: Vec<String>,
    arguments: Vec<String>,
    type_arguments: Vec<String>,
    timestamp: Vec<u64>,
}

impl ScriptCollection {
    pub fn new() -> ScriptCollection {
        ScriptCollection {
            version: Vec::new(),
            hash: Vec::new(),
            state_change_hash: Vec::new(),
            event_root_hash: Vec::new(),
            gas_used: Vec::new(),
            success: Vec::new(),
            vm_status: Vec::new(),
            accumulator_root_hash: Vec::new(),
            sender: Vec::new(),
            sequence_number: Vec::new(),
            max_gas_amount: Vec::new(),
            gas_unit_price: Vec::new(),
            expiration_timestamp: Vec::new(),
            abi: Vec::new(),
            arguments: Vec::new(),
            type_arguments: Vec::new(),
            timestamp: Vec::new(),
        }
    }

    pub fn push(&mut self, user_transaction: &UserTransaction) {
        let info = &user_transaction.info;
        let request = &user_transaction.request;
        let payload = &request.payload;

        if let diem_api_types::TransactionPayload::ScriptPayload(script_payload) = payload {
            assert_eq!(info.state_checkpoint_hash, None);

            let mut hash = info.hash.0.to_vec();
            hash.reverse();

            let mut sender = request.sender.inner().to_vec();
            sender.reverse();

            self.version.push(info.version.into());
            self.hash.push(hash);
            self.state_change_hash
                .push(info.state_change_hash.0.to_vec());
            self.event_root_hash.push(info.event_root_hash.0.to_vec());
            self.gas_used.push(info.gas_used.into());
            self.success.push(info.success);
            self.vm_status.push(info.vm_status.clone());
            self.accumulator_root_hash
                .push(info.accumulator_root_hash.0.to_vec());
            self.sender.push(sender);
            self.sequence_number.push(request.sequence_number.into());
            self.max_gas_amount.push(request.max_gas_amount.into());
            self.gas_unit_price.push(request.gas_unit_price.into());
            self.expiration_timestamp
                .push(request.expiration_timestamp_secs.into());

            self.timestamp.push(user_transaction.timestamp.into());

            let arguments = serde_json::to_string(&script_payload.arguments).unwrap();
            self.arguments.push(arguments);

            let type_arguments = serde_json::to_string(&script_payload.type_arguments).unwrap();
            self.type_arguments.push(type_arguments);

            let abi = serde_json::to_string(&script_payload.code.abi).unwrap();
            self.abi.push(abi);
        } else {
            panic!("payload must be ScriptPayload");
        }
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let version = arrow_array::UInt64Array::from(self.version.clone());
        let hash = FixedSizeBinaryArray::try_from_iter(self.hash.iter()).unwrap();
        let state_change_hash =
            FixedSizeBinaryArray::try_from_iter(self.state_change_hash.iter()).unwrap();
        let event_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.event_root_hash.iter()).unwrap();
        let gas_used = arrow_array::UInt64Array::from(self.gas_used.clone());
        let success = arrow_array::BooleanArray::from(self.success.clone());
        let vm_status = arrow_array::StringArray::from(self.vm_status.clone());
        // let accumulator_root_hash = BinaryArray::from(self.accumulator_root_hash.to_array_data());
        let accumulator_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.accumulator_root_hash.iter()).unwrap();
        let sender = FixedSizeBinaryArray::try_from_iter(self.sender.iter()).unwrap();
        let sequence_number = arrow_array::UInt64Array::from(self.sequence_number.clone());
        let max_gas_amount = arrow_array::UInt64Array::from(self.max_gas_amount.clone());
        let gas_unit_price = arrow_array::UInt64Array::from(self.gas_unit_price.clone());
        let expiration_timestamp =
            arrow_array::UInt64Array::from(self.expiration_timestamp.clone());

        let arguments = arrow_array::StringArray::from(self.arguments.clone());
        let type_arguments = arrow_array::StringArray::from(self.type_arguments.clone());
        let abi = arrow_array::StringArray::from(self.abi.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("hash", Arc::new(hash) as ArrayRef),
            ("state_change_hash", Arc::new(state_change_hash) as ArrayRef),
            ("event_root_hash", Arc::new(event_root_hash) as ArrayRef),
            ("gas_used", Arc::new(gas_used) as ArrayRef),
            ("success", Arc::new(success) as ArrayRef),
            ("vm_status", Arc::new(vm_status) as ArrayRef),
            (
                "accumulator_root_hash",
                Arc::new(accumulator_root_hash) as ArrayRef,
            ),
            ("sender", Arc::new(sender) as ArrayRef),
            ("sequence_number", Arc::new(sequence_number) as ArrayRef),
            ("max_gas_amount", Arc::new(max_gas_amount) as ArrayRef),
            ("gas_unit_price", Arc::new(gas_unit_price) as ArrayRef),
            (
                "expiration_timestamp",
                Arc::new(expiration_timestamp) as ArrayRef,
            ),
            ("arguments", Arc::new(arguments) as ArrayRef),
            ("type_arguments", Arc::new(type_arguments) as ArrayRef),
            ("abi", Arc::new(abi) as ArrayRef),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
        ])
        .unwrap();

        let parquet_file = File::create(path).unwrap();
        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

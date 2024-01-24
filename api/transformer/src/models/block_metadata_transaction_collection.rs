use std::{fs::File, sync::Arc};

use arrow_array::{ArrayRef, BinaryArray, FixedSizeBinaryArray, RecordBatch};
use diem_api_types::BlockMetadataTransaction;
use parquet::{arrow::arrow_writer::ArrowWriter, file::properties::WriterProperties};

use crate::to_array_data::ToArrayData;

pub struct BlockMetadataTransactionCollection {
    id: Vec<Vec<u8>>,
    version: Vec<u64>,
    hash: Vec<Vec<u8>>,
    epoch: Vec<u64>,
    round: Vec<u64>,
    previous_block_votes_bitvec: Vec<Vec<u8>>,
    proposer: Vec<Vec<u8>>,
    failed_proposer_indices: Vec<Vec<u32>>,
    timestamp: Vec<u64>,
    event_root_hash: Vec<Vec<u8>>,
    accumulator_root_hash: Vec<Vec<u8>>,
    state_change_hash: Vec<Vec<u8>>,
    state_checkpoint_hash: Vec<Vec<u8>>,
}

impl BlockMetadataTransactionCollection {
    pub fn new() -> BlockMetadataTransactionCollection {
        BlockMetadataTransactionCollection {
            id: Vec::new(),
            version: Vec::new(),
            hash: Vec::new(),
            epoch: Vec::new(),
            round: Vec::new(),
            previous_block_votes_bitvec: Vec::new(),
            proposer: Vec::new(),
            failed_proposer_indices: Vec::new(),
            timestamp: Vec::new(),
            event_root_hash: Vec::new(),
            accumulator_root_hash: Vec::new(),
            state_change_hash: Vec::new(),
            state_checkpoint_hash: Vec::new(),
        }
    }

    pub fn push(&mut self, block_metadata_transaction: &BlockMetadataTransaction) {
        let info = &block_metadata_transaction.info;

        self.id.push(block_metadata_transaction.id.0.to_vec());
        self.version.push(info.version.into());
        self.hash.push(info.hash.0.to_vec());
        self.epoch.push(block_metadata_transaction.epoch.into());
        self.round.push(block_metadata_transaction.round.into());
        self.previous_block_votes_bitvec.push(
            block_metadata_transaction
                .previous_block_votes_bitvec
                .clone(),
        );
        self.proposer
            .push(block_metadata_transaction.proposer.inner().to_vec());
        self.failed_proposer_indices
            .push(block_metadata_transaction.failed_proposer_indices.clone());
        self.timestamp
            .push(block_metadata_transaction.timestamp.into());
        self.state_change_hash
            .push(info.state_change_hash.0.to_vec());
        self.event_root_hash.push(info.event_root_hash.0.to_vec());
        self.accumulator_root_hash
            .push(info.accumulator_root_hash.0.to_vec());

        match info.state_checkpoint_hash {
            Some(state_checkpoint_hash) => {
                self.state_checkpoint_hash
                    .push(state_checkpoint_hash.0.to_vec());
            }
            None => {
                self.state_checkpoint_hash.push(Vec::new());
            }
        }
    }

    pub fn to_parquet(&self, path: String) {
        if self.version.is_empty() {
            return;
        }

        let parquet_file = File::create(path).unwrap();

        let id = FixedSizeBinaryArray::try_from_iter(self.id.iter()).unwrap();
        let version = arrow_array::UInt64Array::from(self.version.clone());
        let timestamp = arrow_array::UInt64Array::from(self.timestamp.clone());
        let hash = FixedSizeBinaryArray::try_from_iter(self.hash.iter()).unwrap();

        let state_change_hash =
            FixedSizeBinaryArray::try_from_iter(self.state_change_hash.iter()).unwrap();
        let event_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.event_root_hash.iter()).unwrap();
        let accumulator_root_hash =
            FixedSizeBinaryArray::try_from_iter(self.accumulator_root_hash.iter()).unwrap();
        let epoch = arrow_array::UInt64Array::from(self.epoch.clone());
        let round = arrow_array::UInt64Array::from(self.round.clone());

        let previous_block_votes_bitvec =
            BinaryArray::from(self.previous_block_votes_bitvec.to_array_data());
        let proposer = FixedSizeBinaryArray::try_from_iter(self.proposer.iter()).unwrap();
        let failed_proposer_indices =
            BinaryArray::from(self.failed_proposer_indices.to_array_data());
        let state_checkpoint_hash = BinaryArray::from(self.state_checkpoint_hash.to_array_data());

        let batch = RecordBatch::try_from_iter(vec![
            ("version", Arc::new(version) as ArrayRef),
            ("hash", Arc::new(hash) as ArrayRef),
            ("state_change_hash", Arc::new(state_change_hash) as ArrayRef),
            ("event_root_hash", Arc::new(event_root_hash) as ArrayRef),
            (
                "accumulator_root_hash",
                Arc::new(accumulator_root_hash) as ArrayRef,
            ),
            ("id", Arc::new(id) as ArrayRef),
            ("epoch", Arc::new(epoch) as ArrayRef),
            ("round", Arc::new(round) as ArrayRef),
            (
                "previous_block_votes_bitvec",
                Arc::new(previous_block_votes_bitvec) as ArrayRef,
            ),
            ("proposer", Arc::new(proposer) as ArrayRef),
            (
                "failed_proposer_indices",
                Arc::new(failed_proposer_indices) as ArrayRef,
            ),
            ("timestamp", Arc::new(timestamp) as ArrayRef),
            (
                "state_checkpoint_hash",
                Arc::new(state_checkpoint_hash) as ArrayRef,
            ),
        ])
        .unwrap();

        let props = WriterProperties::builder().build();
        let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
        writer.write(&batch).expect("Writing batch");
        writer.close().unwrap();
    }
}

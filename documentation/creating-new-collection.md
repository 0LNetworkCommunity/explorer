# Creating a New Collection in the 0L Explorer

This guide explains the process of adding a new data collection to the 0L Explorer, from transformer code to Clickhouse integration.

## Overview of the Transformer System

The transformer is a Rust application that processes blockchain transaction data (from JSON format) and converts it into parquet files that can be efficiently imported into Clickhouse. This enables high-performance analytics on the blockchain data.

## Key Components

### 1. Data Models

The transformer defines collection models for different blockchain data types:
- `UserTransactionCollection`
- `ScriptCollection`
- `GenesisTransactionCollection`
- `EventCollection`
- `TotalSupplyCollection`
- `CoinBalanceCollection`
- and many others specific to the 0L blockchain

Each collection:
- Contains vectors for storing specific fields
- Has methods for adding new data entries
- Provides functionality to output data as parquet files

### 2. Data Processing Flow

The main processing flow in `main.rs` consists of:

1. **Parse Command Line Arguments**: Reads input transaction files and destination directory
2. **Initialize Collections**: Creates empty collections for each data type
3. **Process Files**: Reads each transaction file and processes transactions
4. **Extract Data**: For each transaction, processes various data types:
   - Transaction metadata
   - Events
   - Resource changes
   - Table item changes
5. **Output to Parquet**: Converts each collection to a parquet file in the destination directory

### 3. Data Extraction

The key logic is in the `process_changes` function, which:
- Takes transaction data
- Examines each change in the transaction
- Identifies the type of data (e.g., resource changes, table changes)
- Extracts relevant data based on Move module and struct types
- Stores data in the appropriate collection

## Adding a New Collection

To add a new collection, you need to make changes in multiple parts of the system:

### 1. In the Transformer (Rust)

1. **Create a New Collection Model**:
   ```rust
   // Create in src/models/new_collection.rs
   pub struct NewCollection {
       version: Vec<u64>,
       field1: Vec<String>,
       field2: Vec<u64>,
       // Add other fields as needed
   }

   impl NewCollection {
       pub fn new() -> NewCollection {
           NewCollection {
               version: Vec::new(),
               field1: Vec::new(),
               field2: Vec::new(),
               // Initialize other fields
           }
       }

       pub fn push(&mut self, version: u64, field1: String, field2: u64) {
           self.version.push(version);
           self.field1.push(field1);
           self.field2.push(field2);
           // Add other fields
       }

       pub fn to_parquet(&self, path: String) {
           if self.version.is_empty() {
               return;
           }

           // Convert vectors to Arrow arrays
           let version = arrow_array::UInt64Array::from(self.version.clone());
           let field1 = arrow_array::StringArray::from(self.field1.clone());
           let field2 = arrow_array::UInt64Array::from(self.field2.clone());

           // Create RecordBatch
           let batch = RecordBatch::try_from_iter(vec![
               ("version", Arc::new(version) as ArrayRef),
               ("field1", Arc::new(field1) as ArrayRef),
               ("field2", Arc::new(field2) as ArrayRef),
               // Add other fields
           ]).unwrap();

           // Write to parquet file
           let parquet_file = File::create(path).unwrap();
           let props = WriterProperties::builder().build();
           let mut writer = ArrowWriter::try_new(parquet_file, batch.schema(), Some(props)).unwrap();
           writer.write(&batch).expect("Writing batch");
           writer.close().unwrap();
       }
   }
   ```

2. **Add to Models Module**:
   ```rust
   // Update src/models/mod.rs
   mod new_collection;
   // ...
   pub use new_collection::NewCollection;
   ```

3. **Update Main Processing Logic**:
   ```rust
   // In main.rs
   let mut new_collection = NewCollection::new();

   // Add to process_changes function to extract data
   fn process_changes(
       // ... existing parameters
       new_collection: &mut NewCollection,
       // ... other parameters
   ) {
       // ... existing processing logic

       // Add condition to identify and extract data for your new collection
       if type_address == ROOT_ACCOUNT_ADDRESS.inner()
           && type_module == "your_module"
           && type_name == "YourStruct"
       {
           // Extract data from transaction
           let data = &change.data.data.0;
           let field1: String = serde_json::from_value(
               data.get(&IdentifierWrapper::from_str("field1").unwrap())
                   .unwrap()
                   .clone(),
           ).unwrap();
           let field2: String = serde_json::from_value(
               data.get(&IdentifierWrapper::from_str("field2").unwrap())
                   .unwrap()
                   .clone(),
           ).unwrap();
           let field2_value = field2.parse::<u64>().unwrap();

           // Push to collection
           new_collection.push(version, field1, field2_value);
       }
   }

   // Add to main function to write parquet file
   new_collection.to_parquet(format!("{}/new_collection.parquet", &args.dest));
   ```

### 2. In Clickhouse

1. **Create a Table Schema**:
   ```sql
   CREATE TABLE new_collection (
     version UInt64,
     field1 String,
     field2 UInt64
   ) ENGINE = MergeTree()
   ORDER BY (version);
   ```

2. **Create an Insert Query**:
   Create a file in the Clickhouse API service's queries directory:
   ```sql
   -- filepath: /home/hemulin/workspace/magicInternetMoney/diem/0l/explorer/api/src/clickhouse/queries/new_collection.sql
   INSERT INTO new_collection SELECT * FROM input('version UInt64, field1 String, field2 UInt64') FORMAT Parquet
   ```

### 3. In the API (TypeScript)

1. **Add GraphQL Resolvers/Types** (if needed):
   ```typescript
   // Create model
   @ObjectType()
   export class NewCollectionEntity {
     @Field(() => Int)
     version: number;

     @Field(() => String)
     field1: string;

     @Field(() => Int)
     field2: number;
   }

   // Add resolver
   @Resolver()
   export class NewCollectionResolver {
     constructor(private readonly clickhouseService: ClickhouseService) {}

     @Query(() => [NewCollectionEntity])
     async getNewCollectionData(): Promise<NewCollectionEntity[]> {
       const query = `
         SELECT
           version,
           field1,
           field2
         FROM new_collection
         ORDER BY version DESC
         LIMIT 100
       `;

       return this.clickhouseService.executeQuery(query);
     }
   }
   ```

## Best Practices

1. **Identify Data Structure**: Understand the Move module structure you want to capture
2. **Choose Key Fields**: Select fields that are relevant for analytics
3. **Test Thoroughly**: Test with sample transactions to ensure data is captured correctly
4. **Add Indexing**: Add appropriate indexes in Clickhouse for query performance
5. **Update API**: Create API endpoints/GraphQL queries to access the new data

## Integration with ETL Pipeline

The transformer is part of a larger ETL pipeline:

1. **Data Fetching**: NodeWatcherService fetches transaction data
2. **Transformation**: TransformerService converts data to parquet
3. **S3 Upload**: S3Service uploads parquet files
4. **Clickhouse Import**: ClickhouseService imports parquet files into tables

When adding a new collection, you need to ensure all components in this pipeline understand and can process your new data type.

## Example: Adding a Balance History Collection

Let's walk through an example of adding a collection to track balance history:

1. **Define the collection model**:
   ```rust
   pub struct BalanceHistoryCollection {
       version: Vec<u64>,
       address: Vec<Vec<u8>>,
       balance: Vec<u64>,
       timestamp: Vec<u64>,
   }
   ```

2. **Implement methods**:
   ```rust
   impl BalanceHistoryCollection {
       pub fn new() -> Self {
           Self {
               version: Vec::new(),
               address: Vec::new(),
               balance: Vec::new(),
               timestamp: Vec::new(),
           }
       }

       pub fn push(&mut self, version: u64, address: Vec<u8>, balance: u64, timestamp: u64) {
           self.version.push(version);
           self.address.push(address);
           self.balance.push(balance);
           self.timestamp.push(timestamp);
       }

       pub fn to_parquet(&self, path: String) {
           // ...parquet conversion logic
       }
   }
   ```

3. **Add to process_changes**:
   ```rust
   if type_module == "coin" && type_name == "CoinStore" {
       // Extract balance data
       let balance = extract_balance_from_data(data);
       balance_history_collection.push(version, address.clone(), balance, timestamp);
   }
   ```

4. **Create Clickhouse table**:
   ```sql
   CREATE TABLE balance_history (
     version UInt64,
     address FixedString(32),
     balance UInt64,
     timestamp UInt64
   ) ENGINE = MergeTree()
   ORDER BY (address, timestamp);
   ```

5. **Add query in API**:
   ```typescript
   async getBalanceHistory(address: string): Promise<BalanceHistoryPoint[]> {
     const query = `
       SELECT
         balance,
         timestamp
       FROM balance_history
       WHERE address = unhex('${address}')
       ORDER BY timestamp ASC
     `;

     return this.clickhouseService.executeQuery(query);
   }
   ```

## Troubleshooting

Common issues when adding new collections:

1. **Data Type Mismatches**: Ensure Rust, Parquet, and Clickhouse types are compatible
2. **Missing Fields**: Verify all fields are properly extracted from transaction data
3. **Import Failures**: Check if insert queries match the structure of your parquet file
4. **Query Performance**: Add appropriate indexes for optimizing query performance

## Conclusion

Adding a new collection to the 0L Explorer involves coordinating changes across the transformer, Clickhouse database, and API layers. By following this guide, you can extend the explorer's capabilities to capture and analyze new types of blockchain data.

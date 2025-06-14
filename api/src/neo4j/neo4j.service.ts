import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: neo4j.Driver;
  private readonly logger = new Logger(Neo4jService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.driver = neo4j.driver(
        this.configService.get<string>('neo4j.url') || 'bolt://localhost:7687',
        neo4j.auth.basic(
          this.configService.get<string>('neo4j.username') || 'neo4j',
          this.configService.get<string>('neo4j.password') || 'password'
        ),
        {
          disableLosslessIntegers: true,
        }
      );

      await this.driver.verifyConnectivity();
      this.logger.log('Successfully connected to Neo4j');
    } catch (error) {
      this.logger.error(`Failed to connect to Neo4j: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      this.logger.log('Neo4j connection closed');
    }
  }

  /**
   * Get all first-degree connections of a wallet
   * @param address The wallet address to query
   * @returns All nodes and relationships connected to the given address
   */
  async getAllWalletFirstDegree(address: string) {
    const sanitizedAddress = address.startsWith('0x')
      ? address.substring(2).toUpperCase()
      : address.toUpperCase();

    const session = this.driver.session({
      database: this.configService.get<string>('neo4j.database'),
    });

    try {
      const result = await session.run(
        `
        MATCH (w1:Wallet {address: $address})-[r]->(w2:Wallet)
        RETURN w1, r, w2
        UNION
        MATCH (w1:Wallet)-[r]->(w2:Wallet {address: $address})
        RETURN w1, r, w2
        `,
        { address: sanitizedAddress }
      );

      // Get all versions that need timestamp conversion
      const versionsToConvert: number[] = [];
      result.records.forEach(record => {
        const relProps = record.get('r').properties;
        if (relProps.version && !relProps.timestamp) {
          const version = this.parseNeo4jValue(relProps.version);
          if (typeof version === 'number') {
            versionsToConvert.push(version);
          }
        }
      });

      // Create a mapping of version to timestamp if we have versions to convert
      const versionToTimestampMap = new Map<number, number>();
      if (versionsToConvert.length > 0) {
        try {
          // Import the ClickhouseService to use its conversion method
          const { ClickhouseService } = await import('../clickhouse/clickhouse.service.js');
          const clickhouseService = new ClickhouseService(this.configService);

          // Process versions in chunks to avoid overwhelming the database
          const chunkSize = 100;
          for (let i = 0; i < versionsToConvert.length; i += chunkSize) {
            const chunk = versionsToConvert.slice(i, i + chunkSize);

            // Use the new method from ClickhouseService
            const chunkTimestampMap = await clickhouseService.convertVersionsToTimestamps(chunk);

            // Merge the results into our main map
            chunkTimestampMap.forEach((timestamp, version) => {
              versionToTimestampMap.set(version, timestamp);
            });
          }
        } catch (error) {
          this.logger.error('Error mapping versions to timestamps:', error);
        }
      }

      // Process the results
      const nodes = new Map();
      const relationships: Array<ReturnType<typeof this.processRelationshipSimplified>> = [];

      result.records.forEach(record => {
        const w1 = this.processNodeSimplified(record.get('w1'));
        const w2 = this.processNodeSimplified(record.get('w2'));

        // Process relationship with timestamp mapping
        const rel = this.processRelationshipSimplified(
          record.get('r'),
          versionToTimestampMap
        );

        // Add nodes to map to deduplicate
        nodes.set(w1.address, w1);
        nodes.set(w2.address, w2);

        // Add relationship
        relationships.push(rel);
      });

      return {
        nodes: Array.from(nodes.values()),
        relationships: relationships
      };
    } catch (error) {
      this.logger.error(`Error in getAllWalletFirstDegree: ${error.message}`, error.stack);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Process a Neo4j node into a simplified object with only necessary properties
   */
  private processNodeSimplified(node: neo4j.Node) {
    const properties = node.properties;

    // Calculate total inputs and outputs
    const v5_in = this.parseNeo4jValue(properties.v5_in) || 0;
    const v6_in = this.parseNeo4jValue(properties.v6_in) || 0;
    const v6_total_in = this.parseNeo4jValue(properties.v6_total_in) || 0;
    const v7_in = this.parseNeo4jValue(properties.v7_in) || 0;

    const v5_out = this.parseNeo4jValue(properties.v5_out) || 0;
    const v6_out = this.parseNeo4jValue(properties.v6_out) || 0;
    const v6_total_out = this.parseNeo4jValue(properties.v6_total_out) || 0;
    const v7_out = this.parseNeo4jValue(properties.v7_out) || 0;

    return {
      id: node.identity.toString(),
      address: properties.address,
      balance: this.parseNeo4jValue(properties.balance) || 0,
      locked: this.parseNeo4jValue(properties.locked) || 0,
      totalIn: v5_in + v6_in + v6_total_in + v7_in,
      totalOut: v5_out + v6_out + v6_total_out + v7_out,
    };
  }

  /**
   * Process a Neo4j relationship into a simplified object with only necessary properties
   * @param rel The Neo4j relationship to process
   * @param versionToTimestampMap Optional map to convert versions to timestamps
   * @returns A simplified relationship object
   */
  private processRelationshipSimplified(rel: neo4j.Relationship, versionToTimestampMap?: Map<number, number>) {
    const properties = this.parseNeo4jProperties(rel.properties);

    // Add timestamp if we have version but no timestamp
    if (properties.version && !properties.timestamp && versionToTimestampMap) {
      const version = properties.version;
      const timestamp = versionToTimestampMap.get(version);
      if (timestamp) {
        properties.timestamp = timestamp;
      }
    }

    return {
      type: rel.type,
      startNodeId: rel.start.toString(),
      endNodeId: rel.end.toString(),
      ...properties,
    };
  }

  /**
   * Parse Neo4j properties to handle special types like integers, dates, etc.
   */
  private parseNeo4jProperties(properties: any): any {
    const result = {};
    Object.keys(properties).forEach(key => {
      result[key] = this.parseNeo4jValue(properties[key]);
    });
    return result;
  }

  /**
   * Parse Neo4j values to handle special Neo4j types
   */
  private parseNeo4jValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle Neo4j integers
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }

    // Handle Neo4j dates
    if (neo4j.isDate(value)) {
      return new Date(value.toString());
    }

    // Handle Neo4j datetime
    if (neo4j.isDateTime(value)) {
      return new Date(value.toString());
    }

    // Handle Neo4j duration
    if (neo4j.isDuration(value)) {
      return {
        months: value.months.toNumber(),
        days: value.days.toNumber(),
        seconds: value.seconds.toNumber(),
        nanoseconds: value.nanoseconds.toNumber(),
      };
    }

    // Handle Neo4j point
    if (neo4j.isPoint(value)) {
      return {
        srid: value.srid.toNumber(),
        x: value.x,
        y: value.y,
        z: value.z,
      };
    }

    // Handle Neo4j path
    if (neo4j.isPath(value)) {
      return {
        start: this.parseNeo4jValue(value.start),
        end: this.parseNeo4jValue(value.end),
        segments: value.segments.map(segment => ({
          start: this.parseNeo4jValue(segment.start),
          relationship: this.parseNeo4jValue(segment.relationship),
          end: this.parseNeo4jValue(segment.end),
        })),
      };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.parseNeo4jValue(item));
    }

    // Handle plain objects
    if (typeof value === 'object') {
      const result = {};
      Object.keys(value).forEach(key => {
        result[key] = this.parseNeo4jValue(value[key]);
      });
      return result;
    }

    // Return primitive values as-is
    return value;
  }
}

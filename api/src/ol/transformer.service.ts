import os from 'node:os';
import pathUtil from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import process from 'node:process';

import { Injectable, Logger } from '@nestjs/common';

// Define the valid transaction types accepted by the transformer
const VALID_TRANSACTION_TYPES = [
  'pending_transaction',
  'user_transaction',
  'genesis_transaction',
  'block_metadata_transaction',
  'state_checkpoint_transaction'
];

@Injectable()
export class TransformerService {
  private readonly logger = new Logger(TransformerService.name);

  /**
   * Check if a file contains node status data based on naming and content
   */
  private isNodeStatusFile(file: string, content: any): boolean {
    return file.includes('node_') ||
           (content.type === 'node_status') ||
           (content.ip !== undefined && content.timestamp !== undefined);
  }

  /**
   * Validates a JSON file and ensures it has a valid top-level type field
   */
  private async validateFile(file: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(file);
      // Check if file has content
      if (stats.size === 0) {
        this.logger.warn(`Warning: Empty file ${file}, skipping`);
        return false;
      }

      // For JSON files, check if they contain node status data
      if (file.endsWith('.json')) {
        const content = await fs.promises.readFile(file, 'utf-8');
        let parsed: any;

        try {
          parsed = JSON.parse(content);
        } catch (jsonError) {
          this.logger.error(`Error parsing JSON from ${file}: ${jsonError.message}`);
          return false;
        }

        // Check if we have an array - could be a batch of transactions
        if (Array.isArray(parsed)) {
          // For arrays, check each item
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];

            // Check if each array item has a valid type field
            if (!item.type || !VALID_TRANSACTION_TYPES.includes(item.type)) {
              this.logger.warn(`Item ${i} in array in file ${file} is missing a valid top-level "type" field`);
              this.logger.debug(`Item content: ${JSON.stringify(item, null, 2).substring(0, 200)}...`);

              // Determine best transaction type based on content structure
              let typeValue = this.determineTransactionType(item);

              // Add/update the type field
              item.type = typeValue;
              this.logger.log(`Added type "${typeValue}" to item ${i} in ${file}`);
            }
          }

          // Write the updated array back to the file
          await fs.promises.writeFile(file, JSON.stringify(parsed, null, 2));
          return true;
        } else {
          // For objects, check if it has a valid type field
          if (!parsed.type || !VALID_TRANSACTION_TYPES.includes(parsed.type)) {
            this.logger.warn(`File ${file} is missing a valid top-level "type" field`);
            this.logger.debug(`File content sample: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);

            // Determine best transaction type based on content
            let typeValue = this.determineTransactionType(parsed);

            // Add/update the type field
            parsed.type = typeValue;

            // Write the updated content back to the file
            await fs.promises.writeFile(file, JSON.stringify(parsed, null, 2));
            this.logger.log(`Updated ${file} with type: ${typeValue}`);
          }
          return true;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating file ${file}: ${error.message}`);
      return false;
    }
  }

  /**
   * Determine the appropriate transaction type based on the content structure
   */
  private determineTransactionType(content: any): string {
    // Default to user_transaction if we can't determine
    let typeValue = 'user_transaction';

    // Check for specific fields that indicate transaction types
    if (content.proposer && content.previous_block_votes_bitvec) {
      typeValue = 'block_metadata_transaction';
    } else if (content.state_checkpoint_hash !== undefined) {
      typeValue = 'state_checkpoint_transaction';
    } else if (content.id && content.events && content.timestamp) {
      // This is a bit more generic, but could be a user transaction
      typeValue = 'user_transaction';
    } else if (content.version === "0" || content.version === 0) {
      // Genesis transactions typically have version 0
      typeValue = 'genesis_transaction';
    }

    return typeValue;
  }

  public async transform(txFiles: string[]): Promise<string> {
    const dest = await fs.promises.mkdtemp(pathUtil.join(os.tmpdir(), 'transfromer-'));
    // this.logger.debug(`Created temp directory for transformed files: ${dest}`);

    // Log input files for debugging
    // this.logger.debug(`Received ${txFiles.length} files for transformation`);

    // Filter out invalid or incompatible files
    const validFiles: string[] = [];
    for (const file of txFiles) {
      try {
        const isValid = await this.validateFile(file);
        if (isValid) {
          validFiles.push(file);
        }
      } catch (error) {
        this.logger.error(`Error validating file ${file}: ${error.message}`);
        // Skip this file on error
      }
    }

    // If no valid files remain, return the empty destination
    if (validFiles.length === 0) {
      this.logger.warn('No valid files to transform');
      return dest;
    }

    await new Promise<void>((resolve, reject) => {
      const bin =
        process.env.NODE_ENV === 'production'
          ? '/usr/local/bin/transformer'
          : pathUtil.join(process.cwd(), 'transformer/target/debug/transformer');

      // Add environment variable to get backtrace on panic
      const env = { ...process.env, RUST_BACKTRACE: '1' };

      const proc = spawn(bin, [...validFiles, dest], {
        stdio: 'pipe', // Capture output instead of inheriting
        env
      });

      // Capture stdout and stderr
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        this.logger.debug(`Transformer stdout: ${data.toString().trim()}`);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.warn(`Transformer stderr: ${data.toString().trim()}`);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // this.logger.log(`Transformation completed successfully to: ${dest}`);
          resolve();
        } else {
          this.logger.error(`Transformer failed with code ${code}:`);
          this.logger.error(`Stdout: ${stdout}`);
          this.logger.error(`Stderr: ${stderr}`);
          reject(new Error(`Transformer failed with code ${code}`));
        }
      });
    });

    return dest;
  }
}

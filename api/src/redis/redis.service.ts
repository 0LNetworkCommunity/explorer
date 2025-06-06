import { createClient, RedisClientOptions } from 'redis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ConnectionOptions } from 'bullmq';

const logger = new Logger('RedisService');

// Function to create Redis connection options for BullMQ
export function createRedisConnectionOptions(configService: ConfigService): ConnectionOptions {
  const host = configService.get('REDIS_HOST') || 'localhost';
  const port = parseInt(configService.get('REDIS_PORT') || '6379', 10);

  logger.log(`Creating Redis connection options for ${host}:${port}`);

  return {
    host,
    port,
    // BullMQ specific settings for reliability
    enableReadyCheck: true,
    retryStrategy: (times) => {
      // conservative retry strategy
      const delay = Math.min(Math.pow(2, times) * 500, 30000); // Start with shorter delays
      if (times > 50) {
        logger.warn(`Redis retry attempts exceeding 50, consider checking server status`);
      }
      logger.log(`Redis retry in ${delay}ms (attempt ${times})`);
      return delay;
    }
  };
}

// A wrapper with safe methods for direct Redis operations
export class SafeRedisClient {
  private client: any; // Using any to avoid type issues
  private readonly logger = new Logger('SafeRedisClient');
  private connected = false;
  private connecting = false;
  private readonly maxRetries = 3;
  private readonly operationTimeout = 5000; // 5 seconds timeout for operations

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('REDIS_HOST') || 'localhost';
    const port = parseInt(this.configService.get('REDIS_PORT') || '6379', 10);
    const password = this.configService.get('REDIS_PASSWORD'); // Get password from env if set

    this.logger.log(`Initializing Redis client for ${host}:${port}`);

    const options: RedisClientOptions = {
      socket: {
        host,
        port,
        connectTimeout: 10000, // 10 seconds connect timeout
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            // After 10 retries, slow down significantly
            const delay = Math.min(5000 + (retries - 10) * 1000, 30000);
            this.logger.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          }
          const delay = Math.min(retries * 500, 5000);
          this.logger.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
      disableOfflineQueue: false, // Keep offline queue enabled
    };

    // Add password if configured
    if (password) {
      options.password = password;
      this.logger.log('Using password authentication for Redis');
    } else {
      this.logger.warn('No Redis password set, using non-authenticated connection');
    }

    this.initClient(options);
  }

  private initClient(options: RedisClientOptions) {
    try {
      this.client = createClient(options);
      this.setupEventHandlers();
      this.connectWithRetry();
    } catch (error) {
      this.logger.error(`Redis client initialization error: ${error.message}`);
    }
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
      this.connected = true;
      this.connecting = false;
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (err: Error) => {
      // Only log detailed errors for non-connection issues
      if (!err.message.includes('ECONNREFUSED')) {
        this.logger.error(`Redis client error: ${err.message}`);
      }
      this.connected = false;
    });

    this.client.on('reconnecting', () => {
      if (!this.connecting) {
        this.logger.warn('Redis client reconnecting');
        this.connecting = true;
      }
    });

    this.client.on('end', () => {
      this.logger.warn('Redis client connection closed');
      this.connected = false;
      this.connecting = false;
    });
  }

  private async connectWithRetry(attempt = 0) {
    if (attempt >= 3) {
      this.logger.warn('Max Redis connection attempts reached, will try again on next operation');
      return;
    }

    try {
      this.connecting = true;
      await this.client.connect();
    } catch (error) {
      this.connecting = false;
      this.connected = false;

      // Avoid logging too many connection refused errors
      if (!error.message.includes('ECONNREFUSED') || attempt === 0) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
      }

      // Schedule a retry with exponential backoff
      const delay = Math.min(Math.pow(2, attempt) * 1000, 10000);
      setTimeout(() => this.connectWithRetry(attempt + 1), delay);
    }
  }

  // Safely execute a Redis operation with timeout and fallback
  private async executeWithFallback<T>(operation: () => Promise<T>, defaultValue: T): Promise<T> {
    if (!this.connected && !this.connecting) {
      try {
        await this.connectWithRetry();
      } catch (error) {
        // Already logged in connectWithRetry
        return defaultValue;
      }
    }

    try {
      // Add a timeout to the operation
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('Redis operation timeout')), this.operationTimeout);
        })
      ]);
      return result;
    } catch (error) {
      // Only log errors that aren't connection refused
      if (!error.message.includes('ECONNREFUSED') && !error.message.includes('timeout')) {
        this.logger.error(`Redis operation error: ${error.message}`);
      }
      return defaultValue;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.executeWithFallback(async () => {
      if (!this.client.isOpen) {
        await this.connectWithRetry();
      }
      return await this.client.get(key);
    }, null);
  }

  async set(key: string, value: string, options: any = {}): Promise<void> {
    await this.executeWithFallback(async () => {
      if (!this.client.isOpen) {
        await this.connectWithRetry();
      }
      await this.client.set(key, value, options);
      return true;
    }, false);
  }

  async del(key: string): Promise<void> {
    await this.executeWithFallback(async () => {
      if (!this.client.isOpen) {
        await this.connectWithRetry();
      }
      await this.client.del(key);
      return true;
    }, false);
  }

  get isConnected(): boolean {
    return this.connected && (this.client?.isOpen || false);
  }

  async ping(): Promise<boolean> {
    return this.executeWithFallback(async () => {
      if (!this.client.isOpen) {
        await this.connectWithRetry();
      }
      const response = await this.client.ping();
      return response === 'PONG';
    }, false);
  }
}

// Create a Singleton instance
export const redisClient = new SafeRedisClient(new ConfigService());

// Export connection options for BullMQ - this should be used in all queue registrations
export const redisConnectionOptions = createRedisConnectionOptions(new ConfigService());

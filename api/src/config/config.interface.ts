export interface Config {
  port: number;
  cacheEnabled: boolean;
  dataApiHost: string;

  info: InfoConfig;
  ol: OlConfig;
  s3: S3Config;
  clickhouse: ClickhouseConfig;
  apn?: ApnConfig;
  firebase?: FirebaseConfig;
  nats: NatsConfig;
}

export interface InfoConfig {
  build?: string;
}

export interface OlConfig {
  provider: string;
  dataApiHost: string;
}

export interface S3Config {
  region: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  port: number;
  useSSL: boolean;
  bucket: string;
  storageClass: string;
}

export interface ClickhouseConfig {
  username: string;
  password: string;
  host: string;
  port: number;
  httpPort: number;
  database: string;
}

export interface ApnConfig {
  privateKey: Buffer;
  keyId: string;
  teamId: string;
}

export interface FirebaseConfig {
  serviceAccount: string;
}

export interface NatsConfig {
  servers: string;
}
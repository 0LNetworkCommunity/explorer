export interface Config {
  info: InfoConfig;
  ol: OlConfig;
  s3: S3Config;
  clickhouse: ClickhouseConfig;
}

export interface InfoConfig {
  build?: string;
}

export interface OlConfig {
  provider: string;
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
  httpHost: string;
  httpUsername?: string;
  httpPassword?: string;
  host: string;
  port: number;
  database: string;
}

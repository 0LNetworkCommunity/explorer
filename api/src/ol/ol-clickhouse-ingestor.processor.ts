import pathUtil from "node:path";
import fs from "node:fs";
import { execFile as execFileNative } from "node:child_process";
import util from "node:util";
import { Readable } from "node:stream";

import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import _ from "lodash";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { S3Service } from "../s3/s3.service.js";
import { cleanUp, createTmpDir } from "../utils.js";
import { ClickhouseService } from "../clickhouse/clickhouse.service.js";

const execFile = util.promisify(execFileNative);

@Processor("ol-clickhouse-ingestor")
export class OlClickhouseIngestorProcessor
  extends WorkerHost
  implements OnModuleInit
{
  public constructor(
    @InjectQueue("ol-clickhouse-ingestor")
    private readonly olClickhouseIngestor: Queue,

    private readonly s3Service: S3Service,

    private readonly clickhouseService: ClickhouseService,
  ) {
    super();
  }

  private async download(file: string): Promise<string> {
    const tmpDir = await createTmpDir();

    const dest = pathUtil.join(tmpDir, file);
    const archiveDir = pathUtil.dirname(dest);

    await fs.promises.mkdir(archiveDir, { recursive: true });

    const res = await this.s3Service.download(`parquets/${file}`);

    return new Promise<string>((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      file.on("close", () => {
        resolve(dest);
      });

      file.on("error", (err) => {
        console.error(err);
        reject(err);
      });

      (res.Body as Readable).pipe(file);
    });
  }

  public async onModuleInit() {
    await this.olClickhouseIngestor.add("getMissingFiles", undefined, {
      repeat: {
        every: 30 * 60 * 1_000, // 30 minutes
      },
    });
  }

  public async process(job: Job<any, any, string>) {
    switch (job.name) {
      case "getMissingFiles":
        await this.getMissingFiles();
        break;

      case "ingest":
        await this.ingest(job.data.file);
        break;

      default:
        throw new Error(`invalid job name ${job.name}`);
    }
  }

  private async getIngestedFiles(): Promise<string[]> {
    const resultSet = await this.clickhouseService.client.query({
      query: 'SELECT * FROM "ingested_files"',
      format: "JSONEachRow",
    });
    const dataset = await resultSet.json<{ name: string }[]>();
    return _.uniq(dataset.map((it) => it.name));
  }

  private async getMissingFiles() {
    const ingestedFile = await this.getIngestedFiles();
    const parquetFiles = await this.s3Service.listFiles("parquets/");

    const missingFiles = _.difference(parquetFiles, ingestedFile);

    await this.olClickhouseIngestor.addBulk(
      missingFiles.map((file) => ({
        name: "ingest",
        data: {
          file,
        },
        opts: {
          jobId: `__ingest__${file}`,
        },
      })),
    );
  }

  private async ingest(file: string) {
    const fileComponents = file.split("/");
    let parquetFileName = fileComponents[fileComponents.length - 1];
    parquetFileName = parquetFileName.substring(
      0,
      parquetFileName.length - ".tar.gz".length,
    );

    const archivePath = await this.download(file);

    await this.untar(archivePath);

    const archiveDir = pathUtil.dirname(archivePath);
    const files = await fs.promises.readdir(archiveDir);

    for (const file of files) {
      if (file.endsWith(".parquet")) {
        await this.clickhouseService.insertParquetFile(
          pathUtil.join(archiveDir, file),
        )
      }
    }

    await this.clickhouseService.client.insert({
      table: "ingested_files",
      values: [{ name: file }],
      format: "JSONEachRow",
    });

    await cleanUp(archiveDir);
  }

  private async untar(filepath: string) {
    const filename = pathUtil.basename(filepath);
    const dirnname = pathUtil.dirname(filepath);

    await execFile("tar", ["xf", filename], { cwd: dirnname });
  }
}

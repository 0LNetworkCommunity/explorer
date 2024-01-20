import process, { stdout } from "node:process";
import os from "node:os";
import fs from "node:fs";
import pathUtil from "node:path";
import { spawn, exec } from "node:child_process";
import { URL } from "node:url";

import axios, { AxiosError } from "axios";
import qs from "qs";
import _ from "lodash";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Readable, pipeline } from "node:stream";

@Processor("transformer")
export class TransformerProcessor extends WorkerHost {
  public constructor(
    @InjectQueue("transformer")
    private readonly transformerQueue: Queue,
  ) {
    super();
  }

  public async process(job: Job<any, any, string>) {
    const txFiles = [
      "./0-9900/0-99.json",
      "./0-9900/100-199.json",
      "./0-9900/1000-1099.json",
      "./0-9900/1100-1199.json",
      "./0-9900/1200-1299.json",
      "./0-9900/1300-1399.json",
      "./0-9900/1400-1499.json",
      "./0-9900/1500-1599.json",
      "./0-9900/1600-1699.json",
      "./0-9900/1700-1799.json",
      "./0-9900/1800-1899.json",
      "./0-9900/1900-1999.json",
      "./0-9900/200-299.json",
      "./0-9900/2000-2099.json",
      "./0-9900/2100-2199.json",
      "./0-9900/2200-2299.json",
      "./0-9900/2300-2399.json",
      "./0-9900/2400-2499.json",
      "./0-9900/2500-2599.json",
      "./0-9900/2600-2699.json",
      "./0-9900/2700-2799.json",
      "./0-9900/2800-2899.json",
      "./0-9900/2900-2999.json",
      "./0-9900/300-399.json",
      "./0-9900/3000-3099.json",
      "./0-9900/3100-3199.json",
      "./0-9900/3200-3299.json",
      "./0-9900/3300-3399.json",
      "./0-9900/3400-3499.json",
      "./0-9900/3500-3599.json",
      "./0-9900/3600-3699.json",
      "./0-9900/3700-3799.json",
      "./0-9900/3800-3899.json",
      "./0-9900/3900-3999.json",
      "./0-9900/400-499.json",
      "./0-9900/4000-4099.json",
      "./0-9900/4100-4199.json",
      "./0-9900/4200-4299.json",
      "./0-9900/4300-4399.json",
      "./0-9900/4400-4499.json",
      "./0-9900/4500-4599.json",
      "./0-9900/4600-4699.json",
      "./0-9900/4700-4799.json",
      "./0-9900/4800-4899.json",
      "./0-9900/4900-4999.json",
      "./0-9900/500-599.json",
      "./0-9900/5000-5099.json",
      "./0-9900/5100-5199.json",
      "./0-9900/5200-5299.json",
      "./0-9900/5300-5399.json",
      "./0-9900/5400-5499.json",
      "./0-9900/5500-5599.json",
      "./0-9900/5600-5699.json",
      "./0-9900/5700-5799.json",
      "./0-9900/5800-5899.json",
      "./0-9900/5900-5999.json",
      "./0-9900/600-699.json",
      "./0-9900/6000-6099.json",
      "./0-9900/6100-6199.json",
      "./0-9900/6200-6299.json",
      "./0-9900/6300-6399.json",
      "./0-9900/6400-6499.json",
      "./0-9900/6500-6599.json",
      "./0-9900/6600-6699.json",
      "./0-9900/6700-6799.json",
      "./0-9900/6800-6899.json",
      "./0-9900/6900-6999.json",
      "./0-9900/700-799.json",
      "./0-9900/7000-7099.json",
      "./0-9900/7100-7199.json",
      "./0-9900/7200-7299.json",
      "./0-9900/7300-7399.json",
      "./0-9900/7400-7499.json",
      "./0-9900/7500-7599.json",
      "./0-9900/7600-7699.json",
      "./0-9900/7700-7799.json",
      "./0-9900/7800-7899.json",
      "./0-9900/7900-7999.json",
      "./0-9900/800-899.json",
      "./0-9900/8000-8099.json",
      "./0-9900/8100-8199.json",
      "./0-9900/8200-8299.json",
      "./0-9900/8300-8399.json",
      "./0-9900/8400-8499.json",
      "./0-9900/8500-8599.json",
      "./0-9900/8600-8699.json",
      "./0-9900/8700-8799.json",
      "./0-9900/8800-8899.json",
      "./0-9900/8900-8999.json",
      "./0-9900/900-999.json",
      "./0-9900/9000-9099.json",
      "./0-9900/9100-9199.json",
      "./0-9900/9200-9299.json",
      "./0-9900/9300-9399.json",
      "./0-9900/9400-9499.json",
      "./0-9900/9500-9599.json",
      "./0-9900/9600-9699.json",
      "./0-9900/9700-9799.json",
      "./0-9900/9800-9899.json",
      "./0-9900/9900-9999.json",
    ];

    const dest = "/Users/will/Developer/github.com/0lfyi/api/transformer/out2";

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("cargo", ["run", "--", ...txFiles, dest], {
        cwd: "/Users/will/Developer/github.com/0lfyi/api/transformer",
      });

      proc.stdout.on("data", (data: Buffer) => {
        job.log(data.toString("utf-8"));
      });
      proc.stderr.on("data", (data: Buffer) => {
        job.log(data.toString("utf-8"));
      });

      proc.stderr.pipe(process.stderr, { end: false });
      proc.stderr.pipe(process.stdout, { end: false });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`code = ${code}`));
        }
      });
    });

    const dirname = pathUtil.dirname(new URL(import.meta.url).pathname);
    const queriesDir = pathUtil.join(dirname, "queries");

    const files = await fs.promises.readdir(dest);
    for (const file of files) {
      const queryName = file.split(".")[0];
      
      const clickhouseClient = os.platform() === "darwin" ? "clickhouse client" : "clickhouse-client";

      await new Promise<void>((resolve, reject) => {
        exec(
          [
            `cat ${pathUtil.join(dest, file)} | `,
            clickhouseClient,
            '-h "127.0.0.1"',
            "--port 9000",
            '-u "default"',
            "-d olfyi",
            `--query="$(cat ${queriesDir}/${queryName}.sql)"`,
          ].join(" "),
          (error, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);

            if (error) {
              reject(error);
            } else {
              resolve();
            }
          },
        );
      });

      // try {
      //   await axios({
      //     method: "POST",
      //     url: `http://127.0.0.1:8123/?${qs.stringify({
      //       query: this.insertQueries.get("event")!,
      //       database: "olfyi",
      //     })}`,
      //     maxRedirects: 0,
      //     data: fs.createReadStream(pathUtil.join(dest, file)),
      //   });
      // } catch (error) {
      //   if (error.isAxiosError) {
      //     console.log(file);

      //     const axiosError = error as AxiosError;
      //     console.error(axiosError.response?.status);
      //     console.error(axiosError.response?.data);

      //   }
      // }
    }
  }
}

import os from "node:os";
import pathUtil from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";
// import process from 'node:process';

import { Injectable } from "@nestjs/common";

@Injectable()
export class TransformerService {
  public async transform(txFiles: string[]): Promise<string> {
    const dest = await fs.promises.mkdtemp(
      pathUtil.join(os.tmpdir(), "transfromer-"),
    );

    await new Promise<void>((resolve, reject) => {
      // const BIN = pathUtil.join(process.cwd(), 'transformer/target/debug/transformer');
      const BIN = "/usr/local/bin/transformer";

      const proc = spawn(BIN, [...txFiles, dest], {
        stdio: "inherit",
      });

      // proc.stderr.pipe(process.stderr, { end: false });
      // proc.stdout.pipe(process.stdout, { end: false });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`code = ${code}`));
        }
      });
    });

    return dest;
  }
}

import os from "node:os";
import pathUtil from 'node:path';
import fs from 'node:fs';
import { spawn } from "node:child_process";

import { Injectable, } from "@nestjs/common";

@Injectable()
export class TransformerService {
  public async transform(txFiles: string[]): Promise<string> {
    const dest = await fs.promises.mkdtemp(pathUtil.join(os.tmpdir(), 'transfromer-'));

    console.log('TRANSFORM', txFiles);

    await new Promise<void>((resolve, reject) => {
      try {
        const proc = spawn("cargo", ["run", "--", ...txFiles, dest], {
          cwd: "/Users/will/Developer/github.com/0lfyi/api/transformer",
          stdio: 'inherit',
        });

        // proc.stderr.pipe(process.stderr, { end: false });
        // proc.stderr.pipe(process.stdout, { end: false });

        proc.on("error", (error) => {
          console.log('event', error);
        });

        proc.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`code = ${code}`));
          }
        });
      } catch (error) {
        console.log("ex", error);
        throw error;
      }
    });

    return dest;
  }
}

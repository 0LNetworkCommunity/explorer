import { rm } from "node:fs/promises";
import os from "node:os";
import pathUtil from 'node:path';
import fs from 'node:fs';

export const cleanUp = async (...files: string[]) => {
  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};

export const createTmpDir = async (): Promise<string> => {
  return await fs.promises.mkdtemp(pathUtil.join(os.tmpdir(), "explorer-api-"));
};
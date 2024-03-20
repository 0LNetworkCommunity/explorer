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

export const parseAddress = (address: string): Buffer => {
  let addr = address;

  // strip 0x prefix
  if (
    addr.length >= 2 &&
    addr[0] === "0" &&
    (addr[1] === "x" || addr[1] === "X")
  ) {
    addr = addr.substring(2);
  }

  if (addr.length > 64) {
    throw new Error("Invalid address length");
  }

  if (addr.length <= 32) {
    addr = addr.padStart(32, "0");
  } else if (addr.length < 64) {
    addr = addr.padStart(64, "0");
  }

  return Buffer.from(addr, "hex");
};

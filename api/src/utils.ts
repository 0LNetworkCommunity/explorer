import { rm } from "node:fs/promises";

export const cleanUp = async (...files: string[]) => {
  for (const file of files) {
    await rm(file, { recursive: true, force: true });
  }
};

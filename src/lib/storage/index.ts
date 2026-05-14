import type { StorageDriver } from "./types";
import { LocalDriver } from "./local";
import { S3Driver } from "./s3";

export type { StorageDriver };

// Singleton — instancié à la demande, persisté entre requêtes
declare global {
  // eslint-disable-next-line no-var
  var __storageDriver: StorageDriver | undefined;
}

export function storage(): StorageDriver {
  if (globalThis.__storageDriver) return globalThis.__storageDriver;
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  globalThis.__storageDriver = driver === "s3" ? new S3Driver() : new LocalDriver();
  return globalThis.__storageDriver;
}

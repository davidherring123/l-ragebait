import { vi } from 'vitest';

type StoredValues = Record<string, unknown>;

export class MemoryStorageArea {
  public values: StoredValues = {};

  public async get(key: string): Promise<StoredValues> {
    await Promise.resolve();
    return { [key]: this.values[key] };
  }

  public async set(values: StoredValues): Promise<void> {
    await Promise.resolve();
    Object.assign(this.values, values);
  }

  public async remove(key: string): Promise<void> {
    await Promise.resolve();
    Reflect.deleteProperty(this.values, key);
  }
}

export function installBrowserStorage(): Readonly<{
  local: MemoryStorageArea;
  session: MemoryStorageArea;
}> {
  const local = new MemoryStorageArea();
  const session = new MemoryStorageArea();
  Object.assign(local, {
    setAccessLevel: async (): Promise<void> => Promise.resolve(),
  });
  vi.stubGlobal('browser', { storage: { local, session } });
  return { local, session };
}

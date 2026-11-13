/**
 * The one door to the browser's storage. Settings, the belt and the saves read
 * and write through `appStorage`, never `localStorage` itself, so a test hands
 * the module an in-memory storage and nothing survives between tests on any
 * machine. Failures (storage full, blocked, or missing) are thrown exactly as
 * `localStorage` throws them; each caller keeps its own fallback.
 */

/** The part of the Web Storage interface the game uses. */
export interface AppStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

let active: AppStorage | null = null

/** The storage in use: the one handed over, else the browser's own. */
function current(): AppStorage {
  return active ?? globalThis.localStorage
}

/** Storage the game reads and writes through; delegates to the current one. */
export const appStorage: AppStorage = {
  getItem: (key: string): string | null => current().getItem(key),
  setItem: (key: string, value: string): void => current().setItem(key, value),
  removeItem: (key: string): void => current().removeItem(key),
}

/** Use `storage` from now on; `null` goes back to the browser's localStorage. */
export function setAppStorage(storage: AppStorage | null): void {
  active = storage
}

/** A fresh storage held in memory, for tests. */
export function createMemoryStorage(): AppStorage {
  const items: Record<string, string> = {}
  return {
    getItem: (key: string): string | null =>
      Object.prototype.hasOwnProperty.call(items, key) ? items[key] : null,
    setItem: (key: string, value: string): void => {
      items[key] = String(value)
    },
    removeItem: (key: string): void => {
      delete items[key]
    },
  }
}

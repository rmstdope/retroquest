import { afterEach, describe, expect, it } from 'vitest'
import { appStorage, createMemoryStorage, setAppStorage } from './appStorage'

describe('appStorage', () => {
  afterEach(() => setAppStorage(null))

  it('reads and writes the storage handed to it', () => {
    const memory = createMemoryStorage()
    setAppStorage(memory)
    appStorage.setItem('k', 'v')
    expect(memory.getItem('k')).toBe('v')
    expect(appStorage.getItem('k')).toBe('v')
    appStorage.removeItem('k')
    expect(appStorage.getItem('k')).toBeNull()
  })

  it('keeps two memory storages apart', () => {
    const first = createMemoryStorage()
    first.setItem('k', 'v')
    expect(createMemoryStorage().getItem('k')).toBeNull()
  })

  it('falls back to the global localStorage when none is handed over', () => {
    const global = createMemoryStorage()
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      value: global,
      configurable: true,
    })
    try {
      setAppStorage(null)
      appStorage.setItem('k', 'v')
      expect(global.getItem('k')).toBe('v')
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original)
      else delete (globalThis as { localStorage?: unknown }).localStorage
    }
  })
})

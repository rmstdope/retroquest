import { setAppStorage } from '@/storage/appStorage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { BELT_STORAGE_KEY, useBeltStore } from './useBeltStore'
import type { Hand } from '@/lantern/belt'

const bread: Hand = {
  kind: 'item',
  name: 'bread',
  label: 'Bread',
  verb: 'usewith',
}

/** An in-memory localStorage stand-in for the node test environment. */
function installStorage(initial: Record<string, string> = {}): {
  store: Record<string, string>
} {
  const store = { ...initial }
  setAppStorage({
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  })
  return { store }
}

describe('useBeltStore', () => {
  let store: Record<string, string>
  beforeEach(() => {
    ;({ store } = installStorage())
    setActivePinia(createPinia())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('starts with the belt up on the Bag and nothing in hand', () => {
    const belt = useBeltStore()
    expect(belt.away).toBe(false)
    expect(belt.list).toBe('bag')
    expect(belt.hand).toBeNull()
  })

  it('remembers the list and whether it is put away on this device', async () => {
    const belt = useBeltStore()
    belt.show('spells')
    belt.putAway()
    await Promise.resolve()
    expect(JSON.parse(store[BELT_STORAGE_KEY] ?? '{}')).toEqual({
      away: true,
      list: 'spells',
    })
    setActivePinia(createPinia())
    const again = useBeltStore()
    expect(again.away).toBe(true)
    expect(again.list).toBe('spells')
  })

  it('brings the belt back on the list of the button pressed', () => {
    const belt = useBeltStore()
    belt.putAway()
    belt.bringBack('spells')
    expect(belt.away).toBe(false)
    expect(belt.list).toBe('spells')
  })

  it('falls back to the defaults for stored values that make no sense', () => {
    installStorage({ [BELT_STORAGE_KEY]: '{"away":"yes","list":7}' })
    const belt = useBeltStore()
    expect(belt.away).toBe(false)
    expect(belt.list).toBe('bag')
  })

  it('survives corrupt or unavailable storage', () => {
    installStorage({ [BELT_STORAGE_KEY]: '{nope' })
    expect(useBeltStore().list).toBe('bag')
    setAppStorage({
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    setActivePinia(createPinia())
    const belt = useBeltStore()
    expect(() => belt.putAway()).not.toThrow()
    expect(belt.away).toBe(true)
  })

  it('takes a thing in hand and empties the hand, never saving it', async () => {
    const belt = useBeltStore()
    belt.takeInHand(bread)
    await Promise.resolve()
    expect(belt.hand).toEqual(bread)
    expect(store[BELT_STORAGE_KEY] ?? '').not.toContain('bread')
    belt.emptyHand()
    expect(belt.hand).toBeNull()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Item, Room } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from './useGameStore'

/** A one-room act holding a coin to carry. */
class HallAct extends Act {
  constructor() {
    super({
      name: 'Hall Act',
      rooms: {
        Hall: new Room({
          name: 'Hall',
          description: 'A quiet hall.',
          items: [
            new Item({
              name: 'Coin',
              description: 'A coin.',
              canBeCarried: true,
            }),
          ],
        }),
      },
      quests: [],
      classes: {},
      musicFile: 'hall.mp3',
      musicInfo: 'Hall',
    })
  }
}

/** A game store started on the hall. */
async function startedStore(): Promise<ReturnType<typeof useGameStore>> {
  const bridge = useBridge(async (): Promise<ActClass[]> => [HallAct])
  const store = useGameStore()
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  return store
}

describe('useGameStore: the typed map and inventory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('asks for the map without writing a turn', async () => {
    const store = await startedStore()
    const before = store.turns.length
    store.submitCommand('map')
    expect(store.turns.length).toBe(before)
    expect(store.lookRequest?.kind).toBe('map')
    const first = store.lookRequest!.id
    store.submitCommand(' MAP ')
    expect(store.lookRequest!.id).toBeGreaterThan(first)
  })

  it.each(['inventory', 'i', 'inv'])(
    'asks for the bag, writing no turn, for %s with things in it',
    async (word) => {
      const store = await startedStore()
      store.submitCommand('take coin')
      const before = store.turns.length
      store.submitCommand(word)
      expect(store.turns.length).toBe(before)
      expect(store.lookRequest?.kind).toBe('bag')
    },
  )

  it('answers an empty bag as an ordinary turn, with no request', async () => {
    const store = await startedStore()
    store.submitCommand('inventory')
    expect(store.lookRequest).toBeNull()
    expect(store.turns.at(-1)?.text).toBe('Your bag is empty.')
  })

  it('leaves a word with more words after it to the game', async () => {
    const store = await startedStore()
    store.submitCommand('map foo')
    expect(store.lookRequest).toBeNull()
    expect(store.turns.at(-1)?.command).toBe('map foo')
  })
})

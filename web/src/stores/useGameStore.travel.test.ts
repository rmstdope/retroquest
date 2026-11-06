import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Room, type GameState } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from './useGameStore'

/** Whether the yard's gate is shut (set by the test that needs it). */
let gateShut = false

/** A yard whose way east is shut while `gateShut`, as a gate would be. */
class Yard extends Room {
  /** Refuses the way east while the gate is shut, as walking would. */
  override walk(_gameState: GameState, direction: string): string | null {
    return gateShut && direction === 'east'
      ? '[failure]The gate is shut.[/failure]'
      : null
  }
}

/** Hall – Yard – Road – Pier in a row, with a Cellar below the Hall. */
class RowAct extends Act {
  constructor() {
    super({
      name: 'Row Act',
      rooms: {
        Hall: new Room({
          name: 'Hall',
          description: 'A hall.',
          exits: { east: 'Yard', down: 'Cellar' },
        }),
        Yard: new Yard({
          name: 'Yard',
          description: 'A yard.',
          exits: { west: 'Hall', east: 'Road' },
        }),
        Road: new Room({
          name: 'Road',
          description: 'A road.',
          exits: { west: 'Yard', east: 'Pier' },
        }),
        Pier: new Room({
          name: 'Pier',
          description: 'A pier.',
          exits: { west: 'Road' },
        }),
        Cellar: new Room({ name: 'Cellar', description: 'A cellar.' }),
      },
      quests: [],
      classes: { Yard },
      musicFile: 'row.mp3',
      musicInfo: 'Row',
    })
  }
}

async function startedStore(): Promise<ReturnType<typeof useGameStore>> {
  const bridge = useBridge(async (): Promise<ActClass[]> => [RowAct])
  const store = useGameStore()
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  return store
}

/** The commands the story shows, oldest first. */
function commands(store: ReturnType<typeof useGameStore>): string[] {
  return store.turns.flatMap((turn) =>
    turn.command === null ? [] : [turn.command],
  )
}

describe('useGameStore travelTo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    gateShut = false
    vi.stubGlobal('localStorage', {
      getItem: (): string | null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('knows the visited places and those seen from them', async () => {
    const store = await startedStore()
    expect(store.mapPlaces.map((p) => [p.key, p.visited])).toEqual([
      ['Hall', true],
      ['Yard', false],
      ['Cellar', false],
    ])
  })

  it('walks a visited place step by step, one turn per step', async () => {
    const store = await startedStore()
    for (const c of ['go east', 'go east', 'go east']) store.submitCommand(c)
    store.submitCommand('go west')
    store.submitCommand('go west')
    store.submitCommand('go west')
    const before = commands(store).length
    store.travelTo('Pier')
    expect(commands(store).slice(before)).toEqual([
      'go east',
      'go east',
      'go east',
    ])
    expect(store.roomName).toBe('Pier')
  })

  it('walks into a seen place with one step into the new one', async () => {
    const store = await startedStore()
    store.submitCommand('go east')
    const before = commands(store).length
    store.travelTo('Cellar')
    expect(commands(store).slice(before)).toEqual(['go west', 'go down'])
    expect(store.roomName).toBe('Cellar')
  })

  it('stops where walking would stop', async () => {
    const store = await startedStore()
    for (const c of ['go east', 'go east', 'go east']) store.submitCommand(c)
    for (const c of ['go west', 'go west', 'go west']) store.submitCommand(c)
    gateShut = true
    const before = commands(store).length
    store.travelTo('Pier')
    expect(commands(store).slice(before)).toEqual(['go east', 'go east'])
    expect(store.roomName).toBe('Yard')
  })

  it('does nothing for the place the player is in, an unknown place or a busy game', async () => {
    const store = await startedStore()
    const before = store.turns.length
    store.travelTo('Hall')
    store.travelTo('Nowhere')
    expect(store.turns.length).toBe(before)
  })
})

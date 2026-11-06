import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Quest, Room, type GameState } from '@/engine'
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

/** Whether the yard sets a quest going when entered. */
let yardQuest = false

/** A quest that starts when the player stands in the yard and `yardQuest` is set. */
class YardQuest extends Quest {
  constructor() {
    super({ name: 'Mind the Gate', description: 'Look at the gate.' })
  }

  /** Starts in the yard. */
  override checkTrigger(gameState: GameState): boolean {
    return yardQuest && gameState.currentRoom.name === 'Yard'
  }

  /** Never done. */
  override checkCompletion(): boolean {
    return false
  }
}

/** Whether a stranger is seen on the first walk into the road. */
let strangerComing = false

/** A road that plays a scene the first time it is entered while `strangerComing`. */
class Road extends Room {
  /** The sighting, once. */
  override enterText(_gameState: GameState): string {
    if (!strangerComing) return ''
    strangerComing = false
    yardQuest = false
    return 'A cloaked stranger watches you from the bend.'
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
        Road: new Road({
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
      quests: [new YardQuest()],
      classes: { Yard, Road, YardQuest },
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
    strangerComing = false
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

  it('stops at a scene that plays on entering a place', async () => {
    const store = await startedStore()
    for (const c of ['go east', 'go east', 'go east']) store.submitCommand(c)
    for (const c of ['go west', 'go west', 'go west']) store.submitCommand(c)
    strangerComing = true
    const before = commands(store).length
    store.travelTo('Pier')
    expect(commands(store).slice(before)).toEqual(['go east', 'go east'])
    expect(store.roomName).toBe('Road')
    expect(store.turns.at(-1)?.text).toContain('cloaked stranger')
  })

  it('stops where a quest begins on the way', async () => {
    const store = await startedStore()
    for (const c of ['go east', 'go east', 'go east']) store.submitCommand(c)
    for (const c of ['go west', 'go west', 'go west']) store.submitCommand(c)
    yardQuest = true
    const before = commands(store).length
    store.travelTo('Pier')
    expect(commands(store).slice(before)).toEqual(['go east'])
    expect(store.roomName).toBe('Yard')
  })

  it('does nothing while the game is busy', async () => {
    const store = await startedStore()
    store.submitCommand('go east')
    store.acceptInput = false
    const before = store.turns.length
    store.travelTo('Hall')
    expect(store.turns.length).toBe(before)
  })

  it('does nothing for the place the player is in or an unknown place', async () => {
    const store = await startedStore()
    const before = store.turns.length
    store.travelTo('Hall')
    store.travelTo('Nowhere')
    expect(store.turns.length).toBe(before)
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Item, Quest, Room, type GameState } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useGameStore } from './useGameStore'

/** The name of the item whose pick-up finishes the one-act test game. */
const CROWN = 'Crown'

/** The one quest of the crown act: done when the crown is carried. */
class CrownQuest extends Quest {
  constructor() {
    super({ name: 'Wear the Crown', description: 'Take the crown.' })
  }

  /** Active from the start. */
  override checkTrigger(): boolean {
    return true
  }

  /** Done when the crown is carried. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item.name === CROWN)
  }
}

/** A one-act game that ends the moment the player holds the crown. */
class CrownAct extends Act {
  constructor(
    name = 'Crown Act',
    quest: Quest = new CrownQuest(),
    classes: Record<string, typeof CrownQuest> = { CrownQuest },
  ) {
    super({
      name,
      rooms: {
        Hall: new Room({
          name: 'Hall',
          description: 'A quiet hall.',
          items: [
            new Item({
              name: CROWN,
              description: 'A heavy crown.',
              canBeCarried: true,
            }),
          ],
        }),
      },
      quests: [quest],
      classes,
      musicFile: 'finale.mp3',
      musicInfo: 'Finale',
    })
  }

  /** Complete when the crown is carried. */
  override isCompleted(gameState: GameState): boolean {
    return gameState.inventory.some((item) => item.name === CROWN)
  }
}

/** The quest of the second crown act (each act registers its own classes). */
class SecondCrownQuest extends CrownQuest {}

/** A second crown act, so a game can lead on from the first. */
class SecondCrownAct extends CrownAct {
  constructor() {
    super('Second Crown Act', new SecondCrownQuest(), { SecondCrownQuest })
  }
}

/** The game store under test. */
type Store = ReturnType<typeof useGameStore>

/** The store over the real engine, playing the crown act (or `acts`). */
async function startedStore(
  acts: ActClass[] = [CrownAct],
): Promise<ReturnType<typeof useGameStore>> {
  const bridge = useBridge(async (): Promise<ActClass[]> => acts)
  const store = useGameStore()
  store.setBridge(bridge)
  await store.initGame()
  store.dismissModal()
  return store
}

describe('useGameStore over the real engine: game over', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Saves need the browser's storage: an empty one in memory.
    const stored: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string): string | null => stored[key] ?? null,
      setItem: (key: string, value: string): void => {
        stored[key] = value
      },
      removeItem: (key: string): void => {
        delete stored[key]
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not end the game before the last act is complete', async () => {
    const store = await startedStore()
    store.submitCommand('look')
    expect(store.showModal).toBe(false)
    expect(store.modalChapter).toBe(null)
  })

  it('closes the final act with the engine’s own closing text and stats', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    expect(store.showModal).toBe(true)
    expect(store.modalChapter).toMatchObject({
      kind: 'complete',
      final: true,
      body: expect.stringContaining(
        'Congratulations — you have completed Act 1, the final act of RetroQuest!',
      ),
      stats: { questsCompleted: 1, questsTotal: 1, spells: 0, places: 1 },
    })
  })

  it('asks to save on the final page, then ends with the engine’s last answer', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    store.continueChapter()
    expect(store.finishAsked).toBe(true)
    store.cancelFinish()
    expect(store.finishAsked).toBe(false)
    store.continueChapter()
    expect(store.finishGame(false)).toBe(true)
    expect(store.ending).toEqual({
      text: 'This might come in handy, so you decide to pick it up.',
      saved: false,
    })
  })

  it('records the last quest in the story and shows the final page', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    expect(store.turns.at(-1)?.quests?.at(-1)?.kind).toBe('completed')
    expect(store.modalChapter).toMatchObject({ kind: 'complete', final: true })
  })

  it('leads on from a non-last act, never to the save dialog or the end', async () => {
    const store = await startedStore([CrownAct, SecondCrownAct])
    store.submitCommand(`take ${CROWN}`)
    expect(store.modalChapter?.final).toBeFalsy()
    store.continueChapter()
    expect(store.finishAsked).toBe(false)
    expect(store.ending).toBe(null)
  })

  it('plays on from a load made while the act-complete page waits for narration', async () => {
    const store = await startedStore([CrownAct, SecondCrownAct])
    store.setActEndGate(() => true)
    expect(store.saveGame()).toBe(true)
    store.submitCommand(`take ${CROWN}`)
    expect(store.actEndPending).toBe(true)
    expect(store.showModal).toBe(false)

    store.loadGame()

    expect(store.actEndPending).toBe(false)
    expect(store.acceptInput).toBe(true)
    store.resumeActEnd()
    expect(store.showModal).toBe(false)
    store.submitCommand('look')
    expect(store.turns.at(-1)?.command).toBe('look')
  })

  it.each([
    ['a quick save', (store: Store): boolean => store.saveGame()],
    ['a slot save', (store: Store): boolean => store.saveToSlot(1)],
    ['a named save', (store: Store): boolean => store.saveNamedGame('late')],
  ])('opens the waiting act pages instead of %s', async (_kind, save) => {
    const store = await startedStore([CrownAct, SecondCrownAct])
    store.setActEndGate(() => true)
    store.submitCommand(`take ${CROWN}`)

    expect(save(store)).toBe(false)

    expect(store.actEndPending).toBe(false)
    // The act's pages (here only the next act's intro) are open.
    expect(store.showModal).toBe(true)
    expect(store.getQuickSave()).toBe(null)
    expect(store.getSaveSlots()[0].act).toBe(null)
  })
})

describe('useGameStore over the real engine: look', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows the room again in the story when the player looks around', async () => {
    const store = await startedStore()
    store.submitCommand('look')

    const turn = store.turns.at(-1)
    expect(turn?.command).toBe('look')
    expect(turn?.roomChanged).toBe(false)
    // Marked so the narration reads the room again.
    expect(turn?.narrate).toBe(true)
    expect(turn?.lookedAround).toBe(true)
    expect(turn?.arrival).toEqual({
      room: 'Hall',
      description: 'A quiet hall.',
      characters: [],
      items: [CROWN],
      exits: {},
    })
  })

  it('shows no room for a command that does not look around', async () => {
    const store = await startedStore()
    store.submitCommand('inventory')

    expect(store.turns.at(-1)?.arrival).toBeNull()
    expect(store.turns.at(-1)?.lookedAround).toBeUndefined()
  })
})

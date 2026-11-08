import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { Act, Item, Quest, Room, type GameState } from '@/engine'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { useCommandCompletion } from '@/composables/useCommandCompletion'
import { Act4 } from '@/act4/Act4'
import { SorceressOfLies } from '@/act4/characters/SorceressOfLies'
import { SorceressTruth } from '@/act4/items/SorceressTruth'
import { TruthSight } from '@/act4/spells/TruthSight'
import { useGameStore, type Turn } from './useGameStore'

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

/**
 * A second crown act with its own music, so a change of track shows, and an
 * intro, so its intro page follows the first act's closing page.
 */
class SecondMusicCrownAct extends SecondCrownAct {
  constructor() {
    super()
    this.musicFile = 'second.mp3'
    this.musicInfo = 'Second'
  }

  /** A one-line intro page. */
  override getActIntro(): string {
    return 'Act 2: The Second Crown'
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
        'Act I ends here, and the road ends with it.',
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

  it('keeps the act’s music through its closing page until the player continues', async () => {
    const store = await startedStore([CrownAct, SecondMusicCrownAct])
    expect(store.musicFile).toBe('finale.mp3')
    store.submitCommand(`take ${CROWN}`)
    expect(store.modalChapter).toMatchObject({ kind: 'complete' })
    expect(store.musicFile).toBe('finale.mp3')
    store.continueChapter()
    expect(store.modalChapter).toMatchObject({ kind: 'intro' })
    expect(store.musicFile).toBe('second.mp3')
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
    // The engine's fact: the room is shown again without a move.
    expect(turn?.description).toEqual({ moved: false, firstVisit: false })
    // Marked so the narration reads the room again.
    expect(turn?.narrate).toBe(true)
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
    expect(store.turns.at(-1)?.description).toBeNull()
  })
})

describe('useGameStore over the real engine: a bare direction letter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('can be sent as typed, even with no exit that way and longer words to offer', async () => {
    // The hall has no exits; `e` still starts `examine` and `exit`.
    const store = await startedStore()
    const state = store.completionState('e')
    expect(state.candidates).toContain('examine')
    // Sendable, so Enter sends `e` rather than taking `examine`.
    expect(state.sendable).toBe(true)
    for (const letter of ['n', 's', 'w']) {
      expect(store.completionState(letter).sendable).toBe(true)
    }
  })
})

describe('useGameStore over the real engine: a name typed in full', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('casts on the Sorceress when Enter follows her name, with her Truth carried', async () => {
    const bridge = useBridge(async (): Promise<ActClass[]> => [Act4])
    const store = useGameStore()
    store.setBridge(bridge)
    await store.initGame()
    store.dismissModal()
    const { state } = bridge.controller.game
    state.currentRoom = state.allRooms.ChamberOfWhispers
    state.inventory.push(new SorceressTruth())
    state.learnSpell(new TruthSight())
    store.refreshPanels()

    const text = ref('cast truth sight on sorceress')
    const completion = useCommandCompletion(
      text,
      (input) => store.completionState(input),
      (input) => store.tabComplete(input).newInput,
      () => true,
    )

    // Enter sends what was typed: the highlight stays off her Truth.
    expect(completion.suggestions.value).toContain("sorceress's")
    expect(completion.activeIndex.value).toBe(-1)
    expect(completion.applyActive()).toBe(false)
    expect(text.value).toBe('cast truth sight on sorceress')
    store.submitCommand(text.value)
    const sorceress = state.currentRoom.characters[0]
    expect(sorceress).toBeInstanceOf(SorceressOfLies)
    expect(store.turns.at(-1)?.text).toContain(
      new TruthSight().castOnCharacter(state, sorceress),
    )
  })
})

describe('useGameStore over the real engine: the room the music plays in', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('plays the act loop, not the first room’s track, under a new game’s intro pop-up', async () => {
    const bridge = useBridge(async (): Promise<ActClass[]> => [CrownAct])
    const store = useGameStore()
    store.setBridge(bridge)
    await store.initGame()

    expect(store.modalChapter).toMatchObject({ kind: 'intro' })
    expect(store.musicActName).toBe('Crown Act')
    expect(store.musicRoomKey).toBe('')

    store.dismissModal()

    expect(store.musicRoomKey).toBe('Hall')
  })

  it('plays the act loop under the next act’s intro pop-up, then the room’s', async () => {
    const store = await startedStore([CrownAct, SecondMusicCrownAct])
    store.submitCommand(`take ${CROWN}`)
    store.continueChapter()

    expect(store.modalChapter).toMatchObject({ kind: 'intro' })
    expect(store.musicActName).toBe('Second Crown Act')
    expect(store.musicRoomKey).toBe('')

    store.dismissModal()

    expect(store.musicRoomKey).toBe('Hall')
  })
})

describe('useGameStore over the real engine: the story so far in a save', () => {
  /** The browser's storage, kept across the "pages" of one test. */
  let stored: Record<string, string>

  beforeEach(() => {
    setActivePinia(createPinia())
    stored = {}
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

  /** A fresh page: a new store over a new game, the storage kept. */
  async function reloadedStore(): Promise<Store> {
    setActivePinia(createPinia())
    return startedStore()
  }

  /** The turns as the drawer shows them, without the ids a session numbers. */
  function story(store: Store): unknown[] {
    return store.turns.map(({ id: _id, ...turn }) => turn)
  }

  it.each([
    ['the quick save', (s: Store) => s.saveGame(), (s: Store) => s.loadGame()],
    ['a slot', (s: Store) => s.saveToSlot(2), (s: Store) => s.loadFromSlot(2)],
    [
      'a named save',
      (s: Store) => s.saveNamedGame('hall'),
      (s: Store) => s.loadNamedGame('hall'),
    ],
  ])(
    'brings back the whole story so far from %s in a fresh page',
    async (_kind, save, load) => {
      const store = await startedStore()
      store.submitCommand('look')
      store.submitCommand(`examine ${CROWN}`)
      store.submitCommand('inventory')
      const before = story(store)
      expect(before.length).toBeGreaterThan(2)
      expect(save(store)).toBe(true)

      const reloaded = await reloadedStore()
      load(reloaded)

      expect(story(reloaded)).toEqual(
        // Marked as brought back; nothing of it is narrated or chimed again.
        before.map((turn) => {
          const { narrate: _narrate, ...rest } = turn as Turn
          const quests = rest.quests?.map(({ chime: _chime, ...news }) => news)
          return { ...rest, ...(quests ? { quests } : {}), restored: true }
        }),
      )
    },
  )

  /** Drop the story from every save in the storage, as a save made before the fix has none. */
  function forgetStories(): void {
    delete stored['retroquest_save_story']
    for (const key of ['retroquest_save_slots', 'retroquest_named_saves']) {
      if (!stored[key]) continue
      const entries = JSON.parse(stored[key]) as ({ story?: unknown } | null)[]
      for (const entry of entries) if (entry) delete entry.story
      stored[key] = JSON.stringify(entries)
    }
  }

  it.each([
    ['the quick save', (s: Store) => s.saveGame(), (s: Store) => s.loadGame()],
    ['a slot', (s: Store) => s.saveToSlot(2), (s: Store) => s.loadFromSlot(2)],
    [
      'a named save',
      (s: Store) => s.saveNamedGame('hall'),
      (s: Store) => s.loadNamedGame('hall'),
    ],
  ])(
    'shows only the room for %s made before the story was kept',
    async (_kind, save, load) => {
      const store = await startedStore()
      store.submitCommand('look')
      store.submitCommand(`examine ${CROWN}`)
      expect(save(store)).toBe(true)
      forgetStories()

      const reloaded = await reloadedStore()
      reloaded.submitCommand('look')
      load(reloaded)

      expect(reloaded.turns).toHaveLength(1)
      expect(reloaded.turns[0].arrival?.room).toBe('Hall')
    },
  )

  it('compares the next command with the loaded bag, not the one before the load', async () => {
    const store = await startedStore()
    store.submitCommand(`take ${CROWN}`)
    expect(store.saveToSlot(1)).toBe(true)

    const reloaded = await reloadedStore()
    reloaded.loadFromSlot(1)
    reloaded.submitCommand('look')

    expect(reloaded.turns.at(-1)?.gained).toEqual([])
  })
})

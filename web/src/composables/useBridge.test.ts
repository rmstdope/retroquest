import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBridge } from '@/composables/useBridge'

/** Minimal localStorage mock shared across all tests in this file. */
const localStorageMock = (() => {
  let store: Record<string, string | null> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    _setRaw: (key: string, value: string | null) => {
      store[key] = value
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

function storageFull() {
  localStorageMock.setItem.mockImplementationOnce(() => {
    throw new Error('QuotaExceededError')
  })
}

/** A bridge with the game running in Act I, ready for commands. */
/** A running Act I game, woken out of the dream it opens with. */
async function runningBridge() {
  const bridge = useBridge()
  await bridge.init()
  bridge.controller.advanceToRunning()
  bridge.controller.takeTurn('talk to voice')
  return bridge
}

describe('useBridge', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('init', () => {
    it('reports progress and becomes ready', async () => {
      const bridge = useBridge()
      const progress = vi.fn()
      expect(bridge.isReady()).toBe(false)
      await bridge.init(progress)
      expect(progress).toHaveBeenCalledWith('Starting game...')
      expect(progress).toHaveBeenCalledWith('Ready!')
      expect(bridge.isReady()).toBe(true)
    })

    it('loads all four acts', async () => {
      const bridge = useBridge()
      await bridge.init()
      for (const act of [1, 2, 3, 4]) {
        expect(bridge.controller.goldenPath(act).length).toBeGreaterThan(0)
      }
    })

    it('throws when used before init', () => {
      expect(() => useBridge().controller.getRoomName()).toThrow(
        'Game not started',
      )
    })
  })

  describe('game flow', () => {
    it('starts with the logo, then the act intro, then accepts input', async () => {
      const bridge = useBridge()
      await bridge.init()
      expect(bridge.controller.start()).toContain('Welcome to')
      expect(bridge.controller.isAcceptingInput()).toBe(false)
      expect(bridge.controller.isActRunning()).toBe(false)
      expect(bridge.controller.getCurrentMusic()).toEqual({
        musicFile: '',
        musicInfo: '',
      })
      const texts = bridge.controller.advanceToRunning()
      expect(texts).toHaveLength(3)
      expect(texts[0].text).toContain('Welcome to')
      expect(texts[0].actComplete).toBeNull()
      expect(texts[1].text).toContain('ACT 1: THE CALL TO ADVENTURE')
      expect(bridge.controller.isActRunning()).toBe(true)
      expect(bridge.controller.isAcceptingInput()).toBe(true)
      expect(bridge.controller.isGameRunning()).toBe(true)
      expect(bridge.controller.getActName()).toBe('Act 1')
      expect(bridge.controller.getActIntro()).toContain('ACT 1')
      expect(bridge.controller.getCurrentMusic().musicFile).toContain('.mp3')
    })

    it('opens in the dream and wakes into the cottage', async () => {
      const bridge = useBridge()
      await bridge.init()
      bridge.controller.advanceToRunning()
      expect(bridge.controller.getRoomName()).toBe('The Dream')
      expect(bridge.controller.getRoomCharacters()).toEqual(['voice'])
      expect(bridge.controller.takeTurn('talk to voice')).toContain(
        'let them rest',
      )
      expect(bridge.controller.getRoomName()).toBe("Elior's Cottage")
    })

    it('runs commands and advances the turn', async () => {
      const bridge = await runningBridge()
      expect(bridge.controller.getRoomItems()).not.toContain('bread')
      const result = bridge.controller.takeTurn('use lantern')
      expect(result).toContain('[event]')
      expect(bridge.controller.getRoomItems()).toContain('bread')
      expect(bridge.controller.takeTurn('xyzzy')).toContain(
        "I don't understand",
      )
    })

    it('reads the current text without a new turn, and is not over yet', async () => {
      const bridge = useBridge()
      await bridge.init()
      expect(bridge.controller.getResultText()).toContain('Welcome to')
      expect(bridge.controller.getResultText()).toContain('Welcome to')
      expect(bridge.controller.isGameOver()).toBe(false)
      bridge.controller.advanceToRunning()
      expect(bridge.controller.isGameOver()).toBe(false)
    })

    it('advances one screen at a time', async () => {
      const bridge = useBridge()
      await bridge.init()
      expect(bridge.controller.advanceTurn()).toContain('Welcome to')
      expect(bridge.controller.advanceTurn()).toContain('ACT 1')
      expect(bridge.controller.isActRunning()).toBe(true)
    })

    it('answers read-only commands without a new turn', async () => {
      const bridge = await runningBridge()
      expect(bridge.controller.handleCommand('help')).toContain(
        'Available Commands',
      )
      expect(bridge.controller.handleCommand('stats')).toContain(
        "[room_name]Elior's Cottage[/room_name]",
      )
    })

    it('starts a fresh game from Act I', async () => {
      const bridge = await runningBridge()
      bridge.controller.takeTurn('use lantern')
      bridge.newGame()
      bridge.controller.advanceToRunning()
      expect(bridge.controller.getRoomItems()).not.toContain('bread')
    })
  })

  describe('room and journal data', () => {
    it('describes the current room', async () => {
      const bridge = await runningBridge()
      expect(bridge.controller.getRoomName()).toBe("Elior's Cottage")
      expect(bridge.controller.getRoomDescription()).toContain('cottage')
      expect(bridge.controller.getRoomCharacters()).toEqual(['grandmother'])
      expect(bridge.controller.getRoomItems()).toEqual(['lantern'])
      expect(bridge.controller.getRoomExits()).toEqual({})
      expect(bridge.controller.getRoomWares()).toEqual([])
      expect(bridge.controller.look()).toContain('surroundings')
    })

    it('lists the inventory, spells and quests as named items', async () => {
      const bridge = await runningBridge()
      expect(bridge.controller.getInventory()).toEqual([])
      expect(bridge.controller.getSpells()).toEqual([])
      bridge.controller.takeTurn('use lantern')
      bridge.controller.takeTurn('take bread')
      expect(bridge.controller.getInventory()).toEqual([
        {
          name: '[item_name]bread[/item_name]',
          description: expect.any(String),
        },
      ])
      expect(bridge.controller.getCompletedQuests()).toEqual([])
      const settled = bridge.controller.settleQuests()
      expect(settled.activated[0].popup).toContain('[quest_name]')
      expect(settled.updated).toEqual([])
      expect(settled.completed).toEqual([])
      expect(bridge.controller.getActiveQuests().length).toBeGreaterThan(0)
    })

    it('reports quest progress, act stats and short names', async () => {
      const bridge = await runningBridge()
      expect(bridge.controller.getQuestProgress()).toEqual({
        completed: 0,
        total: 11,
        actNumber: 1,
        mainQuest: 'Shadows Over Willowbrook',
      })
      expect(bridge.controller.getActStats()).toEqual({
        questsCompleted: 0,
        questsTotal: 11,
        spells: 0,
        places: 1,
      })
      bridge.controller.takeTurn('use lantern')
      expect(bridge.controller.getShortNames()).toEqual({
        lantern: 'lantern (lit)',
        journal: "elior's journal",
      })
    })

    it('offers command completions for the current room', async () => {
      const bridge = await runningBridge()
      const tree = bridge.controller.getCommandCompletions()
      expect(tree.talk).toEqual({ to: { grandmother: null } })
      expect(tree.help).toBeNull()
    })
  })

  describe('quick save', () => {
    it('stores the save data and its details', async () => {
      const bridge = await runningBridge()
      bridge.controller.takeTurn('use lantern')
      expect(bridge.quickSaveGame()).toBe('Game saved.')
      const data = localStorageMock.getItem('retroquest_save')
      expect(JSON.parse(data!)).toMatchObject({ version: 4, actIndex: 0 })
      const quick = bridge.getQuickSave()!
      expect(quick.slot).toBe(0)
      expect(quick.act).toBe('Act 1')
      expect(quick.room).toBe("Elior's Cottage")
      expect(typeof quick.timestamp).toBe('string')
      expect(quick.quests).toEqual({ completed: 0, total: 11 })
    })

    it('quick save and load restore the game', async () => {
      const bridge = await runningBridge()
      expect(bridge.quickLoadGame()).toBe(
        '[failure]No save file found.[/failure]',
      )
      bridge.controller.takeTurn('use lantern')
      bridge.controller.takeTurn('take bread')
      expect(bridge.quickSaveGame()).toBe('Game saved.')
      bridge.newGame()
      bridge.controller.advanceToRunning()
      expect(bridge.controller.getInventory()).toEqual([])
      expect(bridge.quickLoadGame()).toContain('loaded')
      expect(bridge.controller.getInventory()[0].name).toContain('bread')
    })

    it('is a failure when storage is full', async () => {
      const bridge = await runningBridge()
      storageFull()
      expect(bridge.quickSaveGame()).toMatch(
        /^\[failure\]The game could not be saved/,
      )
    })

    it('drops the old details when the new ones cannot be stored', async () => {
      const bridge = await runningBridge()
      localStorageMock._setRaw(
        'retroquest_save_meta',
        JSON.stringify({ act: 'Act 1', room: 'Square', timestamp: 'old' }),
      )
      localStorageMock.setItem
        .mockImplementationOnce((key: string, value: string) =>
          localStorageMock._setRaw(key, value),
        )
        .mockImplementationOnce(() => {
          throw new Error('QuotaExceededError')
        })
      bridge.quickSaveGame()
      expect(localStorageMock.getItem('retroquest_save')).not.toBeNull()
      expect(bridge.getQuickSave()!.room).toBe(null)
    })

    it('has no quick save until one is made', async () => {
      const bridge = await runningBridge()
      expect(bridge.getQuickSave()).toBe(null)
    })

    it('shows an older quick save without its details', async () => {
      const bridge = await runningBridge()
      localStorageMock._setRaw('retroquest_save', '{}')
      localStorageMock._setRaw('retroquest_save_meta', 'not json')
      expect(bridge.getQuickSave()!.room).toBe(null)
      localStorageMock.removeItem('retroquest_save_meta')
      expect(bridge.getQuickSave()).toEqual({
        slot: 0,
        act: null,
        room: null,
        timestamp: null,
        quests: null,
      })
      localStorageMock._setRaw('retroquest_save_meta', 'null')
      expect(bridge.getQuickSave()!.room).toBe(null)
    })

    it('treats a save of the old Python engine as no save', async () => {
      const bridge = await runningBridge()
      localStorageMock._setRaw('retroquest_save', 'gASVbQAAAAAAAAB9lC4=')
      expect(bridge.getQuickSave()).toBeNull()
      expect(bridge.quickLoadGame()).toBe(
        '[failure]No save file found.[/failure]',
      )
      localStorageMock._setRaw('retroquest_save', '{"version":99}')
      expect(bridge.getQuickSave()).not.toBeNull()
      expect(bridge.quickLoadGame()).toMatch(/^\[failure\]Failed to load game/)
    })

    it('reports progress while the acts load', async () => {
      const progress = vi.fn()
      await useBridge().init(progress)
      expect(progress.mock.calls.map((c) => c[0])).toEqual([
        'Loading the acts...',
        'Starting game...',
        'Ready!',
      ])
    })
  })

  describe('named saves', () => {
    it('stores, overwrites and loads named saves', async () => {
      const bridge = await runningBridge()
      expect(bridge.loadNamedGame('morning')).toBe(
        '[failure]No save file found.[/failure]',
      )
      expect(bridge.saveNamedGame('morning')).toBe('Game saved.')
      bridge.controller.takeTurn('use lantern')
      expect(bridge.saveNamedGame('evening')).toBe('Game saved.')
      expect(bridge.saveNamedGame('morning')).toBe('Game saved.')
      const saves = JSON.parse(
        localStorageMock.getItem('retroquest_named_saves')!,
      ) as {
        name: string
      }[]
      expect(saves.map((s) => s.name)).toEqual(['morning', 'evening'])
      bridge.newGame()
      bridge.controller.advanceToRunning()
      expect(bridge.loadNamedGame('evening')).toContain('loaded')
      expect(bridge.controller.getRoomItems()).toContain('bread')
      expect(bridge.loadNamedGame('missing')).toBe(
        '[failure]No save file found.[/failure]',
      )
    })

    it('is a failure when storage is full', async () => {
      const bridge = await runningBridge()
      storageFull()
      expect(bridge.saveNamedGame('morning')).toMatch(/^\[failure\]/)
    })

    it('ignores unreadable named saves', async () => {
      const bridge = await runningBridge()
      localStorageMock._setRaw('retroquest_named_saves', '{"not":"a list"}')
      expect(bridge.loadNamedGame('x')).toBe(
        '[failure]No save file found.[/failure]',
      )
      localStorageMock._setRaw('retroquest_named_saves', 'garbage')
      expect(bridge.saveNamedGame('x')).toBe('Game saved.')
    })
  })

  describe('save slots (8-slot system)', () => {
    it('returns exactly 8 empty slots when storage is empty', async () => {
      const bridge = await runningBridge()
      const slots = bridge.getSaveSlots()
      expect(slots).toHaveLength(8)
      expect(slots.every((s) => s.act === null && s.room === null)).toBe(true)
      expect(slots.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('stores slot data with act, room, timestamp and quest count', async () => {
      const bridge = await runningBridge()
      expect(bridge.saveToSlot(3)).toBe('Game saved.')
      const slots = JSON.parse(
        localStorageMock.getItem('retroquest_save_slots')!,
      ) as ({
        slot: number
        act: string
        room: string
        timestamp: string
        data: string
      } | null)[]
      expect(slots[2]).toMatchObject({
        slot: 3,
        act: 'Act 1',
        room: "Elior's Cottage",
      })
      expect(typeof slots[2]!.timestamp).toBe('string')
      expect(JSON.parse(slots[2]!.data)).toMatchObject({ version: 4 })
      expect(bridge.getSaveSlots()[2].quests).toEqual({
        completed: 0,
        total: 11,
      })
    })

    it('overwrites existing data in the same slot and keeps the others', async () => {
      const bridge = await runningBridge()
      const existing = Array.from({ length: 8 }, (_, i) =>
        i === 1
          ? {
              slot: 2,
              act: 'Act 1',
              room: 'Old Room',
              timestamp: 'old',
              data: '{}',
            }
          : i === 0
            ? {
                slot: 1,
                act: 'Act 1',
                room: 'Square',
                timestamp: 't',
                data: '{}',
              }
            : null,
      )
      localStorageMock._setRaw(
        'retroquest_save_slots',
        JSON.stringify(existing),
      )
      bridge.saveToSlot(2)
      const slots = bridge.getSaveSlots()
      expect(slots[1].room).toBe("Elior's Cottage")
      expect(slots[0]).toMatchObject({
        act: 'Act 1',
        room: 'Square',
        quests: null,
      })
    })

    it('loads a slot and reports empty or missing slots', async () => {
      const bridge = await runningBridge()
      bridge.controller.takeTurn('use lantern')
      bridge.saveToSlot(5)
      bridge.newGame()
      bridge.controller.advanceToRunning()
      expect(bridge.loadFromSlot(5)).toContain('loaded')
      expect(bridge.controller.getRoomItems()).toContain('bread')
      expect(bridge.loadFromSlot(6)).toBe(
        '[failure]No save file found.[/failure]',
      )
      localStorageMock.clear()
      expect(bridge.loadFromSlot(5)).toBe(
        '[failure]No save file found.[/failure]',
      )
      expect(bridge.loadFromSlot(0)).toBe(
        '[failure]No save file found.[/failure]',
      )
    })

    it('refuses slots out of range and reports a full storage', async () => {
      const bridge = await runningBridge()
      expect(bridge.saveToSlot(0)).toMatch(/^\[failure\]Invalid save slot/)
      expect(bridge.saveToSlot(9)).toMatch(/^\[failure\]Invalid save slot/)
      storageFull()
      expect(bridge.saveToSlot(2)).toMatch(/^\[failure\]/)
    })

    it('falls back to empty slots when the stored list is unreadable', async () => {
      const bridge = await runningBridge()
      localStorageMock._setRaw('retroquest_save_slots', '[1,2]')
      expect(bridge.getSaveSlots().every((s) => s.act === null)).toBe(true)
      const old = Array.from({ length: 8 }, (_, i) =>
        i === 0
          ? {
              slot: 1,
              act: 'Act 1',
              room: 'Square',
              timestamp: 't',
              data: 'gASV',
            }
          : null,
      )
      localStorageMock._setRaw('retroquest_save_slots', JSON.stringify(old))
      expect(bridge.getSaveSlots()[0].act).toBeNull()
      expect(bridge.loadFromSlot(1)).toBe(
        '[failure]No save file found.[/failure]',
      )
      localStorageMock._setRaw('retroquest_save_slots', 'garbage')
      expect(bridge.getSaveSlots()).toHaveLength(8)
    })
  })
})

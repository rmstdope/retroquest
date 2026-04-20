import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBridge } from '@/composables/useBridge'

/**
 * Minimal localStorage mock shared across all tests in this file.
 */
const localStorageMock = (() => {
  let store: Record<string, string | null> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
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

/**
 * Create a mock PyodideRuntime that records calls and returns
 * configurable results.
 */
function createMockPyodide() {
  const pythonResults = new Map<string, unknown>()
  const globals = new Map<string, unknown>()

  return {
    pythonResults,
    globals,
    runtime: {
      runPython: vi.fn((code: string) => {
        for (const [pattern, result] of pythonResults) {
          if (code.includes(pattern)) return result
        }
        return undefined
      }),
      runPythonAsync: vi.fn(async () => undefined),
      globals: {
        get: vi.fn((name: string) => globals.get(name)),
        set: vi.fn((name: string, value: unknown) => {
          globals.set(name, value)
        }),
      },
    },
  }
}

/**
 * Helper to create a mock PyProxy that mimics Python list.toJs().
 */
function pyProxy(jsValue: unknown) {
  return { toJs: () => jsValue }
}

/**
 * Helper to create a mock PyProxy whose toJs() ignores options and returns
 * the JS value directly (used for dict conversions in getCommandCompletions).
 */
function pyProxyWithToJs(jsValue: unknown) {
  return { toJs: () => jsValue }
}

describe('useBridge', () => {
  let mock: ReturnType<typeof createMockPyodide>
  let bridge: ReturnType<typeof useBridge>

  beforeEach(() => {
    mock = createMockPyodide()
    // Inject the mock pyodide via init's loadPyodide global
    ;(globalThis as Record<string, unknown>).loadPyodide = vi
      .fn()
      .mockResolvedValue(mock.runtime)
    // Mock fetch for manifest and source files
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    }) as unknown as typeof fetch

    bridge = useBridge()
  })

  describe('init', () => {
    it('calls loadPyodide and reports progress', async () => {
      const progress = vi.fn()
      await bridge.init(progress)

      expect(progress).toHaveBeenCalledWith('Loading Python runtime...')
      expect(progress).toHaveBeenCalledWith('Loading game engine...')
      expect(progress).toHaveBeenCalledWith('Starting game...')
      expect(progress).toHaveBeenCalledWith('Ready!')
    })

    it('sets isReady to true after init', async () => {
      expect(bridge.isReady()).toBe(false)
      await bridge.init()
      expect(bridge.isReady()).toBe(true)
    })
  })

  describe('after init', () => {
    beforeEach(async () => {
      localStorageMock.clear()
      vi.clearAllMocks()
      await bridge.init()
    })

    it('startGame calls controller.start()', () => {
      mock.pythonResults.set('controller.start()', 'Welcome!')
      expect(bridge.startGame()).toBe('Welcome!')
    })

    it('handleCommand sends command and advances turn', () => {
      mock.pythonResults.set('controller.handle_command', 'You moved.')
      bridge.handleCommand('go north')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith('_cmd', 'go north')
    })

    it('getRoom returns room description', () => {
      mock.pythonResults.set('controller.get_room()', 'A dark room.')
      expect(bridge.getRoom()).toBe('A dark room.')
    })

    it('getRoomName returns room name', () => {
      mock.pythonResults.set('controller.get_room_name()', 'Village Square')
      expect(bridge.getRoomName()).toBe('Village Square')
    })

    it('getRoomDescription returns description', () => {
      mock.pythonResults.set(
        'controller.get_room_description()',
        'A peaceful village.',
      )
      expect(bridge.getRoomDescription()).toBe('A peaceful village.')
    })

    it('getRoomCharacters returns string array', () => {
      mock.pythonResults.set(
        'controller.get_room_characters()',
        pyProxy(['Mira', 'Priest']),
      )
      expect(bridge.getRoomCharacters()).toEqual(['Mira', 'Priest'])
    })

    it('getRoomItems returns string array', () => {
      mock.pythonResults.set(
        'controller.get_room_items()',
        pyProxy(['Sword', 'Shield']),
      )
      expect(bridge.getRoomItems()).toEqual(['Sword', 'Shield'])
    })

    it('getRoomExits returns direction map', () => {
      mock.pythonResults.set(
        'controller.get_room_exits()',
        pyProxy(
          new Map([
            ['north', 'Forest'],
            ['south', 'Village'],
          ]),
        ),
      )
      expect(bridge.getRoomExits()).toEqual({
        north: 'Forest',
        south: 'Village',
      })
    })

    it('getInventory maps tuples to NamedItem[]', () => {
      mock.pythonResults.set(
        'controller.get_inventory()',
        pyProxy([
          ['Sword', 'A sharp blade'],
          ['Potion', 'Restores health'],
        ]),
      )
      expect(bridge.getInventory()).toEqual([
        { name: 'Sword', description: 'A sharp blade' },
        { name: 'Potion', description: 'Restores health' },
      ])
    })

    it('getSpells maps tuples to NamedItem[]', () => {
      mock.pythonResults.set(
        'controller.get_spells()',
        pyProxy([['Fireball', 'Deals fire damage']]),
      )
      expect(bridge.getSpells()).toEqual([
        { name: 'Fireball', description: 'Deals fire damage' },
      ])
    })

    it('getActiveQuests maps tuples to NamedItem[]', () => {
      mock.pythonResults.set(
        'controller.get_active_quests()',
        pyProxy([['Find the key', 'Search the forest']]),
      )
      expect(bridge.getActiveQuests()).toEqual([
        { name: 'Find the key', description: 'Search the forest' },
      ])
    })

    it('getCompletedQuests maps tuples to NamedItem[]', () => {
      mock.pythonResults.set(
        'controller.get_completed_quests()',
        pyProxy([['Saved the village', 'Heroes triumph']]),
      )
      expect(bridge.getCompletedQuests()).toEqual([
        { name: 'Saved the village', description: 'Heroes triumph' },
      ])
    })

    it('activateQuest returns string or null', () => {
      mock.pythonResults.set('controller.activate_quest()', 'New quest!')
      expect(bridge.activateQuest()).toBe('New quest!')
    })

    it('activateQuest returns null for undefined', () => {
      mock.pythonResults.set('controller.activate_quest()', undefined)
      expect(bridge.activateQuest()).toBeNull()
    })

    it('updateQuest returns string or null', () => {
      mock.pythonResults.set('controller.update_quest()', 'Quest updated')
      expect(bridge.updateQuest()).toBe('Quest updated')
    })

    it('completeQuest returns string or null', () => {
      mock.pythonResults.set('controller.complete_quest()', null)
      expect(bridge.completeQuest()).toBeNull()
    })

    it('look returns look result', () => {
      mock.pythonResults.set('controller.look()', 'You see a door.')
      expect(bridge.look()).toBe('You see a door.')
    })

    it('getActIntro returns intro text', () => {
      mock.pythonResults.set('controller.get_act_intro()', 'Act 1 begins...')
      expect(bridge.getActIntro()).toBe('Act 1 begins...')
    })

    it('saveGame stores base64 save data in localStorage', () => {
      mock.pythonResults.set(
        'controller.save_game()',
        'Game saved successfully.',
      )
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      const result = bridge.saveGame()
      expect(result).toBe('Game saved successfully.')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'retroquest_save',
        'c2F2ZWRhdGE=',
      )
    })

    it('saveGame returns default message when controller returns empty string', () => {
      mock.pythonResults.set('controller.save_game()', '')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      const result = bridge.saveGame()
      expect(result).toBe('Game saved.')
    })

    it('saveGame does not write to localStorage when no save data', () => {
      mock.pythonResults.set('controller.save_game()', 'Saved.')
      mock.pythonResults.set("open('retroquest.save', 'rb')", '')
      bridge.saveGame()
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('quickSaveGame stores base64 save data in localStorage', () => {
      mock.pythonResults.set(
        'controller.save_game()',
        'Game saved successfully.',
      )
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      const result = bridge.quickSaveGame()
      expect(result).toBe('Game saved successfully.')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'retroquest_save',
        'c2F2ZWRhdGE=',
      )
    })

    it('quickLoadGame restores game state when save exists', () => {
      localStorageMock._setRaw('retroquest_save', 'c2F2ZWRhdGE=')
      mock.pythonResults.set('controller.load_game()', 'Game loaded.')
      const result = bridge.quickLoadGame()
      expect(result).toBe('Game loaded.')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith(
        '_save_b64',
        'c2F2ZWRhdGE=',
      )
    })

    it('quickLoadGame returns failure when no save exists', () => {
      expect(bridge.quickLoadGame()).toBe(
        '[failure]No save file found.[/failure]',
      )
    })

    it('loadGame restores game state when save exists', () => {
      localStorageMock._setRaw('retroquest_save', 'c2F2ZWRhdGE=')
      mock.pythonResults.set('controller.load_game()', 'Game loaded.')
      const result = bridge.loadGame()
      expect(result).toBe('Game loaded.')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith(
        '_save_b64',
        'c2F2ZWRhdGE=',
      )
    })

    it('saveNamedGame stores save under named slots in localStorage', () => {
      mock.pythonResults.set('controller.save_game()', 'Saved.')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      bridge.saveNamedGame('Before Boss')
      const raw = localStorageMock.setItem.mock.calls.find(
        (args: unknown[]) => args[0] === 'retroquest_named_saves',
      )
      expect(raw).toBeDefined()
      const saves = JSON.parse(raw![1] as string) as Array<{
        name: string
        data: string
      }>
      expect(saves).toHaveLength(1)
      expect(saves[0].name).toBe('Before Boss')
      expect(saves[0].data).toBe('c2F2ZWRhdGE=')
    })

    it('saveNamedGame overwrites existing save with same name', () => {
      const existing = JSON.stringify([
        {
          name: 'Before Boss',
          timestamp: '2024-01-01T00:00:00.000Z',
          data: 'b2xkZGF0YQ==',
        },
      ])
      localStorageMock._setRaw('retroquest_named_saves', existing)
      mock.pythonResults.set('controller.save_game()', 'Saved.')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'bmV3ZGF0YQ==')
      bridge.saveNamedGame('Before Boss')
      const raw = localStorageMock.setItem.mock.calls.find(
        (args: unknown[]) => args[0] === 'retroquest_named_saves',
      )
      const saves = JSON.parse(raw![1] as string) as Array<{
        name: string
        data: string
      }>
      expect(saves).toHaveLength(1)
      expect(saves[0].data).toBe('bmV3ZGF0YQ==')
    })

    it('listNamedSaves returns empty array when no named saves', () => {
      expect(bridge.listNamedSaves()).toEqual([])
    })

    it('listNamedSaves returns saved slots without data field', () => {
      const saves = [
        { name: 'Save 1', timestamp: '2024-01-01T00:00:00.000Z', data: 'abc' },
      ]
      localStorageMock._setRaw('retroquest_named_saves', JSON.stringify(saves))
      const result = bridge.listNamedSaves()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Save 1')
      expect(result[0].timestamp).toBe('2024-01-01T00:00:00.000Z')
      expect('data' in result[0]).toBe(false)
    })

    it('loadNamedGame loads a named save', () => {
      const saves = [
        {
          name: 'Before Boss',
          timestamp: '2024-01-01T00:00:00.000Z',
          data: 'c2F2ZWRhdGE=',
        },
      ]
      localStorageMock._setRaw('retroquest_named_saves', JSON.stringify(saves))
      mock.pythonResults.set('controller.load_game()', 'Game loaded.')
      const result = bridge.loadNamedGame('Before Boss')
      expect(result).toBe('Game loaded.')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith(
        '_save_b64',
        'c2F2ZWRhdGE=',
      )
    })

    it('loadNamedGame returns failure when save name not found', () => {
      localStorageMock._setRaw('retroquest_named_saves', JSON.stringify([]))
      const result = bridge.loadNamedGame('Nonexistent')
      expect(result).toBe('[failure]No save file found.[/failure]')
    })

    it('loadNamedGame returns failure when no named saves exist', () => {
      const result = bridge.loadNamedGame('Any')
      expect(result).toBe('[failure]No save file found.[/failure]')
    })

    it('isAcceptingInput returns boolean', () => {
      mock.pythonResults.set('game.accept_input', true)
      expect(bridge.isAcceptingInput()).toBe(true)
    })

    it('advanceTurn returns result text', () => {
      mock.pythonResults.set('game.get_result_text()', 'Turn result')
      expect(bridge.advanceTurn()).toBe('Turn result')
    })

    it('isGameRunning returns boolean', () => {
      mock.pythonResults.set('controller.is_game_running()', false)
      expect(bridge.isGameRunning()).toBe(false)
    })

    it('isActRunning returns boolean', () => {
      mock.pythonResults.set('controller.is_act_running()', true)
      expect(bridge.isActRunning()).toBe(true)
    })

    it('getMusicInfo returns MusicInfo object', () => {
      mock.pythonResults.set(
        'controller.get_current_music()',
        pyProxy(['forest.mp3', 'Music by Composer']),
      )
      const info = bridge.getMusicInfo()
      expect(info).toEqual({
        musicFile: 'forest.mp3',
        musicInfo: 'Music by Composer',
      })
    })

    it('advanceToRunning returns array of texts', () => {
      mock.pythonResults.set('game.is_act_running()', pyProxy(['text1']))
      // Since advanceToRunning calls a multi-line Python snippet, mock it
      mock.runtime.runPython.mockReturnValueOnce(
        pyProxy(['Logo text', 'Intro text', 'Running text']),
      )
      expect(bridge.advanceToRunning()).toEqual([
        'Logo text',
        'Intro text',
        'Running text',
      ])
    })

    it('getCommandCompletions converts nested Python dict to plain JS object', () => {
      const completionsTree = {
        go: { north: null, south: null },
        take: { sword: null },
      }
      mock.pythonResults.set(
        'game.get_command_completions()',
        pyProxyWithToJs(completionsTree),
      )
      expect(bridge.getCommandCompletions()).toEqual(completionsTree)
    })

    it('getCommandCompletions returns empty object when no completions', () => {
      mock.pythonResults.set(
        'game.get_command_completions()',
        pyProxyWithToJs({}),
      )
      expect(bridge.getCommandCompletions()).toEqual({})
    })
  })

  describe('error handling', () => {
    it('throws when calling methods before init', () => {
      expect(() => bridge.startGame()).toThrow('Pyodide not initialized')
    })

    it('loadGame returns failure message when no save exists', async () => {
      await bridge.init()
      expect(bridge.loadGame()).toBe('[failure]No save file found.[/failure]')
    })
  })

  describe('save slots (8-slot system)', () => {
    beforeEach(async () => {
      localStorageMock.clear()
      vi.clearAllMocks()
      await bridge.init()
    })

    it('getActName returns act name from controller', () => {
      mock.pythonResults.set('controller.get_act_name()', 'Act 1')
      expect(bridge.getActName()).toBe('Act 1')
    })

    it('getSaveSlots returns exactly 8 slots when localStorage is empty', () => {
      const slots = bridge.getSaveSlots()
      expect(slots).toHaveLength(8)
      expect(slots.every((s) => s.act === null)).toBe(true)
      expect(slots.every((s) => s.room === null)).toBe(true)
      expect(slots.every((s) => s.timestamp === null)).toBe(true)
      expect(slots.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('saveToSlot stores slot data with act, room and timestamp', () => {
      mock.pythonResults.set('controller.save_game() or ""', 'Game saved.')
      mock.pythonResults.set('controller.get_act_name()', 'Act 2')
      mock.pythonResults.set('controller.get_room_name()', 'Forest Path')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')

      bridge.saveToSlot(3)

      const raw = localStorageMock.setItem.mock.calls.find(
        (args: unknown[]) => args[0] === 'retroquest_save_slots',
      )
      expect(raw).toBeDefined()
      const slots = JSON.parse(raw![1] as string) as Array<{
        slot: number
        act: string
        room: string
        timestamp: string
        data: string
      } | null>
      const slot3 = slots[2]
      expect(slot3).not.toBeNull()
      expect(slot3!.slot).toBe(3)
      expect(slot3!.act).toBe('Act 2')
      expect(slot3!.room).toBe('Forest Path')
      expect(typeof slot3!.timestamp).toBe('string')
      expect(slot3!.data).toBe('c2F2ZWRhdGE=')
    })

    it('saveToSlot overwrites existing data in the same slot', () => {
      const existing = Array.from({ length: 8 }, (_, i) =>
        i === 1
          ? {
              slot: 2,
              act: 'Act 1',
              room: 'Old Room',
              timestamp: '2024-01-01T00:00:00.000Z',
              data: 'b2xk',
            }
          : null,
      )
      localStorageMock._setRaw(
        'retroquest_save_slots',
        JSON.stringify(existing),
      )
      mock.pythonResults.set('controller.save_game() or ""', 'Game saved.')
      mock.pythonResults.set('controller.get_act_name()', 'Act 3')
      mock.pythonResults.set('controller.get_room_name()', 'New Room')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'bmV3')

      bridge.saveToSlot(2)

      const raw = localStorageMock.setItem.mock.calls.find(
        (args: unknown[]) => args[0] === 'retroquest_save_slots',
      )
      const slots = JSON.parse(raw![1] as string) as Array<{
        slot: number
        act: string
        room: string
        data: string
      } | null>
      expect(slots[1]!.act).toBe('Act 3')
      expect(slots[1]!.room).toBe('New Room')
      expect(slots[1]!.data).toBe('bmV3')
    })

    it('getSaveSlots returns occupied slot after saving', () => {
      const stored = Array.from({ length: 8 }, (_, i) =>
        i === 4
          ? {
              slot: 5,
              act: 'Act 1',
              room: 'Village Square',
              timestamp: '2025-04-20T10:00:00.000Z',
              data: 'abc',
            }
          : null,
      )
      localStorageMock._setRaw('retroquest_save_slots', JSON.stringify(stored))
      const slots = bridge.getSaveSlots()
      expect(slots).toHaveLength(8)
      const slot5 = slots.find((s) => s.slot === 5)!
      expect(slot5.act).toBe('Act 1')
      expect(slot5.room).toBe('Village Square')
      expect(slot5.timestamp).toBe('2025-04-20T10:00:00.000Z')
      const emptySlots = slots.filter((s) => s.slot !== 5)
      expect(emptySlots.every((s) => s.act === null)).toBe(true)
    })

    it('loadFromSlot restores game state from the slot', () => {
      const stored = Array.from({ length: 8 }, (_, i) =>
        i === 2
          ? {
              slot: 3,
              act: 'Act 1',
              room: 'Market',
              timestamp: '2025-04-20T10:00:00.000Z',
              data: 'c2F2ZWRhdGE=',
            }
          : null,
      )
      localStorageMock._setRaw('retroquest_save_slots', JSON.stringify(stored))
      mock.pythonResults.set('controller.load_game()', 'Game loaded.')

      const result = bridge.loadFromSlot(3)

      expect(result).toBe('Game loaded.')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith(
        '_save_b64',
        'c2F2ZWRhdGE=',
      )
    })

    it('loadFromSlot returns failure when slot is empty', () => {
      const stored = Array.from({ length: 8 }, () => null)
      localStorageMock._setRaw('retroquest_save_slots', JSON.stringify(stored))
      const result = bridge.loadFromSlot(1)
      expect(result).toBe('[failure]No save file found.[/failure]')
    })

    it('loadFromSlot returns failure when no slots data exists', () => {
      const result = bridge.loadFromSlot(1)
      expect(result).toBe('[failure]No save file found.[/failure]')
    })

    it('saveToSlot returns failure when slot is out of range (0)', () => {
      const result = bridge.saveToSlot(0)
      expect(result).toBe('[failure]Invalid save slot.[/failure]')
    })

    it('saveToSlot returns failure when slot is out of range (9)', () => {
      const result = bridge.saveToSlot(9)
      expect(result).toBe('[failure]Invalid save slot.[/failure]')
    })
  })
})

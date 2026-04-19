import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBridge } from '@/composables/useBridge'

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
      const setItem = vi.fn()
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem: vi.fn(), setItem },
        writable: true,
      })
      mock.pythonResults.set(
        'controller.save_game()',
        'Game saved successfully.',
      )
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      const result = bridge.saveGame()
      expect(result).toBe('Game saved successfully.')
      expect(setItem).toHaveBeenCalledWith('retroquest_save', 'c2F2ZWRhdGE=')
    })

    it('saveGame returns default message when controller returns empty string', () => {
      const setItem = vi.fn()
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem: vi.fn(), setItem },
        writable: true,
      })
      mock.pythonResults.set('controller.save_game()', '')
      mock.pythonResults.set("open('retroquest.save', 'rb')", 'c2F2ZWRhdGE=')
      const result = bridge.saveGame()
      expect(result).toBe('Game saved.')
    })

    it('saveGame does not write to localStorage when no save data', () => {
      const setItem = vi.fn()
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem: vi.fn(), setItem },
        writable: true,
      })
      mock.pythonResults.set('controller.save_game()', 'Saved.')
      mock.pythonResults.set("open('retroquest.save', 'rb')", '')
      bridge.saveGame()
      expect(setItem).not.toHaveBeenCalled()
    })

    it('loadGame restores game state when save exists', () => {
      const getItem = vi.fn().mockReturnValue('c2F2ZWRhdGE=')
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem, setItem: vi.fn() },
        writable: true,
      })
      mock.pythonResults.set('controller.load_game()', 'Game loaded.')
      const result = bridge.loadGame()
      expect(result).toBe('Game loaded.')
      expect(mock.runtime.globals.set).toHaveBeenCalledWith(
        '_save_b64',
        'c2F2ZWRhdGE=',
      )
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
  })

  describe('error handling', () => {
    it('throws when calling methods before init', () => {
      expect(() => bridge.startGame()).toThrow('Pyodide not initialized')
    })

    it('loadGame returns failure message when no save exists', async () => {
      // Mock localStorage
      const getItem = vi.fn().mockReturnValue(null)
      Object.defineProperty(globalThis, 'localStorage', {
        value: { getItem, setItem: vi.fn() },
        writable: true,
      })
      await bridge.init()
      expect(bridge.loadGame()).toBe('[failure]No save file found.[/failure]')
    })
  })
})

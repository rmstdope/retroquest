import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore, MAX_TURNS } from './useGameStore'
import type { CompletionTree, SaveSlot } from '@/types/bridge'

vi.mock('@/utils/theme', () => ({
  renderMarkup: vi.fn((s: string) => `<rendered>${s}</rendered>`),
}))

/**
 * Minimal mock matching the useBridge() return shape.
 */
function createMockBridge() {
  return {
    init: vi.fn(),
    isReady: vi.fn(() => true),
    startGame: vi.fn(() => 'Game started'),
    advanceToRunning: vi.fn(() => ['Intro text']),
    handleCommand: vi.fn(() => 'command result'),
    getRoom: vi.fn(() => 'Room'),
    getRoomName: vi.fn(() => 'Village Square'),
    getRoomDescription: vi.fn(() => 'A quiet village.'),
    getRoomCharacters: vi.fn(() => ['Mira']),
    getRoomItems: vi.fn(() => ['Map']),
    getRoomExits: vi.fn(() => ({ north: 'Forest' }) as Record<string, string>),
    getRoomWares: vi.fn(
      () => [] as Array<{ name: string; price: number; seller: string }>,
    ),
    getInventory: vi.fn(() => [{ name: 'Sword', description: 'Sharp' }]),
    getSpells: vi.fn(() => [{ name: 'Heal', description: 'Restores HP' }]),
    getActiveQuests: vi.fn(() => [
      { name: 'Find Key', description: 'Find the key' },
    ]),
    getCompletedQuests: vi.fn(
      () => [] as { name: string; description: string }[],
    ),
    activateQuest: vi.fn((): string | null => null),
    updateQuest: vi.fn((): string | null => null),
    completeQuest: vi.fn((): string | null => null),
    look: vi.fn(() => 'You look around'),
    getActIntro: vi.fn(() => 'Act intro'),
    saveGame: vi.fn(() => 'Game saved.'),
    loadGame: vi.fn(() => 'Game loaded.'),
    quickSaveGame: vi.fn(() => 'Game saved.'),
    quickLoadGame: vi.fn(() => 'Game loaded.'),
    saveNamedGame: vi.fn(() => 'Game saved.'),
    loadNamedGame: vi.fn(() => 'Game loaded.'),
    getActName: vi.fn(() => 'Act 1'),
    getQuestProgress: vi.fn(() => ({
      completed: 4,
      total: 11,
      actNumber: 1,
      mainQuest: 'Shadows Over Willowbrook',
    })),
    readCommand: vi.fn((): string => ''),
    getShortNames: vi.fn((): Record<string, string> => ({})),
    newGame: vi.fn(),
    getQuickSave: vi.fn((): SaveSlot | null => null),
    getActStats: vi.fn(() => ({
      questsCompleted: 4,
      questsTotal: 11,
      spells: 1,
      places: 3,
    })),
    getSaveSlots: vi.fn((): SaveSlot[] => [
      ...Array.from({ length: 8 }, (_, i) => ({
        slot: i + 1,
        act: null,
        room: null,
        timestamp: null,
        quests: null,
      })),
    ]),
    saveToSlot: vi.fn(() => 'Game saved.'),
    loadFromSlot: vi.fn(() => 'Game loaded.'),
    isAcceptingInput: vi.fn(() => true),
    advanceTurn: vi.fn(() => 'Turn advanced'),
    isGameRunning: vi.fn(() => true),
    isActRunning: vi.fn(() => true),
    isGameOver: vi.fn(() => false),
    getResultText: vi.fn(() => ''),
    getMusicInfo: vi.fn(() => ({
      musicFile: 'track.mp3',
      musicInfo: 'Track info',
    })),
    getCommandCompletions: vi.fn((): CompletionTree => ({})),
  }
}

type MockBridge = ReturnType<typeof createMockBridge>

describe('useGameStore', () => {
  let store: ReturnType<typeof useGameStore>
  let bridge: MockBridge

  beforeEach(() => {
    setActivePinia(createPinia())
    bridge = createMockBridge()
    store = useGameStore()
    store.setBridge(bridge as never)
  })

  // --- Initial state ---

  describe('initial state', () => {
    it('starts with loading true', () => {
      expect(store.loading).toBe(true)
    })

    it('has empty room data', () => {
      expect(store.roomName).toBe('')
      expect(store.roomDescription).toBe('')
      expect(store.characters).toEqual([])
      expect(store.items).toEqual([])
      expect(store.exits).toEqual({})
    })

    it('does not accept input initially', () => {
      expect(store.acceptInput).toBe(false)
    })

    it('has modal hidden', () => {
      expect(store.showModal).toBe(false)
      expect(store.modalTitle).toBe('')
      expect(store.modalBody).toBe('')
    })
  })

  // --- initGame ---

  describe('initGame', () => {
    it('calls bridge.init with progress callback', async () => {
      await store.initGame()
      expect(bridge.init).toHaveBeenCalledWith(expect.any(Function))
    })

    it('marks the load as failed when the engine cannot start', async () => {
      expect(store.loadFailed).toBe(false)
      const error = new Error('Network error')
      bridge.init.mockRejectedValue(error)
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.initGame()

      expect(log).toHaveBeenCalledWith(error)
      log.mockRestore()

      expect(store.loadFailed).toBe(true)
      expect(store.loading).toBe(true)
      expect(store.loadingStatus).toBe('Error: Network error')
    })

    it('sets loading to false after init', async () => {
      await store.initGame()
      expect(store.loading).toBe(false)
    })

    it('updates loadingStatus via progress callback', async () => {
      bridge.init.mockImplementation(async (cb: (s: string) => void) => {
        cb('Loading Python...')
      })
      await store.initGame()
      expect(store.loadingStatus).toBe('Loading Python...')
    })

    it('calls advanceTurn twice to advance through logo and act intro', async () => {
      await store.initGame()
      expect(bridge.advanceTurn).toHaveBeenCalledTimes(2)
    })

    it('shows act intro (second advanceTurn) in modal', async () => {
      bridge.advanceTurn
        .mockReturnValueOnce('Logo text')
        .mockReturnValueOnce('Act intro!')
      await store.initGame()
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('📖 Act Intro')
      expect(store.modalBody).toBe('<rendered>Act intro!</rendered>')
    })

    it('blocks acceptInput until intro modal is dismissed', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      expect(store.acceptInput).toBe(false)
    })

    it('restores acceptInput after intro modal is dismissed', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
      expect(store.acceptInput).toBe(true)
    })

    it('calls look() when intro modal is dismissed', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
      expect(bridge.look).toHaveBeenCalledTimes(1)
    })

    it('puts quests started by the first look in its turn', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      bridge.activateQuest
        .mockReturnValueOnce('[quest_name]Q (main quest)[/quest_name]\n\nGo.')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      await store.initGame()
      store.dismissModal() // dismiss intro → triggers look + pollQuestEvents
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        { kind: 'new', name: 'Q', main: true, text: 'Go.' },
      ])
    })

    it('lists quests started by the first look after the act intro', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      // As in the engine, the quest is listed once its activation was polled.
      let started = false
      bridge.activateQuest.mockImplementation(() => {
        if (started) return null
        started = true
        return '[quest_name]Q (main quest)[/quest_name]\n\nBegin.'
      })
      bridge.getActiveQuests.mockImplementation(() =>
        started
          ? [
              {
                name: '[quest_name]Q (main)[/quest_name]',
                description: 'Begin.',
              },
            ]
          : [],
      )
      bridge.getQuestProgress.mockImplementation(() => ({
        completed: 0,
        total: started ? 11 : 0,
        actNumber: 1,
        mainQuest: 'Q',
      }))

      store.dismissModal()

      expect(store.rawActiveQuests).toHaveLength(1)
      expect(store.questProgress?.total).toBe(11)
    })

    it('plays the chime for a quest started by the first look', async () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.isAcceptingInput.mockReturnValue(true)
      bridge.activateQuest
        .mockReturnValueOnce('Main quest started!')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      await store.initGame()
      store.dismissModal()
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
    })

    it('refreshes panels after init', async () => {
      await store.initGame()
      expect(store.roomName).toBe('Village Square')
      expect(store.characters).toEqual(['Mira'])
      expect(store.rawInventory).toEqual([
        { name: 'Sword', description: 'Sharp' },
      ])
    })

    it('acceptInput is false during init regardless of bridge state', async () => {
      bridge.isAcceptingInput.mockReturnValue(false)
      await store.initGame()
      expect(store.acceptInput).toBe(false)
    })
  })

  // --- submitCommand ---

  describe('submitCommand', () => {
    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // unlock input after intro modal
    })

    it('calls bridge.handleCommand with trimmed input', () => {
      store.submitCommand('  look  ')
      expect(bridge.handleCommand).toHaveBeenCalledWith('look')
    })

    it('refreshes panels after command', () => {
      bridge.getRoomName.mockReturnValue('Forest Path')
      store.submitCommand('go north')
      expect(store.roomName).toBe('Forest Path')
    })

    it('ignores empty commands', () => {
      store.submitCommand('')
      expect(bridge.handleCommand).not.toHaveBeenCalled()
    })

    it('ignores whitespace-only commands', () => {
      store.submitCommand('   ')
      expect(bridge.handleCommand).not.toHaveBeenCalled()
    })

    it('does nothing when acceptInput is false', () => {
      store.acceptInput = false
      store.submitCommand('look')
      expect(bridge.handleCommand).not.toHaveBeenCalled()
    })

    it('polls quest events after command', () => {
      bridge.activateQuest
        .mockReturnValueOnce('[quest_name]Q (side quest)[/quest_name]\n\nGo.')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.submitCommand('talk to mira')
      expect(store.turns.at(-1)!.quests?.[0]).toMatchObject({
        kind: 'new',
        name: 'Q',
      })
    })

    it('refreshes panels after quest completion to pick up newly unlocked exits', () => {
      // Simulate quest completion that unlocks exits (like HintOfMagicQuest.check_completion
      // calling cottage.can_leave(), which mutates the Python room object's exits dict).
      // First getRoomExits call (first refreshPanels inside submitCommand) returns empty.
      // Second call (a second refreshPanels after pollQuestEvents, with the fix) returns exits.
      bridge.getRoomExits
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ south: 'VegetableField', east: 'VillageSquare' })
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest
        .mockReturnValueOnce('Hint of Magic complete!')
        .mockReturnValueOnce(null)

      store.submitCommand('talk to grandmother')

      expect(store.exits).toEqual({
        south: 'VegetableField',
        east: 'VillageSquare',
      })
    })
  })

  // --- refreshPanels ---

  describe('refreshPanels', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('updates all room data', () => {
      bridge.getRoomName.mockReturnValue('Dungeon')
      bridge.getRoomDescription.mockReturnValue('Dark place.')
      bridge.getRoomCharacters.mockReturnValue(['Guard'])
      bridge.getRoomItems.mockReturnValue(['Key'])
      bridge.getRoomExits.mockReturnValue({ south: 'Exit' })
      store.refreshPanels()
      expect(store.roomName).toBe('Dungeon')
      expect(store.roomDescription).toBe('Dark place.')
      expect(store.characters).toEqual(['Guard'])
      expect(store.items).toEqual(['Key'])
      expect(store.exits).toEqual({ south: 'Exit' })
    })

    it('updates the bag, spells and quests as the bridge delivers them', () => {
      const potion = { name: '[item_name]Potion[/item_name]', description: '' }
      const fire = { name: '[spell_name]Fire[/spell_name]', description: '' }
      const questA = { name: '[quest_name]A[/quest_name]', description: 'Do A' }
      const questB = { name: '[quest_name]B[/quest_name]', description: 'Did' }
      bridge.getInventory.mockReturnValue([potion])
      bridge.getSpells.mockReturnValue([fire])
      bridge.getActiveQuests.mockReturnValue([questA])
      bridge.getCompletedQuests.mockReturnValue([questB])
      store.refreshPanels()
      expect(store.rawInventory).toEqual([potion])
      expect(store.bagEntries).toEqual([potion.name])
      expect(store.rawSpells).toEqual([fire])
      expect(store.spellEntries).toEqual([fire.name])
      expect(store.rawActiveQuests).toEqual([questA])
      expect(store.rawCompletedQuests).toEqual([questB])
    })

    it('syncs acceptInput', () => {
      bridge.isAcceptingInput.mockReturnValue(false)
      store.refreshPanels()
      expect(store.acceptInput).toBe(false)
    })
  })

  // --- saveGame / loadGame ---

  describe('saveGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.quickSaveGame and shows a notice', () => {
      store.saveGame()
      expect(bridge.quickSaveGame).toHaveBeenCalledOnce()
      expect(store.notice?.text).toBe('Game saved')
    })
  })

  describe('loadGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.quickLoadGame and shows a notice', () => {
      store.loadGame()
      expect(bridge.quickLoadGame).toHaveBeenCalledOnce()
      expect(store.notice?.text).toBe('Game loaded')
    })

    it('refreshes panels after loading', () => {
      bridge.getRoomName.mockReturnValue('Saved Room')
      store.loadGame()
      expect(store.roomName).toBe('Saved Room')
    })
  })

  // --- saveNamedGame / loadNamedGame ---

  describe('saveNamedGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.saveNamedGame and shows a notice', () => {
      store.saveNamedGame('before-boss')
      expect(bridge.saveNamedGame).toHaveBeenCalledWith('before-boss')
      expect(store.notice?.text).toBe('Game saved · before-boss')
    })
  })

  describe('loadNamedGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.loadNamedGame, shows a notice, and refreshes panels', () => {
      bridge.getRoomName.mockReturnValue('Boss Room')
      store.loadNamedGame('before-boss')
      expect(bridge.loadNamedGame).toHaveBeenCalledWith('before-boss')
      expect(store.notice?.text).toBe('Game loaded · before-boss')
      expect(store.roomName).toBe('Boss Room')
    })
  })

  describe('pollQuestEvents', () => {
    const done = (name: string) =>
      `[quest_name]${name} (side quest)[/quest_name]\n\nDone.`

    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // dismiss intro modal so quest modal tests start clean
    })

    it('puts an activated quest in the story, not in a pop-up', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest: Find the gem')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        { kind: 'new', name: 'Quest: Find the gem', main: false, text: '' },
      ])
    })

    it('shows modal for completed quest', () => {
      bridge.completeQuest
        .mockReturnValueOnce('Quest complete!')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('🏆 Quest Complete!')
      expect(store.modalBody).toBe('<rendered>Quest complete!</rendered>')
    })

    it('queues multiple completions and shows the first', () => {
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(done('B'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.modalQuest?.name).toBe('A')
    })

    it('dismissModal advances to next queued event', () => {
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(done('B'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.modalQuest?.name).toBe('B')
    })

    it('dismissModal hides modal when queue empty', () => {
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.showModal).toBe(false)
    })

    it('dismissModal restores acceptInput from bridge when last modal dismissed', () => {
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(null)
      bridge.isAcceptingInput.mockReturnValue(true)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.acceptInput).toBe(true)
    })

    it('dismissModal does not restore acceptInput while more modals remain', () => {
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(done('B'))
        .mockReturnValueOnce(null)
      bridge.isAcceptingInput.mockReturnValue(true)
      // Start with acceptInput false to detect an incorrect restore
      store.acceptInput = false
      store.pollQuestEvents()
      store.dismissModal() // B still in queue
      expect(store.showModal).toBe(true)
      expect(store.acceptInput).toBe(false)
    })

    it('does nothing when no events', () => {
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests ?? []).toEqual([])
      expect(store.questsHaveNew).toBe(false)
    })

    it('calls playNewQuest when a quest is activated', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('calls playNewQuest when a quest is updated', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.updateQuest
        .mockReturnValueOnce('Quest updated')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('calls playQuestComplete when a quest is completed', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.completeQuest
        .mockReturnValueOnce('Quest done!')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(audio.playNewQuest).not.toHaveBeenCalled()
    })

    it('plays the fanfare per pop-up shown, not all at once', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.completeQuest
        .mockReturnValueOnce(done('A'))
        .mockReturnValueOnce(done('B'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playQuestComplete).toHaveBeenCalledTimes(1)
      store.dismissModal()
      expect(audio.playQuestComplete).toHaveBeenCalledTimes(2)
    })

    it('does not call audio when no audio player is set', () => {
      // No setAudioPlayer call - should not throw
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.completeQuest
        .mockReturnValueOnce('Quest B')
        .mockReturnValueOnce(null)
      expect(() => store.pollQuestEvents()).not.toThrow()
    })
  })

  // --- getMusicInfo (returned from refreshPanels) ---

  describe('music info from refreshPanels', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('exposes musicFile and musicInfo', () => {
      expect(store.musicFile).toBe('track.mp3')
      expect(store.musicInfo).toBe('Track info')
    })

    it('updates on refresh', () => {
      bridge.getMusicInfo.mockReturnValue({
        musicFile: 'new.mp3',
        musicInfo: 'New info',
      })
      store.refreshPanels()
      expect(store.musicFile).toBe('new.mp3')
      expect(store.musicInfo).toBe('New info')
    })
  })

  // --- completionState ---

  describe('completionState', () => {
    beforeEach(async () => {
      bridge.getCommandCompletions.mockReturnValue({
        go: { north: null, south: null },
        take: { sword: null, shield: null },
        talk: { to: { mira: null } },
        look: { '@': null, at: { well: null }, well: null },
        use: { rope: { '@': null, with: { well: null } } },
        i: null,
        inventory: null,
        constructor: null,
      })
      await store.initGame()
    })

    it('lists the matches for the word being typed', () => {
      expect(store.completionState('ta')).toEqual({
        kind: 'matches',
        candidates: ['take', 'talk'],
        sendable: false,
        word: 'ta',
      })
    })

    it('lists the next words after a space', () => {
      const state = store.completionState('go ')
      expect(state.candidates).toEqual(['north', 'south'])
      expect(state.word).toBe('')
    })

    it('is sendable on a finished command that can go on, without offering @', () => {
      const state = store.completionState('look ')
      expect(state.kind).toBe('matches')
      expect(state.sendable).toBe(true)
      expect(state.candidates).toEqual(['at', 'well'])
      expect(store.completionState('use rope ').candidates).toEqual(['with'])
      expect(store.completionState('use rope ').sendable).toBe(true)
      expect(store.completionState('look').sendable).toBe(true)
    })

    it('is sendable but still lists longer matches for a leaf prefix', () => {
      const state = store.completionState('i')
      expect(state.sendable).toBe(true)
      expect(state.candidates).toEqual(['i', 'inventory'])
    })

    it('is complete when the command needs no more words', () => {
      expect(store.completionState('talk to mira').kind).toBe('complete')
      expect(store.completionState('talk to mira ').kind).toBe('complete')
      expect(store.completionState('inventory ').kind).toBe('complete')
      expect(store.completionState('inventory foo').kind).toBe('complete')
    })

    it('has no match for an unknown word, quoting the last word as typed', () => {
      expect(store.completionState('xyz')).toMatchObject({
        kind: 'none',
        candidates: [],
        word: 'xyz',
      })
      expect(store.completionState('talk to bob').word).toBe('bob')
      expect(store.completionState('fly high ').kind).toBe('none')
      expect(store.completionState('fly high ').word).toBe('high')
    })

    it('ignores case when matching', () => {
      expect(store.completionState('Ta').candidates).toEqual(['take', 'talk'])
      expect(store.completionState('Ta').word).toBe('Ta')
    })

    it('treats names like constructor as plain words', () => {
      expect(store.completionState('constructor').kind).toBe('complete')
      expect(store.completionState('go constructor').kind).toBe('none')
    })

    it('does not list @ as a candidate or expand past a sendable command in tabComplete', () => {
      expect(store.tabComplete('use rope ').candidates).toEqual(['with'])
      expect(store.tabComplete('use rope ').newInput).toBe('use rope ')
    })
  })

  // --- tabComplete ---

  describe('tabComplete', () => {
    beforeEach(async () => {
      bridge.getCommandCompletions.mockReturnValue({
        go: { north: null, south: null, east: null },
        take: { sword: null, shield: null },
        talk: { to: { mira: null } },
        inventory: null,
      })
      await store.initGame()
    })

    it('returns candidates for a top-level prefix with single match', () => {
      const result = store.tabComplete('inv')
      expect(result.candidates).toEqual(['inventory'])
    })

    it('auto-expands to single unambiguous match plus trailing space', () => {
      const result = store.tabComplete('inv')
      expect(result.newInput).toBe('inventory ')
    })

    it('returns all top-level candidates when prefix matches multiple', () => {
      const result = store.tabComplete('t')
      expect(result.candidates.sort()).toEqual(['take', 'talk'])
    })

    it('does not expand input when multiple candidates exist', () => {
      const result = store.tabComplete('t')
      expect(result.newInput).toBe('t')
    })

    it('returns empty candidates for unrecognised prefix', () => {
      const result = store.tabComplete('xyz')
      expect(result.candidates).toEqual([])
      expect(result.newInput).toBe('xyz')
    })

    it('returns sub-level candidates after fully typed token plus space', () => {
      const result = store.tabComplete('go ')
      expect(result.candidates.sort()).toEqual(['east', 'north', 'south'])
    })

    it('auto-expands sub-level prefix to single match', () => {
      const result = store.tabComplete('go n')
      expect(result.newInput).toBe('go north ')
      expect(result.candidates).toEqual(['north'])
    })

    it('traverses multiple levels and auto-expands chain of single options', () => {
      // talk -> to (only option) -> mira (only option): should expand fully
      const result = store.tabComplete('talk ')
      expect(result.newInput).toBe('talk to mira ')
    })

    it('returns empty when navigating into a leaf node (null value)', () => {
      const result = store.tabComplete('inventory ')
      expect(result.candidates).toEqual([])
      expect(result.newInput).toBe('inventory ')
    })

    it('returns empty when intermediate token is not in tree', () => {
      const result = store.tabComplete('fly ')
      expect(result.candidates).toEqual([])
    })

    it('completions refresh after submitCommand', () => {
      store.dismissModal() // unlock input
      bridge.getCommandCompletions.mockReturnValue({
        examine: null,
      })
      store.submitCommand('look')
      const result = store.tabComplete('ex')
      expect(result.candidates).toEqual(['examine'])
    })
  })

  // --- act transition ---

  describe('act transition', () => {
    function setupTransitionMocks() {
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.isActRunning.mockReturnValue(false)
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      bridge.advanceToRunning.mockReturnValue([
        'Congratulations Act 1!',
        'Act 2 begins.',
        '',
      ])
    }

    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // dismiss init intro modal
    })

    it('shows act transition modal immediately when command causes transition', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('🏆 Act Complete!')
      expect(store.modalBody).toBe(
        '<rendered>Congratulations Act 1!</rendered>',
      )
    })

    it('shows act intro modal after dismissing transition modal', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      store.dismissModal()
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('📖 Act Intro')
      expect(store.modalBody).toBe('<rendered>Act 2 begins.</rendered>')
    })

    it('fires look after all transition modals are dismissed', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      store.dismissModal() // dismiss transition modal
      bridge.look.mockReturnValue('You are in Act 2.')
      store.dismissModal() // dismiss intro modal
      expect(bridge.look).toHaveBeenCalled()
    })

    it('shows transition modal after quest completion modals when act transitions', () => {
      bridge.completeQuest
        .mockReturnValueOnce('Main quest complete!')
        .mockReturnValueOnce(null)
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.isActRunning.mockReturnValue(false)
      bridge.advanceToRunning.mockReturnValue([
        'Congratulations Act 1!',
        'Act 2 begins.',
        '',
      ])
      store.submitCommand('use map')
      expect(store.modalTitle).toBe('🏆 Quest Complete!')
      store.dismissModal()
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('🏆 Act Complete!')
    })

    it('does not trigger transition modals when act is running normally', () => {
      // isActRunning stays true (default), so no transition modals
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.submitCommand('look')
      expect(store.showModal).toBe(false)
      expect(bridge.advanceToRunning).not.toHaveBeenCalled()
    })
  })

  // --- getSaveSlots / saveToSlot / loadFromSlot ---

  describe('getSaveSlots', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('returns 8 slots from bridge', () => {
      const slots: SaveSlot[] = Array.from({ length: 8 }, (_, i) => ({
        slot: i + 1,
        act: null,
        room: null,
        timestamp: null,
        quests: null,
      }))
      bridge.getSaveSlots.mockReturnValue(slots)
      expect(store.getSaveSlots()).toHaveLength(8)
    })
  })

  describe('saveToSlot', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.saveToSlot and shows a notice', () => {
      store.saveToSlot(3)
      expect(bridge.saveToSlot).toHaveBeenCalledWith(3)
      expect(store.notice?.text).toBe('Game saved · Slot 3')
    })
  })

  describe('loadFromSlot', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.loadFromSlot, shows a notice, and refreshes panels', () => {
      bridge.getRoomName.mockReturnValue('Dungeon')
      store.loadFromSlot(2)
      expect(bridge.loadFromSlot).toHaveBeenCalledWith(2)
      expect(store.notice?.text).toBe('Game loaded · Slot 2')
      expect(store.roomName).toBe('Dungeon')
    })
  })

  // --- Turn log ---

  describe('turn log', () => {
    async function startPlaying() {
      await store.initGame()
      store.dismissModal() // act intro dismissed -> automatic look
    }

    it('starts empty', () => {
      expect(store.turns).toEqual([])
    })

    it('records the arrival look after the act intro as the first turn', async () => {
      await startPlaying()

      expect(store.turns).toEqual([
        {
          id: 1,
          command: null,
          text: 'You look around',
          room: 'Village Square',
          roomChanged: true,
          gained: [],
          lost: [],
          arrival: {
            room: 'Village Square',
            description: 'A quiet village.',
            characters: ['Mira'],
            items: ['Map'],
            exits: { north: 'Forest' },
          },
        },
      ])
    })

    it('records a command with its raw (unrendered) answer', async () => {
      await startPlaying()
      bridge.handleCommand.mockReturnValue(
        '[item_name]Bucket[/item_name] taken.',
      )

      store.submitCommand('  take bucket  ')

      expect(store.turns.at(-1)).toEqual({
        id: 2,
        command: 'take bucket',
        text: '[item_name]Bucket[/item_name] taken.',
        room: 'Village Square',
        roomChanged: false,
        gained: [],
        lost: [],
        arrival: null,
      })
    })

    it('marks a turn whose command moved the player to another room', async () => {
      await startPlaying()
      bridge.getRoomName.mockReturnValue('Forest Path')

      store.submitCommand('go north')

      expect(store.turns.at(-1)).toMatchObject({
        command: 'go north',
        room: 'Forest Path',
        roomChanged: true,
      })
    })

    it('does not record ignored commands', async () => {
      await startPlaying()

      store.submitCommand('   ')

      expect(store.turns).toHaveLength(1)
    })

    it('records loading a save as an arrival without a command', async () => {
      await startPlaying()
      bridge.getRoomName.mockReturnValue('Ancient Grove')

      store.loadFromSlot(3)

      expect(store.turns.at(-1)).toMatchObject({
        command: null,
        text: '',
        room: 'Ancient Grove',
        roomChanged: true,
      })
    })

    it('keeps the act-completing answer in the old room; arrival marks the new one', async () => {
      await startPlaying()
      // The command completes the act: the engine already holds the next act's state
      bridge.getRoomName.mockReturnValue('Act 2 Start')
      bridge.isActRunning.mockReturnValue(false)
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.advanceToRunning.mockReturnValue(['Act 1 done!', 'Act 2 begins.'])

      store.submitCommand('use map')

      expect(store.turns.at(-1)).toMatchObject({
        command: 'use map',
        room: 'Village Square',
        roomChanged: false,
      })

      bridge.isActRunning.mockReturnValue(true)
      bridge.look.mockReturnValue('You are in Act 2.')
      store.dismissModal() // act complete
      store.dismissModal() // act intro -> arrival look

      expect(store.turns.at(-1)).toMatchObject({
        command: null,
        text: 'You are in Act 2.',
        room: 'Act 2 Start',
        roomChanged: true,
      })
    })

    it(`keeps only the last ${MAX_TURNS} turns`, async () => {
      await startPlaying()

      for (let i = 0; i < MAX_TURNS + 5; i++) store.submitCommand(`wait ${i}`)

      expect(store.turns).toHaveLength(MAX_TURNS)
      expect(store.turns.at(-1)?.command).toBe(`wait ${MAX_TURNS + 4}`)
      expect(store.turns.at(-1)?.id).toBe(MAX_TURNS + 6)
    })
  })

  // --- Gained / lost chips ---

  describe('gained and lost chips', () => {
    async function startPlaying() {
      await store.initGame()
      store.dismissModal()
    }

    const named = (name: string) => ({ name, description: '' })

    it('shows no chips for the arrival, even with starting items', async () => {
      await startPlaying()

      expect(store.turns[0].gained).toEqual([])
      expect(store.turns[0].lost).toEqual([])
      expect(store.bagHasNew).toBe(false)
    })

    it('records items and spells gained by a command', async () => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([
        named('[item_name]Sword[/item_name]'),
        named('[item_name]Bucket[/item_name]'),
      ])
      bridge.getSpells.mockReturnValue([
        named('Heal'),
        named('[spell_name]Revive[/spell_name]'),
      ])

      store.submitCommand('take bucket')

      expect(store.turns.at(-1)?.gained).toEqual([
        { kind: 'item', name: 'Bucket', count: 1 },
        { kind: 'spell', name: 'Revive', count: 1 },
      ])
      expect(store.bagHasNew).toBe(true)
      expect(store.spellsHaveNew).toBe(true)
    })

    it('records items lost by a command without marking the bag new', async () => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([])

      store.submitCommand('give sword to mira')

      expect(store.turns.at(-1)?.lost).toEqual([
        { kind: 'item', name: 'Sword', count: 1 },
      ])
      expect(store.bagHasNew).toBe(false)
    })

    it('clears a tab dot once the tab has been seen', async () => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([named('Sword'), named('Map')])
      store.submitCommand('take map')

      store.markSeen('bag')

      expect(store.bagHasNew).toBe(false)
    })

    it('shows no chips when a save is loaded, and compares later turns with it', async () => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([named('Lantern'), named('Rope')])

      store.loadFromSlot(1)
      expect(store.turns.at(-1)?.gained).toEqual([])
      expect(store.bagHasNew).toBe(false)

      bridge.getInventory.mockReturnValue([named('Lantern')])
      store.submitCommand('drop rope')
      expect(store.turns.at(-1)?.lost).toEqual([
        { kind: 'item', name: 'Rope', count: 1 },
      ])
    })

    it.each([
      ['a quick save', () => store.loadGame()],
      ['a named save', () => store.loadNamedGame('Before boss')],
      ['a save slot', () => store.loadFromSlot(2)],
    ])('clears the tab dots when %s is loaded', async (_, load) => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([named('Sword'), named('Map')])
      bridge.getSpells.mockReturnValue([named('Heal'), named('Light')])
      store.submitCommand('take map')

      load()

      expect(store.bagHasNew).toBe(false)
      expect(store.spellsHaveNew).toBe(false)
    })

    it.each([
      ['a quick save', () => store.saveGame()],
      ['a named save', () => store.saveNamedGame('Before boss')],
      ['a save slot', () => store.saveToSlot(2)],
    ])('keeps the tab dots when %s is made', async (_, save) => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([named('Sword'), named('Map')])
      bridge.getSpells.mockReturnValue([named('Heal'), named('Light')])
      store.submitCommand('take map')

      save()

      expect(store.bagHasNew).toBe(true)
      expect(store.spellsHaveNew).toBe(true)
    })

    it('clears the tab dots when the act changes', async () => {
      await startPlaying()
      bridge.getInventory.mockReturnValue([named('Sword'), named('Map')])
      store.submitCommand('take map')
      bridge.isActRunning.mockReturnValue(false)

      store.submitCommand('use map')

      expect(store.bagHasNew).toBe(false)
    })

    it('shows no chips on the turn that ends an act', async () => {
      await startPlaying()
      bridge.isActRunning.mockReturnValue(false)
      bridge.getInventory.mockReturnValue([])

      store.submitCommand('give amulet to mira')

      expect(store.turns.at(-1)?.lost).toEqual([])
    })
  })

  // --- Typed save / load ---

  describe('typed save and load commands', () => {
    beforeEach(async () => {
      await store.initGame()
      store.dismissModal()
    })

    it('treats a typed "save" like Quick save', () => {
      const turns = store.turns.length

      store.submitCommand('  Save ')

      expect(bridge.quickSaveGame).toHaveBeenCalledTimes(1)
      expect(bridge.handleCommand).not.toHaveBeenCalled()
      expect(store.notice?.text).toBe('Game saved')
      expect(store.turns.length).toBe(turns)
    })

    it('treats a typed "load" like Quick load, without chips', () => {
      bridge.getInventory.mockReturnValue([
        { name: 'Lantern', description: '' },
      ])

      store.submitCommand('load')

      expect(bridge.quickLoadGame).toHaveBeenCalledTimes(1)
      expect(bridge.handleCommand).not.toHaveBeenCalled()
      expect(store.notice?.text).toBe('Game loaded')
      expect(store.turns.at(-1)).toMatchObject({
        command: null,
        text: '',
        gained: [],
        lost: [],
      })
    })

    it('routes "save <name>" and "load <name>" to the named saves', () => {
      store.submitCommand('save my-adventure')
      store.submitCommand('load my-adventure')

      expect(bridge.saveNamedGame).toHaveBeenCalledWith('my-adventure')
      expect(bridge.loadNamedGame).toHaveBeenCalledWith('my-adventure')
      expect(bridge.handleCommand).not.toHaveBeenCalled()
    })

    it('lowercases typed save names like the game does', () => {
      store.submitCommand('save My-Adventure')
      store.submitCommand('LOAD my-ADVENTURE')

      expect(bridge.saveNamedGame).toHaveBeenCalledWith('my-adventure')
      expect(bridge.loadNamedGame).toHaveBeenCalledWith('my-adventure')
    })

    it('leaves invalid save names to the game to reject', () => {
      store.submitCommand('save my adventure')
      store.submitCommand('load ../secret')

      expect(bridge.saveNamedGame).not.toHaveBeenCalled()
      expect(bridge.loadNamedGame).not.toHaveBeenCalled()
      expect(bridge.handleCommand).toHaveBeenCalledWith('save my adventure')
      expect(bridge.handleCommand).toHaveBeenCalledWith('load ../secret')
    })

    it('still sends other commands that start with save or load to the game', () => {
      store.submitCommand('saveguard the village')
      store.submitCommand('loadstone')

      expect(bridge.handleCommand).toHaveBeenCalledTimes(2)
    })
  })

  // --- Quest progress ---

  describe('quest progress', () => {
    it('is unknown before the game starts', () => {
      expect(store.questProgress).toBeNull()
    })

    it('is refreshed with the panels', async () => {
      await store.initGame()

      expect(store.questProgress).toEqual({
        completed: 4,
        total: 11,
        actNumber: 1,
        mainQuest: 'Shadows Over Willowbrook',
      })

      bridge.getQuestProgress.mockReturnValue({
        completed: 5,
        total: 11,
        actNumber: 1,
        mainQuest: 'Shadows Over Willowbrook',
      })
      store.dismissModal()
      store.submitCommand('give amulet to mira')
      expect(store.questProgress?.completed).toBe(5)
    })
  })

  // --- Arrival snapshot ---

  describe('arrival snapshot', () => {
    beforeEach(async () => {
      await store.initGame()
      store.dismissModal()
    })

    it('captures the new room when a command moves the player', () => {
      bridge.getRoomName.mockReturnValue('Vegetable Field')
      bridge.getRoomDescription.mockReturnValue('Rows of withered crops.')
      bridge.getRoomCharacters.mockReturnValue([])
      bridge.getRoomItems.mockReturnValue(['rusty hoe', 'dull knife'])
      bridge.getRoomExits.mockReturnValue({
        north: "Elior's Cottage",
        south: 'Chicken Coop',
      })

      store.submitCommand('go south')

      expect(store.turns.at(-1)?.arrival).toEqual({
        room: 'Vegetable Field',
        description: 'Rows of withered crops.',
        characters: [],
        items: ['rusty hoe', 'dull knife'],
        exits: { north: "Elior's Cottage", south: 'Chicken Coop' },
      })
    })

    it('keeps the snapshot even after the room changes again', () => {
      bridge.getRoomName.mockReturnValue('Vegetable Field')
      bridge.getRoomDescription.mockReturnValue('Rows of withered crops.')
      store.submitCommand('go south')
      const field = store.turns.length - 1

      bridge.getRoomName.mockReturnValue('Chicken Coop')
      bridge.getRoomDescription.mockReturnValue('A noisy coop.')
      store.submitCommand('go south')

      expect(store.turns[field].arrival?.description).toBe(
        'Rows of withered crops.',
      )
      expect(store.turns.at(-1)?.arrival?.room).toBe('Chicken Coop')
    })

    it('has no arrival when the player stays in the same room', () => {
      store.submitCommand('look at map')

      expect(store.turns.at(-1)?.arrival).toBeNull()
    })
  })

  // --- Room wares ---

  describe('room wares', () => {
    it('are refreshed with the panels', async () => {
      bridge.getRoomWares.mockReturnValue([
        { name: 'rope', price: 1, seller: 'shopkeeper' },
      ])

      await store.initGame()

      expect(store.roomWares).toEqual([
        { name: 'rope', price: 1, seller: 'shopkeeper' },
      ])
    })
  })

  // --- Raw names for the action composer ---

  describe('raw bag and spell names', () => {
    it('keep the bridge names (unrendered) for building commands', async () => {
      bridge.getInventory.mockReturnValue([
        { name: '[item_name]2 apple[/item_name]', description: '' },
      ])
      bridge.getSpells.mockReturnValue([
        { name: '[spell_name]revive[/spell_name]', description: '' },
      ])

      await store.initGame()

      expect(store.bagEntries).toEqual(['[item_name]2 apple[/item_name]'])
      expect(store.spellEntries).toEqual(['[spell_name]revive[/spell_name]'])
    })
  })

  // --- Raw journal data ---

  describe('raw journal data', () => {
    it('keeps bag, spells and quests as the bridge delivers them', async () => {
      bridge.getInventory.mockReturnValue([
        { name: '[item_name]bread[/item_name]', description: 'A small loaf.' },
      ])
      bridge.getActiveQuests.mockReturnValue([
        {
          name: '[quest_name]Q (main)[/quest_name]',
          description: '[dim]Old[/dim]',
        },
      ])
      bridge.getCompletedQuests.mockReturnValue([
        { name: '[quest_name]Done (side)[/quest_name]', description: 'Fin.' },
      ])

      await store.initGame()

      expect(store.rawInventory).toEqual([
        { name: '[item_name]bread[/item_name]', description: 'A small loaf.' },
      ])
      expect(store.rawActiveQuests[0].description).toBe('[dim]Old[/dim]')
      expect(store.rawCompletedQuests[0].name).toBe(
        '[quest_name]Done (side)[/quest_name]',
      )
      expect(store.rawSpells).toEqual([
        { name: 'Heal', description: 'Restores HP' },
      ])
    })
  })

  // --- Quest news in the story (Lantern) ---

  describe('quest news in the story', () => {
    const NEW =
      '[quest_name]Hint of Magic (side quest)[/quest_name]\n\nA force stirs.'
    const UPDATED =
      '[quest_name]Shadows (main quest)[/quest_name]\n\n[dim]Old.[/dim]\nNew.'

    beforeEach(async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
    })

    it('adds new and updated quests to the turn instead of a pop-up', () => {
      bridge.activateQuest.mockReturnValueOnce(NEW).mockReturnValue(null)
      bridge.updateQuest.mockReturnValueOnce(UPDATED).mockReturnValue(null)

      store.submitCommand('look')

      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        {
          kind: 'new',
          name: 'Hint of Magic',
          main: false,
          text: 'A force stirs.',
        },
        { kind: 'updated', name: 'Shadows', main: true, text: 'New.' },
      ])
    })

    it('plays the chime once for the news of a turn', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest.mockReturnValueOnce(NEW).mockReturnValue(null)
      bridge.updateQuest.mockReturnValueOnce(UPDATED).mockReturnValue(null)

      store.submitCommand('look')

      expect(audio.playNewQuest).toHaveBeenCalledOnce()
    })

    it('gives the completion pop-up the quest it is about', () => {
      bridge.completeQuest
        .mockReturnValueOnce(
          '[quest_name]Hint of Magic (side quest)[/quest_name]\n\nIt begins.',
        )
        .mockReturnValue(null)
      bridge.getQuestProgress.mockReturnValue({
        completed: 5,
        total: 11,
        actNumber: 1,
        mainQuest: 'Shadows',
      })

      store.submitCommand('talk to grandmother')

      expect(store.modalQuest).toEqual({
        kind: 'completed',
        name: 'Hint of Magic',
        main: false,
        text: 'It begins.',
        progress: { completed: 5, total: 11 },
      })
      store.dismissModal()
      expect(store.modalQuest).toBe(null)
    })

    it('lets the fanfare alone mark a turn that also completes a quest', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest.mockReturnValueOnce(NEW).mockReturnValue(null)
      bridge.completeQuest
        .mockReturnValueOnce('[quest_name]Q (side quest)[/quest_name]\n\nDone.')
        .mockReturnValue(null)

      store.submitCommand('talk to grandmother')

      expect(audio.playNewQuest).not.toHaveBeenCalled()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(store.turns.at(-1)!.quests!.map((q) => q.kind)).toEqual([
        'new',
        'completed',
      ])
    })

    it('keeps each completion in the story with its quest count', () => {
      const done = (name: string) =>
        `[quest_name]${name} (side quest)[/quest_name]\n\nWell done.`
      bridge.completeQuest
        .mockReturnValueOnce(done('First'))
        .mockReturnValueOnce(done('Second'))
        .mockReturnValue(null)
      bridge.getQuestProgress.mockReturnValue({
        completed: 5,
        total: 11,
        actNumber: 1,
        mainQuest: 'Shadows',
      })

      store.submitCommand('give flower to mira')

      expect(store.turns.at(-1)!.quests).toEqual([
        {
          kind: 'completed',
          name: 'First',
          main: false,
          text: 'Well done.',
          progress: { completed: 4, total: 11 },
        },
        {
          kind: 'completed',
          name: 'Second',
          main: false,
          text: 'Well done.',
          progress: { completed: 5, total: 11 },
        },
      ])
    })

    it('still shows a pop-up when a quest completes', () => {
      bridge.completeQuest
        .mockReturnValueOnce('[quest_name]Q (side quest)[/quest_name]\n\nDone.')
        .mockReturnValue(null)

      store.submitCommand('look')

      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('🏆 Quest Complete!')
    })

    it('puts a dot on the Quests tab until it is seen', () => {
      bridge.activateQuest.mockReturnValueOnce(NEW).mockReturnValue(null)

      store.submitCommand('look')
      expect(store.questsHaveNew).toBe(true)

      store.markSeen('quests')
      expect(store.questsHaveNew).toBe(false)
    })

    it('asks the journal to open a quest', () => {
      store.openQuestInJournal('Hint of Magic')

      expect(store.questToOpen).toBe('Hint of Magic')
    })

    it('leaves turns without news empty', () => {
      store.submitCommand('look')

      expect(store.turns.at(-1)!.quests ?? []).toEqual([])
    })
  })

  // --- Chapter pages (Lantern) ---

  describe('chapter pages', () => {
    const INTRO_1 =
      '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\nYou are Elior.'
    const INTRO_2 = '[bold]ACT 2: THE GATHERING STORM[/bold]\n\nGreendale.'
    const STATS = {
      questsCompleted: 10,
      questsTotal: 11,
      spells: 4,
      places: 15,
    }

    beforeEach(() => {
      bridge.advanceTurn
        .mockReturnValueOnce('LOGO')
        .mockReturnValueOnce(INTRO_1)
    })

    it('opens the game with the first act as a chapter', async () => {
      await store.initGame()

      expect(store.modalChapter).toEqual({
        kind: 'intro',
        act: 'Act I',
        title: 'The Call to Adventure',
        body: 'You are Elior.',
      })
    })

    it('closes an act with its numbers, then opens the next', async () => {
      await store.initGame()
      store.dismissModal()
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.isActRunning.mockReturnValue(false)
      bridge.getActStats.mockReturnValue(STATS)
      bridge.advanceToRunning.mockReturnValue([
        'The map aligns.\n\nCongratulations — you have completed Act 1!',
        INTRO_2,
      ])

      store.submitCommand('use map')

      expect(store.modalChapter).toEqual({
        kind: 'complete',
        act: 'Act I',
        title: 'The Call to Adventure',
        body: 'Congratulations — you have completed Act 1!',
        stats: STATS,
        nextAct: 'Act II',
      })
      // The finished act's numbers are read before the next act starts.
      expect(bridge.getActStats.mock.invocationCallOrder[0]).toBeLessThan(
        bridge.advanceToRunning.mock.invocationCallOrder[0],
      )
      store.dismissModal()
      expect(store.modalChapter).toMatchObject({
        kind: 'intro',
        act: 'Act II',
        title: 'The Gathering Storm',
      })
    })

    it.each([
      ['a quick load', (s: typeof store) => s.loadGame()],
      ['a named load', (s: typeof store) => s.loadNamedGame('act2')],
      ['a slot load', (s: typeof store) => s.loadFromSlot(1)],
    ])('closes the act of %s with its own title', async (_, load) => {
      await store.initGame()
      store.dismissModal()
      bridge.getActIntro.mockReturnValue(INTRO_2)
      load(store)
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.isActRunning.mockReturnValue(false)
      bridge.advanceToRunning.mockReturnValue([
        'Congratulations — you have completed Act 2!',
        '[bold]ACT III: THE AWAKENING[/bold]\n\nText.',
      ])

      store.submitCommand('use orb')

      expect(store.modalChapter).toMatchObject({
        kind: 'complete',
        act: 'Act II',
        title: 'The Gathering Storm',
        nextAct: 'Act III',
      })
    })

    it('goes on from any chapter but the last as before', async () => {
      await store.initGame()
      expect(store.modalChapter).toMatchObject({ kind: 'intro' })

      store.continueChapter()

      expect(store.finishAsked).toBe(false)
      expect(store.modalChapter).toBe(null)
      expect(bridge.look).toHaveBeenCalled()
    })

    it('has no chapter for a quest pop-up', async () => {
      await store.initGame()
      store.dismissModal()
      bridge.completeQuest
        .mockReturnValueOnce('[quest_name]Q (side quest)[/quest_name]\n\nDone.')
        .mockReturnValue(null)

      store.submitCommand('look')

      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toBe(null)
    })
  })

  // --- Save / load notices (Lantern) ---

  describe('save and load notices', () => {
    beforeEach(async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
    })

    it('shows a saved game as a notice, not in the story', () => {
      const turns = store.turns.length

      store.submitCommand('save')

      expect(store.notice?.text).toBe('Game saved')
      expect(store.turns.length).toBe(turns)
    })

    it('names the slot or the save', () => {
      store.saveToSlot(2)
      expect(store.notice?.text).toBe('Game saved · Slot 2')

      store.submitCommand('save morning')
      expect(store.notice?.text).toBe('Game saved · morning')
    })

    it('gives each notice its own id, so the same one shows again', () => {
      store.saveToSlot(2)
      const first = store.notice?.id
      store.saveToSlot(2)

      expect(store.notice?.id).not.toBe(first)
    })

    it('shows a load as a notice and the room in the story', () => {
      store.loadFromSlot(3)

      expect(store.notice?.text).toBe('Game loaded · Slot 3')
      const turn = store.turns.at(-1)!
      expect(turn.text).toBe('')
      expect(turn.arrival?.room).toBe('Village Square')
    })

    it('keeps a failed load in the story', () => {
      bridge.quickLoadGame.mockReturnValue(
        '[failure]No save file found.[/failure]',
      )

      store.submitCommand('load')

      expect(store.notice).toBe(null)
      expect(store.turns.at(-1)!.text).toBe(
        '[failure]No save file found.[/failure]',
      )
    })

    it('keeps a failed save in the story', () => {
      bridge.quickSaveGame.mockReturnValue('[failure]Could not save.[/failure]')

      store.submitCommand('save')

      expect(store.notice).toBe(null)
      expect(store.turns.at(-1)).toMatchObject({
        command: 'save',
        text: '[failure]Could not save.[/failure]',
      })
    })
  })

  describe('stats and help', () => {
    it('reads the engine text without adding to the story', async () => {
      bridge.readCommand.mockReturnValue('[bold]Current Room:[/bold] Square')
      await store.initGame()
      const turns = store.turns.length

      expect(store.readInfo('stats')).toBe('[bold]Current Room:[/bold] Square')
      expect(bridge.readCommand).toHaveBeenCalledWith('stats')
      expect(store.turns.length).toBe(turns)
    })
  })

  it('tells about the quick save', async () => {
    const quick = {
      slot: 0,
      act: 'Act 1',
      room: 'Square',
      timestamp: 't',
      quests: { completed: 2, total: 11 },
    }
    bridge.getQuickSave.mockReturnValue(quick)
    await store.initGame()

    expect(store.getQuickSave()).toEqual(quick)
  })

  describe('quit', () => {
    beforeEach(async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
    })

    it('asks before quitting', () => {
      bridge.handleCommand.mockClear()

      store.submitCommand('quit')
      expect(store.quitAsked).toBe(true)
      store.quitAsked = false
      store.submitCommand('EXIT')
      expect(store.quitAsked).toBe(true)
      expect(bridge.handleCommand).not.toHaveBeenCalled()
    })

    it('starts again from Act I', () => {
      store.submitCommand('look')
      store.bagHasNew = true
      store.quitAsked = true
      bridge.advanceTurn
        .mockReturnValueOnce('LOGO')
        .mockReturnValueOnce(
          '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\nYou are Elior.',
        )

      store.restartGame()

      expect(bridge.newGame).toHaveBeenCalledOnce()
      expect(store.gameNumber).toBe(1)
      expect(store.quitAsked).toBe(false)
      expect(store.turns).toEqual([])
      expect(store.bagHasNew).toBe(false)
      expect(store.modalChapter).toMatchObject({ kind: 'intro', act: 'Act I' })
      expect(store.acceptInput).toBe(false)
    })
  })

  describe('game over', () => {
    const INTRO_4 = '[bold]ACT 4: THE LONG NIGHT ENDS[/bold]\n\nThe fortress.'
    const STATS = {
      questsCompleted: 6,
      questsTotal: 6,
      spells: 14,
      places: 18,
    }
    const CLOSING =
      'The realm breathes again.\n\nCongratulations — you have completed ' +
      'Act 4, the final act of RetroQuest!\n'

    beforeEach(async () => {
      bridge.advanceTurn
        .mockReturnValueOnce('LOGO')
        .mockReturnValueOnce(INTRO_4)
      await store.initGame()
      store.dismissModal()
      bridge.getActStats.mockReturnValue(STATS)
      bridge.getResultText.mockReturnValue(CLOSING)
    })

    /** The command that completes the last act. */
    function finishLastAct(): void {
      bridge.handleCommand.mockReturnValue('The realm breathes again.')
      bridge.isAcceptingInput.mockReturnValue(false)
      bridge.isActRunning.mockReturnValue(false)
      bridge.isGameOver.mockReturnValue(true)
      store.submitCommand('use crown')
    }

    const FINAL_CHAPTER = {
      kind: 'complete',
      act: 'Act IV',
      title: 'The Long Night Ends',
      body: 'Congratulations — you have completed Act 4, the final act of RetroQuest!',
      stats: STATS,
      final: true,
    }

    it('closes the last act with a final chapter page', () => {
      finishLastAct()
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      expect(bridge.advanceToRunning).not.toHaveBeenCalled()
    })

    it('shows the final chapter after the last quest pop-up', () => {
      bridge.completeQuest
        .mockReturnValueOnce('[quest_name]Q (main quest)[/quest_name]\n\nDone.')
        .mockReturnValue(null)
      finishLastAct()
      expect(store.modalQuest).not.toBe(null)
      store.dismissModal()
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      expect(bridge.advanceToRunning).not.toHaveBeenCalled()
    })

    it('keeps the story room and chips of the command that ended the game', () => {
      bridge.getInventory
        .mockReturnValueOnce([{ name: 'Sword', description: '' }])
        .mockReturnValue([
          { name: 'Sword', description: '' },
          { name: '[item_name]Crown[/item_name]', description: '' },
        ])
      store.refreshPanels()
      finishLastAct()
      const turn = store.turns.at(-1)!
      expect(turn.room).toBe('Village Square')
      expect(turn.gained.length).toBeGreaterThan(0)
    })

    it('asks to save on the final chapter instead of going on', () => {
      finishLastAct()
      store.continueChapter()
      expect(store.finishAsked).toBe(true)
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      store.cancelFinish()
      expect(store.finishAsked).toBe(false)
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      expect(store.ending).toBe(null)
    })

    it('saves to the quick slot and ends the game', () => {
      finishLastAct()
      store.continueChapter()
      bridge.quickSaveGame.mockClear()
      expect(store.finishGame(true)).toBe(true)
      expect(bridge.quickSaveGame).toHaveBeenCalledOnce()
      expect(store.ending).toEqual({
        text: 'The realm breathes again.',
        saved: true,
      })
      expect(store.finishAsked).toBe(false)
      expect(store.showModal).toBe(false)
      expect(store.modalChapter).toBe(null)
      expect(store.notice).toBe(null)
    })

    it('keeps the dialog open when the save fails', () => {
      finishLastAct()
      store.continueChapter()
      const turns = store.turns.length
      bridge.quickSaveGame.mockReturnValue('[failure]Could not save.[/failure]')
      expect(store.finishGame(true)).toBe(false)
      expect(store.ending).toBe(null)
      expect(store.finishAsked).toBe(true)
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      expect(store.turns.length).toBe(turns)
    })

    it('ends the game without saving', () => {
      finishLastAct()
      store.continueChapter()
      bridge.quickSaveGame.mockClear()
      expect(store.finishGame(false)).toBe(true)
      expect(bridge.quickSaveGame).not.toHaveBeenCalled()
      expect(store.ending).toEqual({
        text: 'The realm breathes again.',
        saved: false,
      })
    })

    it('starts afresh after a restart', () => {
      finishLastAct()
      store.continueChapter()
      store.finishGame(false)
      bridge.advanceTurn
        .mockReturnValueOnce('LOGO')
        .mockReturnValueOnce(INTRO_4)
      store.restartGame()
      expect(store.ending).toBe(null)
      expect(store.finishAsked).toBe(false)
    })
  })

  describe('save results', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('tells whether a save worked', () => {
      expect(store.saveGame()).toBe(true)
      expect(store.saveToSlot(2)).toBe(true)

      bridge.quickSaveGame.mockReturnValue('[failure]Could not save.[/failure]')
      bridge.saveToSlot.mockReturnValue('[failure]Could not save.[/failure]')
      expect(store.saveGame()).toBe(false)
      expect(store.saveToSlot(2)).toBe(false)
    })
  })

  describe('title page', () => {
    it('opens the game on its title before Act I', async () => {
      bridge.advanceTurn
        .mockReturnValueOnce('Welcome LOGO')
        .mockReturnValueOnce(
          '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\nYou are Elior.',
        )

      await store.initGame()

      expect(store.showTitle).toBe(true)
      expect(store.titleText).toBe('Welcome LOGO')
      store.dismissTitle()
      expect(store.showTitle).toBe(false)
      expect(store.modalChapter).toMatchObject({ kind: 'intro', act: 'Act I' })
    })
  })

  it('keeps the short names of the items around', async () => {
    bridge.getShortNames.mockReturnValue({ journal: "Elior's Journal" })

    await store.initGame()

    expect(store.shortNames).toEqual({ journal: "Elior's Journal" })
  })
})

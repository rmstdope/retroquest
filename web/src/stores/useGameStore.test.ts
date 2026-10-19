import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore, MAX_TURNS } from './useGameStore'
import { renderMarkup } from '@/utils/theme'
import type { CompletionTree, NamedSave, SaveSlot } from '@/types/bridge'

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
    listNamedSaves: vi.fn((): NamedSave[] => []),
    getActName: vi.fn(() => 'Act 1'),
    getQuestProgress: vi.fn(() => ({
      completed: 4,
      total: 11,
      actNumber: 1,
      mainQuest: 'Shadows Over Willowbrook',
    })),
    getSaveSlots: vi.fn((): SaveSlot[] => [
      ...Array.from({ length: 8 }, (_, i) => ({
        slot: i + 1,
        act: null,
        room: null,
        timestamp: null,
      })),
    ]),
    saveToSlot: vi.fn(() => 'Game saved.'),
    loadFromSlot: vi.fn(() => 'Game loaded.'),
    isAcceptingInput: vi.fn(() => true),
    advanceTurn: vi.fn(() => 'Turn advanced'),
    isGameRunning: vi.fn(() => true),
    isActRunning: vi.fn(() => true),
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

    it('has empty panel data', () => {
      expect(store.inventory).toEqual([])
      expect(store.spells).toEqual([])
      expect(store.activeQuests).toEqual([])
      expect(store.completedQuests).toEqual([])
    })

    it('has empty output', () => {
      expect(store.lastOutput).toBe('')
      expect(store.introText).toBe('')
    })

    it('does not accept input initially', () => {
      expect(store.acceptInput).toBe(false)
    })

    it('has sidebar sections visible by default', () => {
      expect(store.showActiveQuests).toBe(true)
      expect(store.showCompletedQuests).toBe(false)
      expect(store.showInventory).toBe(true)
      expect(store.showSpells).toBe(true)
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

    it('stores logo text (first advanceTurn) in introText', async () => {
      bridge.advanceTurn
        .mockReturnValueOnce('Logo text')
        .mockReturnValueOnce('Act intro!')
      await store.initGame()
      expect(store.introText).toBe('<rendered>Logo text</rendered>')
    })

    it('renders intro text from first advanceTurn call', async () => {
      bridge.advanceTurn.mockReturnValue('Welcome!')
      await store.initGame()
      expect(store.introText).toBe('<rendered>Welcome!</rendered>')
      expect(renderMarkup).toHaveBeenCalledWith('Welcome!')
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

    it('shows look() result as lastOutput when intro modal is dismissed', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      bridge.look.mockReturnValue('You see rolling hills.')
      await store.initGame()
      store.dismissModal()
      expect(store.lastOutput).toBe(
        '<rendered>You see rolling hills.</rendered>',
      )
    })

    it('polls quest events after intro modal is dismissed', async () => {
      bridge.isAcceptingInput.mockReturnValue(true)
      bridge.activateQuest
        .mockReturnValueOnce('Main quest started!')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      await store.initGame()
      store.dismissModal() // dismiss intro → triggers look + pollQuestEvents
      // intro modal is replaced by quest modal
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('📜 New Quest!')
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
        total: 11,
        actNumber: 1,
        mainQuest: started ? 'Q' : null,
      }))

      store.dismissModal()

      expect(store.rawActiveQuests).toHaveLength(1)
      expect(store.questProgress?.mainQuest).toBe('Q')
    })

    it('plays sound for quest modal shown after act intro is dismissed', async () => {
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
      expect(store.showModal).toBe(true)
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
    })

    it('refreshes panels after init', async () => {
      await store.initGame()
      expect(store.roomName).toBe('Village Square')
      expect(store.characters).toEqual(['Mira'])
      expect(store.inventory).toEqual([
        {
          name: '<rendered>Sword</rendered>',
          description: '<rendered>Sharp</rendered>',
        },
      ])
    })

    it('acceptInput is false during init regardless of bridge state', async () => {
      bridge.isAcceptingInput.mockReturnValue(false)
      await store.initGame()
      expect(store.acceptInput).toBe(false)
    })

    it('sets loadingStatus to error on failure', async () => {
      bridge.init.mockRejectedValue(new Error('Network error'))
      await store.initGame()
      expect(store.loadingStatus).toBe('Error: Network error')
      expect(store.loading).toBe(true)
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

    it('updates lastOutput with rendered result', () => {
      bridge.handleCommand.mockReturnValue('You see a forest.')
      store.submitCommand('look')
      expect(store.lastOutput).toBe('<rendered>You see a forest.</rendered>')
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
        .mockReturnValueOnce('New quest activated!')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.submitCommand('talk to mira')
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('📜 New Quest!')
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

  // --- advanceTurn ---

  describe('advanceTurn', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.advanceTurn and renders output', () => {
      bridge.advanceTurn.mockReturnValue('Act 2 begins...')
      store.advanceTurn()
      expect(store.lastOutput).toBe('<rendered>Act 2 begins...</rendered>')
    })

    it('refreshes panels', () => {
      bridge.getRoomName.mockReturnValue('Castle Gate')
      store.advanceTurn()
      expect(store.roomName).toBe('Castle Gate')
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

    it('updates inventory and spells', () => {
      bridge.getInventory.mockReturnValue([
        { name: 'Potion', description: 'Heals' },
      ])
      bridge.getSpells.mockReturnValue([{ name: 'Fire', description: 'Burns' }])
      store.refreshPanels()
      expect(store.inventory).toEqual([
        {
          name: '<rendered>Potion</rendered>',
          description: '<rendered>Heals</rendered>',
        },
      ])
      expect(store.spells).toEqual([
        {
          name: '<rendered>Fire</rendered>',
          description: '<rendered>Burns</rendered>',
        },
      ])
    })

    it('updates quests', () => {
      bridge.getActiveQuests.mockReturnValue([
        { name: 'Quest A', description: 'Do A' },
      ])
      bridge.getCompletedQuests.mockReturnValue([
        { name: 'Quest B', description: 'Did B' },
      ])
      store.refreshPanels()
      expect(store.activeQuests).toEqual([
        {
          name: '<rendered>Quest A</rendered>',
          description: '<rendered>Do A</rendered>',
        },
      ])
      expect(store.completedQuests).toEqual([
        {
          name: '<rendered>Quest B</rendered>',
          description: '<rendered>Did B</rendered>',
        },
      ])
    })

    it('applies renderMarkup to quest names containing engine markup', () => {
      bridge.getActiveQuests.mockReturnValue([
        {
          name: '[quest_name]Shadows Over Willowbrook (main)[/quest_name]',
          description: 'Stop the shadows.',
        },
      ])
      store.refreshPanels()
      expect(store.activeQuests[0].name).toBe(
        '<rendered>[quest_name]Shadows Over Willowbrook (main)[/quest_name]</rendered>',
      )
    })

    it('applies renderMarkup to inventory item names and descriptions', () => {
      bridge.getInventory.mockReturnValue([
        { name: '[item_name]Sword[/item_name]', description: 'Sharp blade.' },
      ])
      store.refreshPanels()
      expect(store.inventory[0].name).toBe(
        '<rendered>[item_name]Sword[/item_name]</rendered>',
      )
      expect(store.inventory[0].description).toBe(
        '<rendered>Sharp blade.</rendered>',
      )
    })

    it('applies renderMarkup to spell names and descriptions', () => {
      bridge.getSpells.mockReturnValue([
        { name: '[spell_name]Fireball[/spell_name]', description: 'Burns.' },
      ])
      store.refreshPanels()
      expect(store.spells[0].name).toBe(
        '<rendered>[spell_name]Fireball[/spell_name]</rendered>',
      )
      expect(store.spells[0].description).toBe('<rendered>Burns.</rendered>')
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

    it('calls bridge.quickSaveGame and renders output', () => {
      bridge.quickSaveGame.mockReturnValue('Saved!')
      store.saveGame()
      expect(store.lastOutput).toBe('<rendered>Saved!</rendered>')
    })
  })

  describe('loadGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.quickLoadGame and renders output', () => {
      bridge.quickLoadGame.mockReturnValue('Loaded!')
      store.loadGame()
      expect(store.lastOutput).toBe('<rendered>Loaded!</rendered>')
    })

    it('refreshes panels after loading', () => {
      bridge.getRoomName.mockReturnValue('Saved Room')
      store.loadGame()
      expect(store.roomName).toBe('Saved Room')
    })
  })

  // --- saveNamedGame / loadNamedGame / listNamedSaves ---

  describe('saveNamedGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.saveNamedGame and renders output', () => {
      bridge.saveNamedGame.mockReturnValue('Game saved as "Before boss".')
      store.saveNamedGame('Before boss')
      expect(bridge.saveNamedGame).toHaveBeenCalledWith('Before boss')
      expect(store.lastOutput).toBe(
        '<rendered>Game saved as "Before boss".</rendered>',
      )
    })
  })

  describe('loadNamedGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.loadNamedGame, renders output, and refreshes panels', () => {
      bridge.loadNamedGame.mockReturnValue('Game loaded.')
      bridge.getRoomName.mockReturnValue('Boss Room')
      store.loadNamedGame('Before boss')
      expect(bridge.loadNamedGame).toHaveBeenCalledWith('Before boss')
      expect(store.lastOutput).toBe('<rendered>Game loaded.</rendered>')
      expect(store.roomName).toBe('Boss Room')
    })
  })

  describe('listNamedSaves', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('returns saves from bridge', () => {
      const saves = [{ name: 'Save 1', timestamp: '2024-01-01T00:00:00.000Z' }]
      bridge.listNamedSaves.mockReturnValue(saves)
      expect(store.listNamedSaves()).toEqual(saves)
    })

    it('returns empty array when no saves exist', () => {
      bridge.listNamedSaves.mockReturnValue([])
      expect(store.listNamedSaves()).toEqual([])
    })
  })

  describe('pollQuestEvents', () => {
    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // dismiss intro modal so quest modal tests start clean
    })

    it('shows modal for activated quest', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest: Find the gem')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(true)
      expect(store.modalTitle).toBe('📜 New Quest!')
      expect(store.modalBody).toBe('<rendered>Quest: Find the gem</rendered>')
    })

    it('shows modal for updated quest', () => {
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest
        .mockReturnValueOnce('Quest updated: progress')
        .mockReturnValueOnce(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(store.modalTitle).toBe('📜 Quest Updated')
    })

    it('shows modal for completed quest', () => {
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest
        .mockReturnValueOnce('Quest complete!')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.modalTitle).toBe('🏆 Quest Complete!')
    })

    it('queues multiple events and shows first', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce('Quest B')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(store.modalTitle).toBe('📜 New Quest!')
      expect(store.modalBody).toBe('<rendered>Quest A</rendered>')
    })

    it('dismissModal advances to next queued event', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce('Quest B')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.modalBody).toBe('<rendered>Quest B</rendered>')
    })

    it('dismissModal hides modal when queue empty', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.showModal).toBe(false)
    })

    it('dismissModal restores acceptInput from bridge when last modal dismissed', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      bridge.isAcceptingInput.mockReturnValue(true)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.acceptInput).toBe(true)
    })

    it('dismissModal does not restore acceptInput while more modals remain', () => {
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce('Quest B')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      bridge.isAcceptingInput.mockReturnValue(true)
      // Start with acceptInput false to detect an incorrect restore
      store.acceptInput = false
      store.pollQuestEvents()
      store.dismissModal() // Quest B still in queue
      expect(store.showModal).toBe(true)
      expect(store.acceptInput).toBe(false)
    })

    it('does nothing when no events', () => {
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
    })

    it('calls playNewQuest when a quest is activated', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('plays sound per modal shown, not all at once when two quests activate', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce('Quest B')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      // First modal shown immediately — one sound
      expect(audio.playNewQuest).toHaveBeenCalledTimes(1)
      store.dismissModal()
      // Second modal shown on dismiss — second sound
      expect(audio.playNewQuest).toHaveBeenCalledTimes(2)
    })

    it('plays correct sound for each modal when quest types are mixed', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest
        .mockReturnValueOnce('Quest done!')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playNewQuest).toHaveBeenCalledTimes(1)
      expect(audio.playQuestComplete).toHaveBeenCalledTimes(0)
      store.dismissModal()
      expect(audio.playQuestComplete).toHaveBeenCalledTimes(1)
      expect(audio.playNewQuest).toHaveBeenCalledTimes(1)
    })

    it('calls playNewQuest when a quest is updated', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest
        .mockReturnValueOnce('Quest updated')
        .mockReturnValueOnce(null)
      bridge.completeQuest.mockReturnValue(null)
      store.pollQuestEvents()
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('calls playQuestComplete when a quest is completed', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest
        .mockReturnValueOnce('Quest done!')
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(audio.playNewQuest).not.toHaveBeenCalled()
    })

    it('does not call audio when no audio player is set', () => {
      // No setAudioPlayer call - should not throw
      bridge.activateQuest
        .mockReturnValueOnce('Quest A')
        .mockReturnValueOnce(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      expect(() => store.pollQuestEvents()).not.toThrow()
    })

    it('applies renderMarkup to activeQuests updated after polling', () => {
      bridge.activateQuest.mockReturnValue(null)
      bridge.updateQuest.mockReturnValue(null)
      bridge.completeQuest.mockReturnValue(null)
      bridge.getActiveQuests.mockReturnValue([
        {
          name: '[quest_name]Shadows Over Willowbrook (main)[/quest_name]',
          description: 'Stop the shadows.',
        },
      ])
      store.pollQuestEvents()
      expect(store.activeQuests[0].name).toBe(
        '<rendered>[quest_name]Shadows Over Willowbrook (main)[/quest_name]</rendered>',
      )
    })
  })

  // --- toggleSection ---

  describe('toggleSection', () => {
    it('toggles activeQuests', () => {
      expect(store.showActiveQuests).toBe(true)
      store.toggleSection('activeQuests')
      expect(store.showActiveQuests).toBe(false)
      store.toggleSection('activeQuests')
      expect(store.showActiveQuests).toBe(true)
    })

    it('toggles completedQuests', () => {
      expect(store.showCompletedQuests).toBe(false)
      store.toggleSection('completedQuests')
      expect(store.showCompletedQuests).toBe(true)
    })

    it('toggles inventory', () => {
      store.toggleSection('inventory')
      expect(store.showInventory).toBe(false)
    })

    it('toggles spells', () => {
      store.toggleSection('spells')
      expect(store.showSpells).toBe(false)
    })

    it('ignores unknown sections', () => {
      store.toggleSection('unknown')
      // No error thrown
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
      }))
      bridge.getSaveSlots.mockReturnValue(slots)
      expect(store.getSaveSlots()).toHaveLength(8)
    })
  })

  describe('saveToSlot', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.saveToSlot and renders output', () => {
      bridge.saveToSlot.mockReturnValue('Game saved.')
      store.saveToSlot(3)
      expect(bridge.saveToSlot).toHaveBeenCalledWith(3)
      expect(store.lastOutput).toBe('<rendered>Game saved.</rendered>')
    })
  })

  describe('loadFromSlot', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.loadFromSlot, renders output, and refreshes panels', () => {
      bridge.loadFromSlot.mockReturnValue('Game loaded.')
      bridge.getRoomName.mockReturnValue('Dungeon')
      store.loadFromSlot(2)
      expect(bridge.loadFromSlot).toHaveBeenCalledWith(2)
      expect(store.lastOutput).toBe('<rendered>Game loaded.</rendered>')
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

    it('records system output such as loading a save without a command', async () => {
      await startPlaying()
      bridge.getRoomName.mockReturnValue('Ancient Grove')

      store.loadFromSlot(3)

      expect(store.turns.at(-1)).toMatchObject({
        command: null,
        text: 'Game loaded.',
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

    it('does not record advanceTurn output (it only repeats the last answer)', async () => {
      await startPlaying()

      store.advanceTurn()

      expect(store.turns).toHaveLength(1)
    })

    it(`keeps only the last ${MAX_TURNS} turns`, async () => {
      await startPlaying()

      for (let i = 0; i < MAX_TURNS + 5; i++) store.submitCommand(`wait ${i}`)

      expect(store.turns).toHaveLength(MAX_TURNS)
      expect(store.turns.at(-1)?.command).toBe(`wait ${MAX_TURNS + 4}`)
      expect(store.turns.at(-1)?.id).toBe(MAX_TURNS + 6)
    })

    it('keeps updating lastOutput for the classic UI', async () => {
      await startPlaying()
      bridge.handleCommand.mockReturnValue('You see a forest.')

      store.submitCommand('look')

      expect(store.lastOutput).toBe('<rendered>You see a forest.</rendered>')
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
      store.submitCommand('  Save ')

      expect(bridge.quickSaveGame).toHaveBeenCalledTimes(1)
      expect(bridge.handleCommand).not.toHaveBeenCalled()
      expect(store.turns.at(-1)).toMatchObject({
        command: 'Save',
        text: 'Game saved.',
      })
    })

    it('treats a typed "load" like Quick load, without chips', () => {
      bridge.getInventory.mockReturnValue([
        { name: 'Lantern', description: '' },
      ])

      store.submitCommand('load')

      expect(bridge.quickLoadGame).toHaveBeenCalledTimes(1)
      expect(bridge.handleCommand).not.toHaveBeenCalled()
      expect(store.turns.at(-1)).toMatchObject({
        command: 'load',
        text: 'Game loaded.',
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
      store.questNewsInStory = true
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
      expect(store.turns.at(-1)!.quests).toHaveLength(1)
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
})

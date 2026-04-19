import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from './useGameStore'
import { renderMarkup } from '@/utils/theme'
import type { CompletionTree } from '@/types/bridge'

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

    it('calls bridge.saveGame and renders output', () => {
      bridge.saveGame.mockReturnValue('Saved!')
      store.saveGame()
      expect(store.lastOutput).toBe('<rendered>Saved!</rendered>')
    })
  })

  describe('loadGame', () => {
    beforeEach(async () => {
      await store.initGame()
    })

    it('calls bridge.loadGame and renders output', () => {
      bridge.loadGame.mockReturnValue('Loaded!')
      store.loadGame()
      expect(store.lastOutput).toBe('<rendered>Loaded!</rendered>')
    })

    it('refreshes panels after loading', () => {
      bridge.getRoomName.mockReturnValue('Saved Room')
      store.loadGame()
      expect(store.roomName).toBe('Saved Room')
    })
  })

  // --- pollQuestEvents ---

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
})

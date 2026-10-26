import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore, MAX_TURNS } from './useGameStore'
import type {
  CompletionTree,
  QuestReport,
  QuestSummary,
  ResultScreen,
  SaveSlot,
} from '@/types/bridge'

/**
 * A quest report as the engine would hand it: a pop-up text of the form
 * `[quest_name]Name (main quest)[/quest_name]\n\nText` gives its name, type
 * and text; any other string is a plain report named Q with that text.
 */
function quest(report: string): QuestReport {
  const match =
    /^\[quest_name\](.+) \((main|side) quest\)\[\/quest_name\]\n\n([\s\S]*)$/.exec(
      report,
    )
  if (!match) return { name: 'Q', main: false, text: report }
  return { name: match[1], main: match[2] === 'main', text: match[3] }
}

/** Result screens whose act-complete text starts at "Congratulations", if any. */
function screens(texts: string[]): ResultScreen[] {
  return texts.map((text) => {
    const at = text.indexOf('Congratulations')
    return { text, actComplete: at === -1 ? null : text.slice(at).trim() }
  })
}

/**
 * Minimal mock matching the useBridge() return shape; the engine read model
 * sits under `controller` as it does in the real bridge.
 */
function createMockBridge() {
  const controller = {
    advanceToRunning: vi.fn(() => screens(['Intro text'])),
    takeTurn: vi.fn(() => 'command result'),
    lastTurnRedescribesRoom: vi.fn(() => false),
    getRoomName: vi.fn(() => 'Village Square'),
    getVisitedRooms: vi.fn(() => ['Village Square']),
    getRoomDescription: vi.fn(() => 'A quiet village.'),
    getRoomCharacters: vi.fn(() => ['Mira']),
    getRoomItems: vi.fn(() => ['Map']),
    getRoomExits: vi.fn(() => ({ north: 'Forest' }) as Record<string, string>),
    getRoomWares: vi.fn(
      () => [] as Array<{ name: string; price: number; seller: string }>,
    ),
    getInventory: vi.fn(() => [{ name: 'Sword', description: 'Sharp' }]),
    getSpells: vi.fn(() => [{ name: 'Heal', description: 'Restores HP' }]),
    getActiveQuests: vi.fn((): QuestSummary[] => [
      {
        name: 'Find Key',
        main: false,
        done: false,
        details: { kind: 'journal', latest: 'Find the key', earlier: [] },
      },
    ]),
    getCompletedQuests: vi.fn((): QuestSummary[] => []),
    activateQuest: vi.fn((): QuestReport | null => null),
    updateQuest: vi.fn((): QuestReport | null => null),
    completeQuest: vi.fn((): QuestReport | null => null),
    look: vi.fn(() => 'You look around'),
    getActIntro: vi.fn(() => 'Act intro'),
    getActName: vi.fn(() => 'Act 1'),
    getQuestProgress: vi.fn(() => ({
      completed: 4,
      total: 11,
      actNumber: 1,
      mainQuest: 'Shadows Over Willowbrook',
    })),
    handleCommand: vi.fn((): string => ''),
    getShortNames: vi.fn((): Record<string, string> => ({})),
    getActStats: vi.fn(() => ({
      questsCompleted: 4,
      questsTotal: 11,
      spells: 1,
      places: 3,
    })),
    isAcceptingInput: vi.fn(() => true),
    advanceTurn: vi.fn(() => 'Turn advanced'),
    isActRunning: vi.fn(() => true),
    goldenPath: vi.fn((_n: number): string[] => []),
    isGameOver: vi.fn(() => false),
    getResultText: vi.fn(() => ''),
    getActCompleteText: vi.fn((): string | null => null),
    getCurrentMusic: vi.fn(() => ({
      musicFile: 'track.mp3',
      musicInfo: 'Track info',
    })),
    getCommandCompletions: vi.fn((): CompletionTree => ({})),
  }
  // The tests script each kind of quest event with the three mocks above, one
  // payload per call, until null; settleQuests drains them like the engine.
  const drain = (next: () => QuestReport | null): QuestReport[] => {
    const payloads: QuestReport[] = []
    for (let p = next(); p !== null; p = next()) payloads.push(p)
    return payloads
  }
  return {
    init: vi.fn(),
    isReady: vi.fn(() => true),
    quickSaveGame: vi.fn(() => 'Game saved.'),
    quickLoadGame: vi.fn(() => 'Game loaded.'),
    saveNamedGame: vi.fn(() => 'Game saved.'),
    loadNamedGame: vi.fn(() => 'Game loaded.'),
    newGame: vi.fn(),
    getQuickSave: vi.fn((): SaveSlot | null => null),
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
    controller: {
      ...controller,
      settleQuests: vi.fn(() => ({
        activated: drain(controller.activateQuest),
        updated: drain(controller.updateQuest),
        completed: drain(controller.completeQuest),
      })),
    },
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
      expect(store.modalChapter).toBe(null)
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
      expect(bridge.controller.advanceTurn).toHaveBeenCalledTimes(2)
    })

    it('shows act intro (second advanceTurn) in modal', async () => {
      bridge.controller.advanceTurn
        .mockReturnValueOnce('Logo text')
        .mockReturnValueOnce('Act intro!')
      await store.initGame()
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toMatchObject({ kind: 'intro' })
    })

    it('blocks acceptInput until intro modal is dismissed', async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      expect(store.acceptInput).toBe(false)
    })

    it('restores acceptInput after intro modal is dismissed', async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
      expect(store.acceptInput).toBe(true)
    })

    it('calls look() when intro modal is dismissed', async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
      expect(bridge.controller.look).toHaveBeenCalledTimes(1)
    })

    it('puts quests started by the first look in its turn', async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      bridge.controller.activateQuest
        .mockReturnValueOnce(
          quest('[quest_name]Q (main quest)[/quest_name]\n\nGo.'),
        )
        .mockReturnValueOnce(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest.mockReturnValue(null)
      await store.initGame()
      store.dismissModal() // dismiss intro → triggers look + pollQuestEvents
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        { kind: 'new', name: 'Q', main: true, text: 'Go.', chime: true },
      ])
    })

    it('lists quests started by the first look after the act intro', async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      // As in the engine, the quest is listed once its activation was polled.
      let started = false
      bridge.controller.activateQuest.mockImplementation(() => {
        if (started) return null
        started = true
        return quest('[quest_name]Q (main quest)[/quest_name]\n\nBegin.')
      })
      bridge.controller.getActiveQuests.mockImplementation(() =>
        started
          ? [
              {
                name: 'Q',
                main: true,
                done: false,
                details: { kind: 'journal', latest: 'Begin.', earlier: [] },
              },
            ]
          : [],
      )
      bridge.controller.getQuestProgress.mockImplementation(() => ({
        completed: 0,
        total: started ? 11 : 0,
        actNumber: 1,
        mainQuest: 'Q',
      }))

      store.dismissModal()

      expect(store.activeQuests).toHaveLength(1)
      expect(store.questProgress?.total).toBe(11)
    })

    it('plays the chime for a quest started by the first look', async () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest('Main quest started!'))
        .mockReturnValueOnce(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest.mockReturnValue(null)
      await store.initGame()
      store.dismissModal()
      expect(store.turns.at(-1)?.quests?.[0].chime).toBe(true)
      store.ringQuestSounds(store.turns.at(-1)!.id, [0])
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
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      await store.initGame()
      expect(store.acceptInput).toBe(false)
    })
  })

  // --- debug scripts (dev-only) ---

  describe('debug scripts', () => {
    function serveScript(text: string | null): void {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          text === null
            ? new Response('nope', { status: 404 })
            : new Response(text),
        ),
      )
    }

    beforeEach(async () => {
      await store.initGame()
      store.dismissModal()
      bridge.controller.takeTurn.mockClear()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
    })

    it('plays every command of the script, each as a turn of its own', async () => {
      serveScript('# comment\nlook\n\ntake bread\n')
      await store.runDebugScript('mine')
      expect(fetch).toHaveBeenCalledWith('/debug-scripts/mine.txt')
      expect(bridge.controller.takeTurn.mock.calls).toEqual([
        ['look'],
        ['take bread'],
      ])
      const commands = store.turns.map((turn) => turn.command)
      expect(commands.slice(-3)).toEqual(['look', 'take bread', 'debug mine'])
      expect(store.turns.at(-1)!.text).toContain('2 commands')
    })

    it('plays an act golden path from the engine', async () => {
      serveScript(null)
      bridge.controller.goldenPath.mockReturnValue(['look', 'take bread'])
      await store.runDebugScript('act1')
      expect(bridge.controller.goldenPath).toHaveBeenCalledWith(1)
      expect(fetch).not.toHaveBeenCalled()
      expect(bridge.controller.takeTurn.mock.calls).toEqual([
        ['look'],
        ['take bread'],
      ])
    })

    it('stops at a failing line and names the line, command and reason', async () => {
      serveScript('look\ntake sword\ngo north\n')
      bridge.controller.takeTurn
        .mockReturnValueOnce('A room.')
        .mockReturnValueOnce(
          "[failure]There is no 'sword' here to take.[/failure]",
        )
      await store.runDebugScript('mine')
      expect(bridge.controller.takeTurn).toHaveBeenCalledTimes(2)
      const last = store.turns.at(-1)!
      expect(last.text).toContain('[failure]')
      expect(last.text).toContain('line 2')
      expect(last.text).toContain("'take sword'")
      expect(last.text).toContain("There is no 'sword' here to take.")
    })

    it('stops when a command ends the act', async () => {
      serveScript('look\ntake bread\n')
      bridge.controller.isActRunning
        .mockReturnValueOnce(true)
        .mockReturnValue(false)
      await store.runDebugScript('mine')
      expect(bridge.controller.takeTurn).toHaveBeenCalledTimes(1)
      expect(store.turns.at(-1)!.text).toContain('the act ended')
    })

    it('says so when the script does not exist', async () => {
      serveScript(null)
      await store.runDebugScript('missing')
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
      expect(store.turns.at(-1)!.text).toContain("'missing' not found")
    })

    it('refuses a name that is not a plain script name', async () => {
      serveScript('look')
      await store.runDebugScript('../secret')
      expect(fetch).not.toHaveBeenCalled()
      expect(store.turns.at(-1)!.text).toContain('not found')
    })

    it('is reached by typing "debug <name>" under the dev server', async () => {
      serveScript('look\n')
      store.submitCommand('debug mine')
      await vi.waitFor(() =>
        expect(bridge.controller.takeTurn).toHaveBeenCalledWith('look'),
      )
    })

    it('is an ordinary command in a production build', () => {
      vi.stubEnv('DEV', false)
      serveScript('look\n')
      store.submitCommand('debug act1')
      expect(fetch).not.toHaveBeenCalled()
      expect(bridge.controller.takeTurn).toHaveBeenCalledWith('debug act1')
    })
  })

  // --- submitCommand ---

  describe('submitCommand', () => {
    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // unlock input after intro modal
    })

    it('calls bridge.controller.takeTurn with trimmed input', () => {
      store.submitCommand('  look  ')
      expect(bridge.controller.takeTurn).toHaveBeenCalledWith('look')
    })

    it('refreshes panels after command', () => {
      bridge.controller.getRoomName.mockReturnValue('Forest Path')
      store.submitCommand('go north')
      expect(store.roomName).toBe('Forest Path')
    })

    it('ignores empty commands', () => {
      store.submitCommand('')
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
    })

    it('ignores whitespace-only commands', () => {
      store.submitCommand('   ')
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
    })

    it('does nothing when acceptInput is false', () => {
      store.acceptInput = false
      store.submitCommand('look')
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
    })

    it('polls quest events after command', () => {
      bridge.controller.activateQuest
        .mockReturnValueOnce(
          quest('[quest_name]Q (side quest)[/quest_name]\n\nGo.'),
        )
        .mockReturnValueOnce(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest.mockReturnValue(null)
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
      bridge.controller.getRoomExits
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ south: 'VegetableField', east: 'VillageSquare' })
      bridge.controller.activateQuest.mockReturnValue(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest('Hint of Magic complete!'))
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
      bridge.controller.getRoomName.mockReturnValue('Dungeon')
      bridge.controller.getRoomDescription.mockReturnValue('Dark place.')
      bridge.controller.getRoomCharacters.mockReturnValue(['Guard'])
      bridge.controller.getRoomItems.mockReturnValue(['Key'])
      bridge.controller.getRoomExits.mockReturnValue({ south: 'Exit' })
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
      const questA: QuestSummary = {
        name: 'A',
        main: false,
        done: false,
        details: { kind: 'journal', latest: 'Do A', earlier: [] },
      }
      const questB: QuestSummary = {
        name: 'B',
        main: false,
        done: true,
        details: { kind: 'journal', latest: 'Did', earlier: [] },
      }
      bridge.controller.getInventory.mockReturnValue([potion])
      bridge.controller.getSpells.mockReturnValue([fire])
      bridge.controller.getActiveQuests.mockReturnValue([questA])
      bridge.controller.getCompletedQuests.mockReturnValue([questB])
      store.refreshPanels()
      expect(store.rawInventory).toEqual([potion])
      expect(store.bagEntries).toEqual([potion.name])
      expect(store.rawSpells).toEqual([fire])
      expect(store.spellEntries).toEqual([fire.name])
      expect(store.activeQuests).toEqual([questA])
      expect(store.completedQuests).toEqual([questB])
    })

    it('syncs acceptInput', () => {
      bridge.controller.isAcceptingInput.mockReturnValue(false)
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
      bridge.controller.getRoomName.mockReturnValue('Saved Room')
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
      bridge.controller.getRoomName.mockReturnValue('Boss Room')
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
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest('Quest: Find the gem'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        {
          kind: 'new',
          name: 'Q',
          main: false,
          text: 'Quest: Find the gem',
          chime: true,
        },
      ])
    })

    it('puts a completed quest in the story with its fanfare owed, never in a pop-up', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      store.submitCommand('look')
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest('Quest complete!'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
      const news = store.turns.at(-1)!.quests!.at(-1)!
      expect(news).toMatchObject({ kind: 'completed', fanfare: true })
      expect(audio.playQuestComplete).not.toHaveBeenCalled()

      store.ringQuestSounds(store.turns.at(-1)!.id, [
        store.turns.at(-1)!.quests!.length - 1,
      ])
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
    })

    it('plays the fanfare alone when a completion shows together with a new quest', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      store.submitCommand('look')
      const turn = store.turns.at(-1)!
      turn.quests = [
        { kind: 'new', name: 'A', main: false, text: 'a', chime: true },
        { kind: 'completed', name: 'B', main: true, text: 'b', fanfare: true },
      ]
      store.ringQuestSounds(turn.id, [0, 1])
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(audio.playNewQuest).not.toHaveBeenCalled()
    })

    it('dismissModal restores acceptInput from bridge when last modal dismissed', () => {
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest(done('A')))
        .mockReturnValueOnce(null)
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      store.pollQuestEvents()
      store.dismissModal()
      expect(store.acceptInput).toBe(true)
    })

    it('does nothing when no events', () => {
      store.pollQuestEvents()
      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests ?? []).toEqual([])
      expect(store.questsHaveNew).toBe(false)
    })

    it('owes the chime for an activated quest until its card shows, then rings it once', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest('Quest A'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      const turn = store.turns.at(-1)!
      expect(turn.quests?.[0].chime).toBe(true)
      expect(audio.playNewQuest).not.toHaveBeenCalled()

      store.ringQuestSounds(turn.id, [0])
      store.ringQuestSounds(turn.id, [0])
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(store.turns.at(-1)?.quests?.[0].chime).toBeUndefined()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('calls playNewQuest when a quest is updated', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.controller.updateQuest
        .mockReturnValueOnce(quest('Quest updated'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      store.ringQuestSounds(store.turns.at(-1)!.id, [0])
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('plays the fanfare for a completed quest when its record shows', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      store.submitCommand('look')
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest('Quest done!'))
        .mockReturnValueOnce(null)
      store.pollQuestEvents()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
      store.ringQuestSounds(store.turns.at(-1)!.id, [0])
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(store.turns.at(-1)?.quests?.some((q) => q.chime)).toBe(false)
      expect(audio.playNewQuest).not.toHaveBeenCalled()
    })

    it('does not call audio when no audio player is set', () => {
      // No setAudioPlayer call - should not throw
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest('Quest A'))
        .mockReturnValueOnce(null)
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest('Quest B'))
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
      bridge.controller.getCurrentMusic.mockReturnValue({
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
      bridge.controller.getCommandCompletions.mockReturnValue({
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

    it('does not treat the @ marker as a word to type', () => {
      expect(store.completionState('look @').kind).toBe('none')
      expect(store.completionState('look @ x').kind).toBe('none')
    })

    it('chain-expands after a capitalised word too', () => {
      expect(store.tabComplete('Talk ').newInput).toBe('talk to mira ')
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
      bridge.controller.getCommandCompletions.mockReturnValue({
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
      bridge.controller.getCommandCompletions.mockReturnValue({
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
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.activateQuest.mockReturnValue(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest.mockReturnValue(null)
      bridge.controller.advanceToRunning.mockReturnValue(
        screens(['Congratulations Act 1!', 'Act 2 begins.', '']),
      )
    }

    beforeEach(async () => {
      await store.initGame()
      store.dismissModal() // dismiss init intro modal
    })

    it('shows act transition modal immediately when command causes transition', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toMatchObject({ kind: 'complete' })
    })

    it('shows act intro modal after dismissing transition modal', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      store.dismissModal()
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toMatchObject({ kind: 'intro' })
    })

    it('takes the chapter body from the bridge, not from the text', () => {
      setupTransitionMocks()
      bridge.controller.advanceToRunning.mockReturnValue([
        { text: 'The map aligns. Done.', actComplete: 'Rest now.' },
        { text: 'Act 2 begins.', actComplete: null },
      ])
      store.submitCommand('use map')
      expect(store.modalChapter).toMatchObject({
        kind: 'complete',
        body: 'Rest now.',
      })
    })

    it("plays the next act's music as soon as its intro pop-up shows", () => {
      setupTransitionMocks()
      // Like the engine: no music during the transition, the next act's once it runs.
      bridge.controller.getCurrentMusic.mockImplementation(() =>
        bridge.controller.advanceToRunning.mock.calls.length > 0
          ? { musicFile: 'act2.mp3', musicInfo: 'Act 2 track' }
          : { musicFile: '', musicInfo: '' },
      )
      bridge.controller.look.mockClear()
      store.submitCommand('use map')
      store.dismissModal() // dismiss the act-complete page
      expect(store.modalChapter).toMatchObject({ kind: 'intro' })
      expect(bridge.controller.look).not.toHaveBeenCalled()
      expect(store.musicFile).toBe('act2.mp3')
      expect(store.musicInfo).toBe('Act 2 track')
    })

    it('fires look after all transition modals are dismissed', () => {
      setupTransitionMocks()
      store.submitCommand('use map')
      store.dismissModal() // dismiss transition modal
      bridge.controller.look.mockReturnValue('You are in Act 2.')
      store.dismissModal() // dismiss intro modal
      expect(bridge.controller.look).toHaveBeenCalled()
    })

    it('holds the act-complete page while the last turn is being read, then shows it', () => {
      setupTransitionMocks()
      const gate = vi.fn(() => true)
      store.setActEndGate(gate)
      store.submitCommand('use map')
      expect(gate).toHaveBeenCalledWith(store.turns.at(-1))
      expect(store.showModal).toBe(false)
      expect(store.actEndPending).toBe(true)

      store.resumeActEnd()
      expect(store.actEndPending).toBe(false)
      expect(store.showModal).toBe(true)
      expect(store.modalChapter).toMatchObject({ kind: 'complete' })
    })

    it('shows the act-complete page at once when no turn is being read', () => {
      setupTransitionMocks()
      store.setActEndGate(() => false)
      store.submitCommand('use map')
      expect(store.showModal).toBe(true)
      expect(store.actEndPending).toBe(false)
    })

    it('does not trigger transition modals when act is running normally', () => {
      // isActRunning stays true (default), so no transition modals
      bridge.controller.activateQuest.mockReturnValue(null)
      bridge.controller.updateQuest.mockReturnValue(null)
      bridge.controller.completeQuest.mockReturnValue(null)
      store.submitCommand('look')
      expect(store.showModal).toBe(false)
      expect(bridge.controller.advanceToRunning).not.toHaveBeenCalled()
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
      bridge.controller.getRoomName.mockReturnValue('Dungeon')
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
          narrate: true,
          firstVisit: true,
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
      bridge.controller.takeTurn.mockReturnValue(
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
        narrate: true,
      })
    })

    it('marks a turn whose command moved the player to another room', async () => {
      await startPlaying()
      bridge.controller.getRoomName.mockReturnValue('Forest Path')

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
      bridge.controller.getRoomName.mockReturnValue('Ancient Grove')

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
      bridge.controller.getRoomName.mockReturnValue('Act 2 Start')
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      bridge.controller.advanceToRunning.mockReturnValue(
        screens(['Act 1 done!', 'Act 2 begins.']),
      )

      store.submitCommand('use map')

      expect(store.turns.at(-1)).toMatchObject({
        command: 'use map',
        room: 'Village Square',
        roomChanged: false,
      })

      bridge.controller.isActRunning.mockReturnValue(true)
      bridge.controller.look.mockReturnValue('You are in Act 2.')
      bridge.controller.getVisitedRooms.mockReturnValue(['Act 2 Start'])
      store.dismissModal() // act complete
      store.dismissModal() // act intro -> arrival look

      expect(store.turns.at(-1)).toMatchObject({
        command: null,
        text: 'You are in Act 2.',
        room: 'Act 2 Start',
        roomChanged: true,
        narrate: true,
      })
    })

    it('marks the opening arrival and a typed command for narration, never a load', async () => {
      await startPlaying()
      expect(store.turns[0]).toMatchObject({ narrate: true, firstVisit: true })

      store.submitCommand('look')
      expect(store.turns.at(-1)?.narrate).toBe(true)

      store.submitCommand('load')
      expect(store.turns.at(-1)?.narrate).toBeUndefined()
    })

    it('flags a first visit when the room is new, even as another leaves the visited list (waking from the dream)', async () => {
      await startPlaying()
      bridge.controller.getRoomName.mockReturnValue("Elior's Cottage")
      bridge.controller.getVisitedRooms.mockReturnValue(["Elior's Cottage"])
      store.submitCommand('talk to voice')
      expect(store.turns.at(-1)?.firstVisit).toBe(true)
    })

    it('flags a first visit once, and not a return', async () => {
      await startPlaying()
      bridge.controller.getRoomName.mockReturnValue('Forest')
      bridge.controller.getVisitedRooms.mockReturnValue([
        'Village Square',
        'Forest',
      ])
      store.submitCommand('go north')
      expect(store.turns.at(-1)?.firstVisit).toBe(true)

      bridge.controller.getRoomName.mockReturnValue('Village Square')
      store.submitCommand('go south')
      expect(store.turns.at(-1)?.firstVisit).toBeUndefined()
      expect(store.turns.at(-1)?.roomChanged).toBe(true)
    })

    it("names the folder of the running act's recordings", async () => {
      expect(store.narrationFolder).toBeNull()
      bridge.controller.advanceTurn
        .mockReturnValueOnce('Logo')
        .mockReturnValueOnce('[bold]ACT 1: THE CALL[/bold]\n\nHi.')
      await startPlaying()
      expect(store.narrationFolder).toBe('act1')
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
      bridge.controller.getInventory.mockReturnValue([
        named('[item_name]Sword[/item_name]'),
        named('[item_name]Bucket[/item_name]'),
      ])
      bridge.controller.getSpells.mockReturnValue([
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
      bridge.controller.getInventory.mockReturnValue([])

      store.submitCommand('give sword to mira')

      expect(store.turns.at(-1)?.lost).toEqual([
        { kind: 'item', name: 'Sword', count: 1 },
      ])
      expect(store.bagHasNew).toBe(false)
    })

    it('clears a tab dot once the tab has been seen', async () => {
      await startPlaying()
      bridge.controller.getInventory.mockReturnValue([
        named('Sword'),
        named('Map'),
      ])
      store.submitCommand('take map')

      store.markSeen('bag')

      expect(store.bagHasNew).toBe(false)
    })

    it('shows no chips when a save is loaded, and compares later turns with it', async () => {
      await startPlaying()
      bridge.controller.getInventory.mockReturnValue([
        named('Lantern'),
        named('Rope'),
      ])

      store.loadFromSlot(1)
      expect(store.turns.at(-1)?.gained).toEqual([])
      expect(store.bagHasNew).toBe(false)

      bridge.controller.getInventory.mockReturnValue([named('Lantern')])
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
      bridge.controller.getInventory.mockReturnValue([
        named('Sword'),
        named('Map'),
      ])
      bridge.controller.getSpells.mockReturnValue([
        named('Heal'),
        named('Light'),
      ])
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
      bridge.controller.getInventory.mockReturnValue([
        named('Sword'),
        named('Map'),
      ])
      bridge.controller.getSpells.mockReturnValue([
        named('Heal'),
        named('Light'),
      ])
      store.submitCommand('take map')

      save()

      expect(store.bagHasNew).toBe(true)
      expect(store.spellsHaveNew).toBe(true)
    })

    it('clears the tab dots when the act changes', async () => {
      await startPlaying()
      bridge.controller.getInventory.mockReturnValue([
        named('Sword'),
        named('Map'),
      ])
      store.submitCommand('take map')
      bridge.controller.isActRunning.mockReturnValue(false)

      store.submitCommand('use map')

      expect(store.bagHasNew).toBe(false)
    })

    it('shows no chips on the turn that ends an act', async () => {
      await startPlaying()
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.getInventory.mockReturnValue([])

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
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
      expect(store.notice?.text).toBe('Game saved')
      expect(store.turns.length).toBe(turns)
    })

    it('treats a typed "load" like Quick load, without chips', () => {
      bridge.controller.getInventory.mockReturnValue([
        { name: 'Lantern', description: '' },
      ])

      store.submitCommand('load')

      expect(bridge.quickLoadGame).toHaveBeenCalledTimes(1)
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
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
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
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
      expect(bridge.controller.takeTurn).toHaveBeenCalledWith(
        'save my adventure',
      )
      expect(bridge.controller.takeTurn).toHaveBeenCalledWith('load ../secret')
    })

    it('still sends other commands that start with save or load to the game', () => {
      store.submitCommand('saveguard the village')
      store.submitCommand('loadstone')

      expect(bridge.controller.takeTurn).toHaveBeenCalledTimes(2)
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

      bridge.controller.getQuestProgress.mockReturnValue({
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
      bridge.controller.getRoomName.mockReturnValue('Vegetable Field')
      bridge.controller.getRoomDescription.mockReturnValue(
        'Rows of withered crops.',
      )
      bridge.controller.getRoomCharacters.mockReturnValue([])
      bridge.controller.getRoomItems.mockReturnValue([
        'rusty hoe',
        'dull knife',
      ])
      bridge.controller.getRoomExits.mockReturnValue({
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
      bridge.controller.getRoomName.mockReturnValue('Vegetable Field')
      bridge.controller.getRoomDescription.mockReturnValue(
        'Rows of withered crops.',
      )
      store.submitCommand('go south')
      const field = store.turns.length - 1

      bridge.controller.getRoomName.mockReturnValue('Chicken Coop')
      bridge.controller.getRoomDescription.mockReturnValue('A noisy coop.')
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
      bridge.controller.getRoomWares.mockReturnValue([
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
      bridge.controller.getInventory.mockReturnValue([
        { name: '[item_name]2 apple[/item_name]', description: '' },
      ])
      bridge.controller.getSpells.mockReturnValue([
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
      bridge.controller.getInventory.mockReturnValue([
        { name: '[item_name]bread[/item_name]', description: 'A small loaf.' },
      ])
      bridge.controller.getActiveQuests.mockReturnValue([
        {
          name: 'Q',
          main: true,
          done: false,
          details: { kind: 'journal', latest: 'Old', earlier: [] },
        },
      ])
      bridge.controller.getCompletedQuests.mockReturnValue([
        {
          name: 'Done',
          main: false,
          done: true,
          details: { kind: 'journal', latest: 'Fin.', earlier: [] },
        },
      ])

      await store.initGame()

      expect(store.rawInventory).toEqual([
        { name: '[item_name]bread[/item_name]', description: 'A small loaf.' },
      ])
      expect(store.activeQuests[0].details).toEqual({
        kind: 'journal',
        latest: 'Old',
        earlier: [],
      })
      expect(store.completedQuests[0].name).toBe('Done')
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
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
    })

    it('adds new and updated quests to the turn instead of a pop-up', () => {
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)
      bridge.controller.updateQuest
        .mockReturnValueOnce({ ...quest(UPDATED), text: 'New.' })
        .mockReturnValue(null)

      store.submitCommand('look')

      expect(store.showModal).toBe(false)
      expect(store.turns.at(-1)!.quests).toEqual([
        {
          kind: 'new',
          name: 'Hint of Magic',
          main: false,
          text: 'A force stirs.',
          chime: true,
        },
        {
          kind: 'updated',
          name: 'Shadows',
          main: true,
          text: 'New.',
          chime: true,
        },
      ])
    })

    it('owes a chime per quest card: one for cards shown together, one each when read in turn', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)
      bridge.controller.updateQuest
        .mockReturnValueOnce({ ...quest(UPDATED), text: 'New.' })
        .mockReturnValue(null)

      store.submitCommand('look')
      const id = store.turns.at(-1)!.id
      expect(store.turns.at(-1)?.quests?.map((q) => q.chime)).toEqual([
        true,
        true,
      ])
      store.ringQuestSounds(id, [0, 1])
      store.ringQuestSounds(id, [0, 1])
      expect(audio.playNewQuest).toHaveBeenCalledOnce()

      store.submitCommand('look')
      bridge.controller.activateQuest.mockReset()
      store.turns.at(-1)!.quests = [
        { kind: 'new', name: 'A', main: false, text: 'a', chime: true },
        { kind: 'new', name: 'B', main: false, text: 'b', chime: true },
      ]
      store.ringQuestSounds(store.turns.at(-1)!.id, [0])
      store.ringQuestSounds(store.turns.at(-1)!.id, [1])
      expect(audio.playNewQuest).toHaveBeenCalledTimes(3)
    })

    it('lets the fanfare alone mark a turn that also completes a quest', () => {
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      store.setAudioPlayer(audio)
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)
      bridge.controller.completeQuest
        .mockReturnValueOnce(
          quest('[quest_name]Q (side quest)[/quest_name]\n\nDone.'),
        )
        .mockReturnValue(null)

      store.submitCommand('talk to grandmother')
      // Shown together (narration off): one sound, the fanfare.
      store.ringQuestSounds(store.turns.at(-1)!.id, [0, 1])

      expect(audio.playNewQuest).not.toHaveBeenCalled()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(store.turns.at(-1)!.quests!.map((q) => q.kind)).toEqual([
        'completed',
        'new',
      ])
    })

    it('tells a completion before the quests that start or move on with it', () => {
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)
      bridge.controller.updateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)
      bridge.controller.completeQuest
        .mockReturnValueOnce(
          quest('[quest_name]Q (side quest)[/quest_name]\n\nDone.'),
        )
        .mockReturnValue(null)

      store.submitCommand('talk to grandmother')

      expect(store.turns.at(-1)!.quests!.map((q) => q.kind)).toEqual([
        'completed',
        'new',
        'updated',
      ])
    })

    it('keeps each completion in the story with its quest count', () => {
      const done = (name: string) =>
        `[quest_name]${name} (side quest)[/quest_name]\n\nWell done.`
      bridge.controller.completeQuest
        .mockReturnValueOnce(quest(done('First')))
        .mockReturnValueOnce(quest(done('Second')))
        .mockReturnValue(null)
      bridge.controller.getQuestProgress.mockReturnValue({
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
          fanfare: true,
        },
        {
          kind: 'completed',
          name: 'Second',
          main: false,
          text: 'Well done.',
          progress: { completed: 5, total: 11 },
          fanfare: true,
        },
      ])
    })

    it('puts a dot on the Quests tab until it is seen', () => {
      bridge.controller.activateQuest
        .mockReturnValueOnce(quest(NEW))
        .mockReturnValue(null)

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
      bridge.controller.advanceTurn
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
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.getActStats.mockReturnValue(STATS)
      bridge.controller.advanceToRunning.mockReturnValue(
        screens([
          'The map aligns.\n\nCongratulations — you have completed Act 1!',
          INTRO_2,
        ]),
      )

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
      expect(
        bridge.controller.getActStats.mock.invocationCallOrder[0],
      ).toBeLessThan(
        bridge.controller.advanceToRunning.mock.invocationCallOrder[0],
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
      bridge.controller.getActIntro.mockReturnValue(INTRO_2)
      load(store)
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.advanceToRunning.mockReturnValue(
        screens([
          'Congratulations — you have completed Act 2!',
          '[bold]ACT III: THE AWAKENING[/bold]\n\nText.',
        ]),
      )

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
      expect(bridge.controller.look).toHaveBeenCalled()
    })
  })

  // --- Save / load notices (Lantern) ---

  describe('save and load notices', () => {
    beforeEach(async () => {
      bridge.controller.isAcceptingInput.mockReturnValue(true)
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
      bridge.controller.handleCommand.mockReturnValue(
        '[bold]Current Room:[/bold] Square',
      )
      await store.initGame()
      const turns = store.turns.length

      expect(store.readInfo('stats')).toBe('[bold]Current Room:[/bold] Square')
      expect(bridge.controller.handleCommand).toHaveBeenCalledWith('stats')
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
      bridge.controller.isAcceptingInput.mockReturnValue(true)
      await store.initGame()
      store.dismissModal()
    })

    it('asks before quitting', () => {
      bridge.controller.takeTurn.mockClear()

      store.submitCommand('quit')
      expect(store.quitAsked).toBe(true)
      store.quitAsked = false
      store.submitCommand('EXIT')
      expect(store.quitAsked).toBe(true)
      expect(bridge.controller.takeTurn).not.toHaveBeenCalled()
    })

    it('starts again from Act I', () => {
      store.submitCommand('look')
      store.bagHasNew = true
      store.quitAsked = true
      bridge.controller.advanceTurn
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
      bridge.controller.advanceTurn
        .mockReturnValueOnce('LOGO')
        .mockReturnValueOnce(INTRO_4)
      await store.initGame()
      store.dismissModal()
      bridge.controller.getActStats.mockReturnValue(STATS)
      bridge.controller.getResultText.mockReturnValue(CLOSING)
      bridge.controller.getActCompleteText.mockReturnValue(
        CLOSING.slice(CLOSING.indexOf('Congratulations')).trim(),
      )
    })

    /** The command that completes the last act. */
    function finishLastAct(): void {
      bridge.controller.takeTurn.mockReturnValue('The realm breathes again.')
      bridge.controller.isAcceptingInput.mockReturnValue(false)
      bridge.controller.isActRunning.mockReturnValue(false)
      bridge.controller.isGameOver.mockReturnValue(true)
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

    it('shows the final chapter right after the last quest completes, the completion in the story', () => {
      bridge.controller.completeQuest
        .mockReturnValueOnce(
          quest('[quest_name]Q (main quest)[/quest_name]\n\nDone.'),
        )
        .mockReturnValue(null)
      finishLastAct()
      expect(store.turns.at(-1)?.quests?.at(-1)?.kind).toBe('completed')
      expect(store.modalChapter).toEqual(FINAL_CHAPTER)
      expect(bridge.controller.advanceToRunning).not.toHaveBeenCalled()
    })

    it('keeps the story room and chips of the command that ended the game', () => {
      bridge.controller.getInventory
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
      bridge.controller.advanceTurn
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
      bridge.controller.advanceTurn
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
    bridge.controller.getShortNames.mockReturnValue({
      journal: "Elior's Journal",
    })

    await store.initGame()

    expect(store.shortNames).toEqual({ journal: "Elior's Journal" })
  })
})

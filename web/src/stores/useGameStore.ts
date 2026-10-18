import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  NamedItem,
  RoomExits,
  CompletionTree,
  NamedSave,
  SaveSlot,
} from '@/types/bridge'
import { renderMarkup } from '@/utils/theme'
import { inventoryChanges, type Chip } from '@/lantern/inventoryChanges'

/**
 * Shape of the bridge object injected via setBridge().
 * Matches the return type of useBridge().
 */
export interface GameBridge {
  init(onProgress?: (status: string) => void): Promise<void>
  isReady(): boolean
  handleCommand(command: string): string
  getRoomName(): string
  getRoomDescription(): string
  getRoomCharacters(): string[]
  getRoomItems(): string[]
  getRoomExits(): RoomExits
  getInventory(): NamedItem[]
  getSpells(): NamedItem[]
  getActiveQuests(): NamedItem[]
  getCompletedQuests(): NamedItem[]
  activateQuest(): string | null
  updateQuest(): string | null
  completeQuest(): string | null
  saveGame(): string
  loadGame(): string
  quickSaveGame(): string
  quickLoadGame(): string
  saveNamedGame(name: string): string
  loadNamedGame(name: string): string
  listNamedSaves(): NamedSave[]
  getActName(): string
  getSaveSlots(): SaveSlot[]
  saveToSlot(slot: number): string
  loadFromSlot(slot: number): string
  isAcceptingInput(): boolean
  isActRunning(): boolean
  getCommandCompletions(): CompletionTree
  advanceTurn(): string
  advanceToRunning(): string[]
  getMusicInfo(): { musicFile: string; musicInfo: string }
  look(): string
}

/** Minimal interface required for quest sound-effect playback. */
export interface QuestAudioPlayer {
  playNewQuest(): void
  playQuestComplete(): void
}

/** Most recent turns kept for the story view; older ones are dropped. */
export const MAX_TURNS = 200

/** Save names the game accepts (mirrors Game._validate_save_name). */
const SAVE_NAME_PATTERN = /^[a-z0-9_-]+$/

/** One entry in the story: what the player did and what the game answered. */
export interface Turn {
  /** Increasing id, unique for the session (stable key for rendering). */
  id: number
  /** The typed or built command; null for system output (arrival, load…). */
  command: string | null
  /** The engine's answer as raw markup (rendered by the story view). */
  text: string
  /** Room the player is in after this turn. */
  room: string
  /** True when this turn brought the player to a different room. */
  roomChanged: boolean
  /** Items and spells this command added (none for system output). */
  gained: Chip[]
  /** Items and spells this command removed (none for system output). */
  lost: Chip[]
}

/** Journal tabs that show a dot when something new arrived. */
export type JournalTab = 'bag' | 'spells'

interface QuestEvent {
  title: string
  body: string
  sound: 'newQuest' | 'questComplete' | null
}

export const useGameStore = defineStore('game', () => {
  // --- Bridge reference ---
  let bridge: GameBridge | null = null

  // --- Audio player reference ---
  let audioPlayer: QuestAudioPlayer | null = null

  // --- Loading ---
  const loading = ref(true)
  const loadingStatus = ref('Initializing...')

  // --- Room data ---
  const roomName = ref('')
  const roomDescription = ref('')
  const characters = ref<string[]>([])
  const items = ref<string[]>([])
  const exits = ref<RoomExits>({})

  // --- Panels ---
  const inventory = ref<NamedItem[]>([])
  const spells = ref<NamedItem[]>([])
  const activeQuests = ref<NamedItem[]>([])
  const completedQuests = ref<NamedItem[]>([])

  // --- Output ---
  const lastOutput = ref('')
  const turns = ref<Turn[]>([])
  let nextTurnId = 1
  let lastTurnRoom = ''
  // Bag and spells as the bridge listed them after the previous turn
  let lastBag: string[] = []
  let lastSpells: string[] = []
  const bagHasNew = ref(false)
  const spellsHaveNew = ref(false)
  const introText = ref('')

  // --- Input ---
  const acceptInput = ref(false)

  // --- Completion tree (refreshed after every command / panel refresh) ---
  const completionTree = ref<CompletionTree>({})

  // --- Sidebar sections ---
  const showActiveQuests = ref(true)
  const showCompletedQuests = ref(false)
  const showInventory = ref(true)
  const showSpells = ref(true)

  // --- Modal ---
  const showModal = ref(false)
  const modalTitle = ref('')
  const modalBody = ref('')
  const modalQueue = ref<QuestEvent[]>([])
  let pendingLookOnDismiss = false

  // --- Music (exposed for useMusic composable) ---
  const musicFile = ref('')
  const musicInfo = ref('')

  function setBridge(b: GameBridge) {
    bridge = b
  }

  function setAudioPlayer(player: QuestAudioPlayer) {
    audioPlayer = player
  }

  /**
   * Show an engine answer: set lastOutput (classic UI) and record it as a
   * turn in the story log (Lantern UI).
   *
   * A command that completes an act already swaps in the next act's state, so
   * while the act is not running the answer stays in the previous turn's room.
   */
  function showOutput(
    command: string | null,
    raw: string,
    { chips = command !== null }: { chips?: boolean } = {},
  ): void {
    lastOutput.value = renderMarkup(raw)
    const b = requireBridge()
    const actRunning = b.isActRunning()
    const room = actRunning ? b.getRoomName() : lastTurnRoom
    const bag = b.getInventory().map((entry) => entry.name)
    const spellList = b.getSpells().map((entry) => entry.name)
    // Only a player's command changes the bag; arrivals, loads and act
    // changes just set the new starting point.
    const showChips = chips && actRunning
    const itemChanges = inventoryChanges(lastBag, bag, 'item')
    const spellChanges = inventoryChanges(lastSpells, spellList, 'spell')
    const gained = showChips
      ? [...itemChanges.gained, ...spellChanges.gained]
      : []
    const lost = showChips ? [...itemChanges.lost, ...spellChanges.lost] : []
    // A new act starts a new bag: nothing in it is "new" yet.
    if (!actRunning) clearNewDots()
    if (showChips && itemChanges.gained.length) bagHasNew.value = true
    if (showChips && spellChanges.gained.length) spellsHaveNew.value = true
    lastBag = bag
    lastSpells = spellList

    turns.value.push({
      id: nextTurnId++,
      command,
      text: raw,
      room,
      roomChanged: room !== lastTurnRoom,
      gained,
      lost,
    })
    lastTurnRoom = room
    if (turns.value.length > MAX_TURNS) {
      turns.value.splice(0, turns.value.length - MAX_TURNS)
    }
  }

  /** A loaded save or a new act: no item or spell is "new" any more. */
  function clearNewDots(): void {
    bagHasNew.value = false
    spellsHaveNew.value = false
  }

  /** The player opened a journal tab: clear its "new" dot. */
  function markSeen(tab: JournalTab): void {
    if (tab === 'bag') bagHasNew.value = false
    else spellsHaveNew.value = false
  }

  function requireBridge(): GameBridge {
    if (!bridge) throw new Error('Bridge not initialized')
    return bridge
  }

  async function initGame(): Promise<void> {
    try {
      const b = requireBridge()
      await b.init((status: string) => {
        loadingStatus.value = status
      })

      // Advance SHOW_LOGO → ACT_INTRO: get the logo/splash text for the output area
      const logoRaw = b.advanceTurn()
      introText.value = renderMarkup(logoRaw)

      // Advance ACT_INTRO → ACT_RUNNING: get the act intro text
      const actIntroRaw = b.advanceTurn()
      refreshPanels()

      // Block input until the player dismisses the act intro modal
      acceptInput.value = false
      pendingLookOnDismiss = true
      modalQueue.value.push({
        title: '📖 Act Intro',
        body: renderMarkup(actIntroRaw),
        sound: null,
      })
      if (!showModal.value) {
        showNextModal()
      }

      loading.value = false
    } catch (err) {
      loadingStatus.value = `Error: ${(err as Error).message}`
    }
  }

  function submitCommand(cmd: string): void {
    if (!acceptInput.value) return
    if (!cmd || !cmd.trim()) return

    const b = requireBridge()
    const command = cmd.trim()
    if (routeSaveOrLoad(command)) return
    const result = b.handleCommand(command)
    showOutput(command, result)
    refreshPanels()
    pollQuestEvents()
    refreshPanels()
    if (!acceptInput.value && !showModal.value && !b.isActRunning()) {
      triggerActTransitionModals()
    }
  }

  function triggerActTransitionModals(): void {
    const b = requireBridge()
    const texts = b.advanceToRunning().filter((t) => t.trim() !== '')
    if (texts.length === 0) return
    const transitionTexts = texts.slice(0, -1)
    const actIntroText = texts[texts.length - 1]
    for (const text of transitionTexts) {
      modalQueue.value.push({
        title: '🏆 Act Complete!',
        body: renderMarkup(text),
        sound: null,
      })
    }
    modalQueue.value.push({
      title: '📖 Act Intro',
      body: renderMarkup(actIntroText),
      sound: null,
    })
    pendingLookOnDismiss = true
    if (!showModal.value) {
      showNextModal()
    }
  }

  function advanceTurn(): void {
    const b = requireBridge()
    const result = b.advanceTurn()
    // Not a turn: while input is blocked this only repeats the last answer.
    lastOutput.value = renderMarkup(result)
    refreshPanels()
  }

  function refreshPanels(): void {
    const b = requireBridge()
    const renderItem = (item: NamedItem): NamedItem => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    })
    roomName.value = b.getRoomName()
    roomDescription.value = b.getRoomDescription()
    characters.value = b.getRoomCharacters()
    items.value = b.getRoomItems()
    exits.value = b.getRoomExits()
    inventory.value = b.getInventory().map(renderItem)
    spells.value = b.getSpells().map(renderItem)
    activeQuests.value = b.getActiveQuests().map(renderItem)
    completedQuests.value = b.getCompletedQuests().map(renderItem)
    const m = b.getMusicInfo()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
    acceptInput.value = b.isAcceptingInput()
    completionTree.value = b.getCommandCompletions()
  }

  /**
   * Typed `save` / `load` (optionally with a name) behave exactly like the
   * buttons, so saves reach browser storage and loads reset chips and dots.
   * Names are lowercased like the game does; a name the game would reject
   * (spaces, slashes, dots…) is left to the game so it answers with its own
   * error. Returns true when the command was handled here.
   */
  function routeSaveOrLoad(command: string): boolean {
    const match = /^(save|load)(?:\s+(\S.*))?$/i.exec(command)
    if (!match) return false
    const [, verb, rawName] = match
    const name = rawName?.toLowerCase()
    if (name && !SAVE_NAME_PATTERN.test(name)) return false
    const isSave = verb.toLowerCase() === 'save'
    if (isSave && name) saveNamedGame(name, command)
    else if (isSave) saveGame(command)
    else if (name) loadNamedGame(name, command)
    else loadGame(command)
    return true
  }

  function saveGame(command: string | null = null): void {
    const b = requireBridge()
    const result = b.quickSaveGame()
    showOutput(command, result, { chips: false })
  }

  function loadGame(command: string | null = null): void {
    const b = requireBridge()
    const result = b.quickLoadGame()
    clearNewDots()
    showOutput(command, result, { chips: false })
    refreshPanels()
  }

  function saveNamedGame(name: string, command: string | null = null): void {
    const b = requireBridge()
    const result = b.saveNamedGame(name)
    showOutput(command, result, { chips: false })
  }

  function loadNamedGame(name: string, command: string | null = null): void {
    const b = requireBridge()
    const result = b.loadNamedGame(name)
    clearNewDots()
    showOutput(command, result, { chips: false })
    refreshPanels()
  }

  function listNamedSaves(): NamedSave[] {
    const b = requireBridge()
    return b.listNamedSaves()
  }

  function getSaveSlots(): SaveSlot[] {
    const b = requireBridge()
    return b.getSaveSlots()
  }

  function saveToSlot(slot: number): void {
    const b = requireBridge()
    const result = b.saveToSlot(slot)
    showOutput(null, result)
  }

  function loadFromSlot(slot: number): void {
    const b = requireBridge()
    const result = b.loadFromSlot(slot)
    clearNewDots()
    showOutput(null, result)
    refreshPanels()
  }

  function pollQuestEvents(): void {
    const b = requireBridge()
    const events: QuestEvent[] = []

    let activated: string | null
    while ((activated = b.activateQuest()) !== null) {
      events.push({
        title: '📜 New Quest!',
        body: renderMarkup(activated),
        sound: 'newQuest',
      })
    }

    let updated: string | null
    while ((updated = b.updateQuest()) !== null) {
      events.push({
        title: '📜 Quest Updated',
        body: renderMarkup(updated),
        sound: 'newQuest',
      })
    }

    let completed: string | null
    while ((completed = b.completeQuest()) !== null) {
      events.push({
        title: '🏆 Quest Complete!',
        body: renderMarkup(completed),
        sound: 'questComplete',
      })
    }

    if (events.length > 0) {
      modalQueue.value.push(...events)
      if (!showModal.value) {
        showNextModal()
      }
    }

    activeQuests.value = b.getActiveQuests().map((item) => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    }))
    completedQuests.value = b.getCompletedQuests().map((item) => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    }))
  }

  function showNextModal(): void {
    if (modalQueue.value.length === 0) {
      showModal.value = false
      return
    }
    const event = modalQueue.value.shift()!
    modalTitle.value = event.title
    modalBody.value = event.body
    showModal.value = true
    if (event.sound === 'newQuest') audioPlayer?.playNewQuest()
    else if (event.sound === 'questComplete') audioPlayer?.playQuestComplete()
  }

  function dismissModal(): void {
    showNextModal()
    // When the last modal is dismissed, restore input acceptance from the bridge
    if (!showModal.value) {
      const b = requireBridge()
      acceptInput.value = b.isAcceptingInput()
      // If this was the act intro modal, fire a look to trigger quest start
      if (pendingLookOnDismiss) {
        pendingLookOnDismiss = false
        showOutput(null, b.look())
        refreshPanels()
        pollQuestEvents()
      } else if (!acceptInput.value && !b.isActRunning()) {
        // Quest completion modals were dismissed but the act has transitioned;
        // drive the transition forward and show the act intro modal.
        triggerActTransitionModals()
      }
    }
  }

  function toggleSection(section: string): void {
    const map: Record<string, typeof showActiveQuests> = {
      activeQuests: showActiveQuests,
      completedQuests: showCompletedQuests,
      inventory: showInventory,
      spells: showSpells,
    }
    const toggle = map[section]
    if (toggle) toggle.value = !toggle.value
  }

  /**
   * Perform Tab completion on the current command input.
   *
   * Mirrors the logic of NestedSuggester.get_suggestion() in the Python engine:
   * - Splits the input into previously-completed tokens and a partial last token.
   * - Traverses the completion tree for the completed tokens.
   * - Collects candidates that match the partial last token as a prefix.
   * - When exactly one candidate is found, auto-expands and keeps going while
   *   each subsequent level also has exactly one option (chain expansion).
   *
   * Returns an object with:
   *   - `newInput`: the expanded command string (unchanged if ambiguous / no match)
   *   - `candidates`: the list of matching next tokens (empty if no match)
   */
  function tabComplete(input: string): {
    newInput: string
    candidates: string[]
  } {
    const tokens = input.split(' ')
    const lastToken = tokens[tokens.length - 1]
    const prevTokens = tokens.slice(0, -1)

    let node: CompletionTree | null = completionTree.value
    for (const token of prevTokens) {
      if (node && token in node) {
        node = node[token]
      } else {
        return { newInput: input, candidates: [] }
      }
    }

    if (!node || typeof node !== 'object') {
      return { newInput: input, candidates: [] }
    }

    const candidates = Object.keys(node).filter((k) => k.startsWith(lastToken))

    if (candidates.length === 1) {
      const words = [...prevTokens, candidates[0]]
      let currentNode: CompletionTree | null = node[candidates[0]]

      while (currentNode && typeof currentNode === 'object') {
        const keys = Object.keys(currentNode)
        if (keys.length === 1) {
          words.push(keys[0])
          currentNode = currentNode[keys[0]]
        } else {
          break
        }
      }

      return { newInput: words.join(' ') + ' ', candidates }
    }

    return { newInput: input, candidates }
  }

  return {
    // State
    loading,
    turns,
    bagHasNew,
    spellsHaveNew,
    loadingStatus,
    roomName,
    roomDescription,
    characters,
    items,
    exits,
    inventory,
    spells,
    activeQuests,
    completedQuests,
    lastOutput,
    introText,
    acceptInput,
    showActiveQuests,
    showCompletedQuests,
    showInventory,
    showSpells,
    showModal,
    modalTitle,
    modalBody,
    musicFile,
    musicInfo,
    // Actions
    setBridge,
    setAudioPlayer,
    initGame,
    submitCommand,
    advanceTurn,
    refreshPanels,
    saveGame,
    loadGame,
    saveNamedGame,
    loadNamedGame,
    listNamedSaves,
    getSaveSlots,
    saveToSlot,
    loadFromSlot,
    pollQuestEvents,
    dismissModal,
    markSeen,
    toggleSection,
    tabComplete,
  }
})

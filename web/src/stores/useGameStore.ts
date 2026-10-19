import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  NamedItem,
  RoomExits,
  CompletionTree,
  NamedSave,
  SaveSlot,
  QuestProgress,
  ActStats,
  RoomWare,
} from '@/types/bridge'
import { renderMarkup } from '@/utils/theme'
import { inventoryChanges, type Chip } from '@/lantern/inventoryChanges'
import { parseQuestNews, type QuestNews } from '@/lantern/parseQuestNews'
import {
  actCompleteText,
  parseActIntro,
  type ActIntro,
} from '@/lantern/parseActIntro'
import type { Chapter } from '@/lantern/chapter'

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
  getRoomWares(): RoomWare[]
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
  getActIntro(): string
  getQuestProgress(): QuestProgress
  getActStats(): ActStats
  readCommand(command: 'stats' | 'help'): string
  newGame(): void
  getQuickSave(): SaveSlot | null
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
  /** The room as found on arrival, kept for the story (null if no room change). */
  arrival: Arrival | null
  /** Quests that started or moved on with this turn (Lantern story only). */
  quests?: QuestNews[]
}

/** What the player found on entering a room (engine markup / names). */
export interface Arrival {
  room: string
  description: string
  characters: string[]
  items: string[]
  /** Direction → destination room name. */
  exits: RoomExits
}

/** Journal tabs that show a dot when something new arrived. */
export type JournalTab = 'bag' | 'spells' | 'quests'

interface QuestEvent {
  title: string
  body: string
  sound: 'newQuest' | 'questComplete' | null
  /** The completed quest (Lantern only), for a pop-up made for it. */
  quest?: QuestNews
  /** An act intro or act completion, for a chapter page (Lantern). */
  chapter?: Chapter
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
  /** What merchants in the room sell (for the Buy action). */
  const roomWares = ref<RoomWare[]>([])

  // --- Panels ---
  const inventory = ref<NamedItem[]>([])
  const spells = ref<NamedItem[]>([])
  /** Bag and spell names as the bridge lists them (markup, not HTML), for commands. */
  const bagEntries = ref<string[]>([])
  const spellEntries = ref<string[]>([])
  /** Journal data as the bridge delivers it (markup, not HTML). */
  const rawInventory = ref<NamedItem[]>([])
  const rawSpells = ref<NamedItem[]>([])
  const rawActiveQuests = ref<NamedItem[]>([])
  const rawCompletedQuests = ref<NamedItem[]>([])
  const activeQuests = ref<NamedItem[]>([])
  const completedQuests = ref<NamedItem[]>([])
  /** Quests done / total in the current act (null until the game starts). */
  const questProgress = ref<QuestProgress | null>(null)

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
  const questsHaveNew = ref(false)
  /** A quest the story asked the journal to open ("Open in journal"). */
  const questToOpen = ref<string | null>(null)
  /** The quest whose details dialog is open (Lantern), by name. */
  const shownQuest = ref<string | null>(null)
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
  /** The completed quest the open pop-up is about (Lantern; else null). */
  const modalQuest = ref<QuestNews | null>(null)
  /** The chapter page the open pop-up is (act intro / complete), else null. */
  const modalChapter = ref<Chapter | null>(null)
  /** The running act's heading, kept for its act-complete page. */
  let currentAct: ActIntro | null = null

  /** A loaded save may be in another act: keep its heading instead. */
  function rememberLoadedAct(b: GameBridge): void {
    currentAct = parseActIntro(b.getActIntro())
  }

  /** Queue an act intro pop-up, with its chapter page. */
  function queueActIntro(raw: string): void {
    currentAct = parseActIntro(raw)
    modalQueue.value.push({
      title: '📖 Act Intro',
      body: renderMarkup(raw),
      sound: null,
      chapter: { kind: 'intro', ...currentAct },
    })
  }
  const modalQueue = ref<QuestEvent[]>([])
  /**
   * The Lantern UI's feedback: new and updated quests go in the story (on the
   * turn that caused them) instead of pop-ups, completions stay pop-ups, and
   * saves and loads are short notices (a toast) instead of story lines.
   */
  const lanternFeedback = ref(false)
  /** The latest save/load notice (Lantern); a new id shows it again. */
  const notice = ref<{ id: number; text: string } | null>(null)
  let nextNoticeId = 1

  /** In the Lantern UI a successful save or load is a notice; true if shown so. */
  function showNotice(result: string, text: string): boolean {
    if (!lanternFeedback.value || result.includes('[failure]')) return false
    notice.value = { id: nextNoticeId++, text }
    return true
  }
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
    {
      chips = command !== null,
      arrive = false,
    }: { chips?: boolean; arrive?: boolean } = {},
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

    // A load shows the room even when it is the same one.
    const roomChanged = arrive || room !== lastTurnRoom
    turns.value.push({
      id: nextTurnId++,
      command,
      text: raw,
      room,
      roomChanged,
      gained,
      lost,
      // The engine only says "You move north to …"; keep what the room looked
      // like now so the story can show it later.
      arrival: roomChanged
        ? {
            room,
            description: b.getRoomDescription(),
            characters: b.getRoomCharacters(),
            items: b.getRoomItems(),
            exits: b.getRoomExits(),
          }
        : null,
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
    questsHaveNew.value = false
  }

  /** The player opened a journal tab: clear its "new" dot. */
  function markSeen(tab: JournalTab): void {
    if (tab === 'bag') bagHasNew.value = false
    else if (tab === 'spells') spellsHaveNew.value = false
    else questsHaveNew.value = false
  }

  /** Open a quest's details (QuestDialog). */
  function showQuest(name: string): void {
    shownQuest.value = name
  }

  /** Show a quest in the journal (its Quests tab), then its details. */
  function openQuestInJournal(name: string): void {
    questToOpen.value = name
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

      openFirstAct(b)
      loading.value = false
    } catch (err) {
      loadingStatus.value = `Error: ${(err as Error).message}`
    }
  }

  /** The game's opening screen (logo + music credits) for the Lantern title page. */
  const titleText = ref('')
  const showTitle = ref(false)

  function dismissTitle(): void {
    showTitle.value = false
  }

  /** From the game's logo to the first act's intro pop-up (input waits for it). */
  function openFirstAct(b: GameBridge): void {
    // Advance SHOW_LOGO → ACT_INTRO: get the logo/splash text for the output area
    const logoRaw = b.advanceTurn()
    introText.value = renderMarkup(logoRaw)
    titleText.value = logoRaw
    showTitle.value = true

    // Advance ACT_INTRO → ACT_RUNNING: get the act intro text
    const actIntroRaw = b.advanceTurn()
    refreshPanels()

    // Block input until the player dismisses the act intro modal
    acceptInput.value = false
    pendingLookOnDismiss = true
    queueActIntro(actIntroRaw)
    if (!showModal.value) {
      showNextModal()
    }
  }

  /** The Lantern UI asks before `quit` / `exit` (see QuitDialog). */
  const quitAsked = ref(false)
  /** Counts restarts, so views can start afresh with a new game. */
  const gameNumber = ref(0)

  /** Start a new game from Act I: the story, dots and pop-ups start empty. */
  function restartGame(): void {
    const b = requireBridge()
    quitAsked.value = false
    gameNumber.value++
    b.newGame()
    turns.value = []
    lastTurnRoom = ''
    lastBag = []
    lastSpells = []
    currentAct = null
    clearNewDots()
    questToOpen.value = null
    shownQuest.value = null
    modalQueue.value = []
    showModal.value = false
    modalQuest.value = null
    modalChapter.value = null
    openFirstAct(b)
  }

  function submitCommand(cmd: string): void {
    if (!acceptInput.value) return
    if (!cmd || !cmd.trim()) return

    const b = requireBridge()
    const command = cmd.trim()
    if (routeSaveOrLoad(command)) return
    if (lanternFeedback.value && /^(quit|exit)$/i.test(command)) {
      quitAsked.value = true
      return
    }
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
    // Read the finished act's numbers before the next act starts.
    const stats = b.getActStats()
    const finished = currentAct
    const texts = b.advanceToRunning().filter((t) => t.trim() !== '')
    if (texts.length === 0) return
    const transitionTexts = texts.slice(0, -1)
    const actIntroText = texts[texts.length - 1]
    const nextAct = parseActIntro(actIntroText).act || undefined
    for (const text of transitionTexts) {
      modalQueue.value.push({
        title: '🏆 Act Complete!',
        body: renderMarkup(text),
        sound: null,
        chapter: {
          kind: 'complete',
          act: finished?.act ?? '',
          title: finished?.title ?? '',
          body: actCompleteText(text),
          stats,
          nextAct,
        },
      })
    }
    queueActIntro(actIntroText)
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
    roomWares.value = b.getRoomWares()
    const bag = b.getInventory()
    const spellList = b.getSpells()
    inventory.value = bag.map(renderItem)
    spells.value = spellList.map(renderItem)
    bagEntries.value = bag.map((entry) => entry.name)
    spellEntries.value = spellList.map((entry) => entry.name)
    rawInventory.value = bag
    rawSpells.value = spellList
    const active = b.getActiveQuests()
    const completed = b.getCompletedQuests()
    activeQuests.value = active.map(renderItem)
    completedQuests.value = completed.map(renderItem)
    rawActiveQuests.value = active
    rawCompletedQuests.value = completed
    questProgress.value = b.getQuestProgress()
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

  /** Quick save; true when the game was saved (a failure goes in the story). */
  function saveGame(command: string | null = null): boolean {
    const b = requireBridge()
    const result = b.quickSaveGame()
    if (!showNotice(result, 'Game saved'))
      showOutput(command, result, { chips: false })
    return saved(result)
  }

  /** A save's answer says it worked (not a failure). */
  function saved(result: string): boolean {
    return !result.includes('[failure]')
  }

  function loadGame(command: string | null = null): void {
    const b = requireBridge()
    const result = b.quickLoadGame()
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(command, result, 'Game loaded')
    refreshPanels()
  }

  function saveNamedGame(name: string, command: string | null = null): boolean {
    const b = requireBridge()
    const result = b.saveNamedGame(name)
    if (!showNotice(result, `Game saved · ${name}`))
      showOutput(command, result, { chips: false })
    return saved(result)
  }

  function loadNamedGame(name: string, command: string | null = null): void {
    const b = requireBridge()
    const result = b.loadNamedGame(name)
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(command, result, `Game loaded · ${name}`)
    refreshPanels()
  }

  /** A load: a notice and the room in the story (Lantern), or the engine's text. */
  function showLoaded(
    command: string | null,
    result: string,
    text: string,
  ): void {
    if (showNotice(result, text))
      showOutput(null, '', { chips: false, arrive: true })
    else showOutput(command, result, { chips: false })
  }

  /** The engine's stats or help text, for a dialog (adds nothing to the story). */
  function readInfo(kind: 'stats' | 'help'): string {
    return requireBridge().readCommand(kind)
  }

  function listNamedSaves(): NamedSave[] {
    const b = requireBridge()
    return b.listNamedSaves()
  }

  function getQuickSave(): SaveSlot | null {
    return requireBridge().getQuickSave()
  }

  function getSaveSlots(): SaveSlot[] {
    const b = requireBridge()
    return b.getSaveSlots()
  }

  function saveToSlot(slot: number): boolean {
    const b = requireBridge()
    const result = b.saveToSlot(slot)
    if (!showNotice(result, `Game saved · Slot ${slot}`))
      showOutput(null, result)
    return saved(result)
  }

  function loadFromSlot(slot: number): void {
    const b = requireBridge()
    const result = b.loadFromSlot(slot)
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(null, result, `Game loaded · Slot ${slot}`)
    refreshPanels()
  }

  function pollQuestEvents(): void {
    const b = requireBridge()
    const events: QuestEvent[] = []

    const news: QuestNews[] = []

    let activated: string | null
    while ((activated = b.activateQuest()) !== null) {
      if (lanternFeedback.value) news.push(parseQuestNews('new', activated))
      else
        events.push({
          title: '📜 New Quest!',
          body: renderMarkup(activated),
          sound: 'newQuest',
        })
    }

    let updated: string | null
    while ((updated = b.updateQuest()) !== null) {
      if (lanternFeedback.value) news.push(parseQuestNews('updated', updated))
      else
        events.push({
          title: '📜 Quest Updated',
          body: renderMarkup(updated),
          sound: 'newQuest',
        })
    }

    let completed: string | null
    const completions: string[] = []
    const completionEvents: QuestEvent[] = []
    while ((completed = b.completeQuest()) !== null) {
      completions.push(completed)
      completionEvents.push({
        title: '🏆 Quest Complete!',
        body: renderMarkup(completed),
        sound: 'questComplete',
      })
    }
    events.push(...completionEvents)

    // Completions also stay in the story as records, each with the act's
    // quest count as it stood once that quest was done.
    if (lanternFeedback.value && completions.length) {
      const { completed: done, total } = b.getQuestProgress()
      completions.forEach((payload, index) => {
        const record: QuestNews = {
          ...parseQuestNews('completed', payload),
          progress: {
            completed: done - (completions.length - 1 - index),
            total,
          },
        }
        news.push(record)
        completionEvents[index].quest = record
      })
    }

    // A completion's fanfare alone marks the turn; the chime would clash.
    const turn = turns.value.at(-1)
    if (news.length && turn) {
      turn.quests = [...(turn.quests ?? []), ...news]
      questsHaveNew.value = true
      if (!completions.length) audioPlayer?.playNewQuest()
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
      modalQuest.value = null
      modalChapter.value = null
      return
    }
    const event = modalQueue.value.shift()!
    modalTitle.value = event.title
    modalBody.value = event.body
    modalQuest.value = event.quest ?? null
    modalChapter.value = event.chapter ?? null
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
        // The look may start quests: list them (as submitCommand does).
        refreshPanels()
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
    questProgress,
    roomWares,
    bagEntries,
    spellEntries,
    completionTree,
    lanternFeedback,
    readInfo,
    quitAsked,
    titleText,
    showTitle,
    dismissTitle,
    gameNumber,
    restartGame,
    getQuickSave,
    notice,
    rawInventory,
    rawSpells,
    rawActiveQuests,
    rawCompletedQuests,
    bagHasNew,
    spellsHaveNew,
    questsHaveNew,
    questToOpen,
    shownQuest,
    showQuest,
    openQuestInJournal,
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
    modalQuest,
    modalChapter,
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

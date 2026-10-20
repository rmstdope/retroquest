import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  NamedItem,
  RoomExits,
  CompletionTree,
  SaveSlot,
  QuestProgress,
  RoomWare,
} from '@/types/bridge'
import type { useBridge } from '@/composables/useBridge'
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
 * The bridge injected via setBridge(): the type `useBridge()` returns, so a new
 * `GameController` member reaches the store without being declared again.
 */
export type GameBridge = ReturnType<typeof useBridge>

/** Minimal interface required for quest sound-effect playback. */
export interface QuestAudioPlayer {
  playNewQuest(): void
  playQuestComplete(): void
}

/** Most recent turns kept for the story view; older ones are dropped. */
export const MAX_TURNS = 200

/** Key in the completion tree marking that the command can be sent here. */
const SENDABLE_MARKER = '@'

/** What the Type mode word list shows for the text in the command box. */
export interface CompletionState {
  kind: 'matches' | 'none' | 'complete'
  candidates: string[]
  sendable: boolean
  /** The last word as typed ('' after a space); for `none` the last non-empty word. */
  word: string
}

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
  /** Quests that started, moved on or were completed with this turn. */
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

/** A pop-up waiting its turn: a quest completion or a chapter page. */
interface QuestEvent {
  title: string
  body: string
  sound: 'questComplete' | null
  /** The completed quest, for a pop-up made for it. */
  quest?: QuestNews
  /** An act intro or act completion, for a chapter page. */
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
  /** The engine could not start (loadingStatus says why). */
  const loadFailed = ref(false)

  // --- Room data ---
  const roomName = ref('')
  const roomDescription = ref('')
  const characters = ref<string[]>([])
  const items = ref<string[]>([])
  /** Short item names the story uses ("journal") → full names (room and bag). */
  const shortNames = ref<Record<string, string>>({})
  const exits = ref<RoomExits>({})
  /** What merchants in the room sell (for the Buy action). */
  const roomWares = ref<RoomWare[]>([])

  // --- Journal ---
  /** Bag and spell names as the bridge lists them (markup, not HTML), for commands. */
  const bagEntries = ref<string[]>([])
  const spellEntries = ref<string[]>([])
  /** Journal data as the bridge delivers it (markup, not HTML). */
  const rawInventory = ref<NamedItem[]>([])
  const rawSpells = ref<NamedItem[]>([])
  const rawActiveQuests = ref<NamedItem[]>([])
  const rawCompletedQuests = ref<NamedItem[]>([])
  /** Quests done / total in the current act (null until the game starts). */
  const questProgress = ref<QuestProgress | null>(null)

  // --- Story ---
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
  /** The quest whose details dialog is open, by name. */
  const shownQuest = ref<string | null>(null)

  // --- Input ---
  const acceptInput = ref(false)

  // --- Completion tree (refreshed after every command / panel refresh) ---
  const completionTree = ref<CompletionTree>({})

  // --- Modal ---
  const showModal = ref(false)
  const modalTitle = ref('')
  const modalBody = ref('')
  /** The completed quest the open pop-up is about, else null. */
  const modalQuest = ref<QuestNews | null>(null)
  /** The chapter page the open pop-up is (act intro / complete), else null. */
  const modalChapter = ref<Chapter | null>(null)
  /** The running act's heading, kept for its act-complete page. */
  let currentAct: ActIntro | null = null
  /** The answer to the player's latest command (the end screen's text). */
  let lastAnswer = ''

  // --- The end of the game (after the last act) ---
  /** The save dialog over the last act's chapter page is open. */
  const finishAsked = ref(false)
  /** The end screen: the final answer and whether the game was saved. */
  const ending = ref<{ text: string; saved: boolean } | null>(null)

  /** A loaded save may be in another act: keep its heading instead. */
  function rememberLoadedAct(b: GameBridge): void {
    currentAct = parseActIntro(b.controller.getActIntro())
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
  /**
   * Pop-ups wait here. New and updated quests are not pop-ups: they go in the
   * story, on the turn that caused them.
   */
  const modalQueue = ref<QuestEvent[]>([])
  /** The latest save/load notice (a toast); a new id shows it again. */
  const notice = ref<{ id: number; text: string } | null>(null)
  let nextNoticeId = 1

  /** A successful save or load is a notice, not a story line; true if shown so. */
  function showNotice(result: string, text: string): boolean {
    if (result.includes('[failure]')) return false
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
   * Show an engine answer: record it as a turn in the story log.
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
    const b = requireBridge()
    // The command that ends the game keeps its room and chips.
    const actRunning = b.controller.isActRunning() || b.controller.isGameOver()
    const room = actRunning ? b.controller.getRoomName() : lastTurnRoom
    const bag = b.controller.getInventory().map((entry) => entry.name)
    const spellList = b.controller.getSpells().map((entry) => entry.name)
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
            description: b.controller.getRoomDescription(),
            characters: b.controller.getRoomCharacters(),
            items: b.controller.getRoomItems(),
            exits: b.controller.getRoomExits(),
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
      console.error(err)
      loadingStatus.value = `Error: ${(err as Error).message}`
      loadFailed.value = true
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
    // Advance SHOW_LOGO → ACT_INTRO: get the logo/splash text for the title page
    const logoRaw = b.controller.advanceTurn()
    titleText.value = logoRaw
    showTitle.value = true

    // Advance ACT_INTRO → ACT_RUNNING: get the act intro text
    const actIntroRaw = b.controller.advanceTurn()
    refreshPanels()

    // Block input until the player dismisses the act intro modal
    acceptInput.value = false
    pendingLookOnDismiss = true
    queueActIntro(actIntroRaw)
    if (!showModal.value) {
      showNextModal()
    }
  }

  /** The UI asks before `quit` / `exit` (see QuitDialog). */
  const quitAsked = ref(false)
  /** Counts restarts, so views can start afresh with a new game. */
  const gameNumber = ref(0)

  /** Start a new game from Act I: the story, dots and pop-ups start empty. */
  function restartGame(): void {
    const b = requireBridge()
    quitAsked.value = false
    finishAsked.value = false
    ending.value = null
    lastAnswer = ''
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

    requireBridge()
    const command = cmd.trim()
    if (routeSaveOrLoad(command)) return
    if (/^(quit|exit)$/i.test(command)) {
      quitAsked.value = true
      return
    }
    if (import.meta.env.DEV) {
      const script = /^debug\s+(\S+)$/i.exec(command)
      if (script) {
        void runDebugScript(script[1].toLowerCase())
        return
      }
    }
    playCommand(command)
  }

  /** Run one command as the player typed it: log it, refresh, raise quest news. */
  function playCommand(command: string): string {
    const b = requireBridge()
    const result = b.controller.takeTurn(command)
    lastAnswer = result
    showOutput(command, result)
    refreshPanels()
    pollQuestEvents()
    refreshPanels()
    if (
      !acceptInput.value &&
      !showModal.value &&
      !b.controller.isActRunning()
    ) {
      afterActEnds()
    }
    return result
  }

  /**
   * Dev only (`debug <name>`): play the dev server's script `<name>` as
   * typed commands (see `@/utils/debugScript`). The module is imported under
   * the DEV flag only, so a production build carries none of it.
   */
  async function runDebugScript(name: string): Promise<void> {
    if (!import.meta.env.DEV) return
    const { playDebugScript } = await import('@/utils/debugScript')
    await playDebugScript(name, {
      play: playCommand,
      running: () => requireBridge().controller.isActRunning(),
      show: (text) => showOutput(`debug ${name}`, text, { chips: false }),
    })
  }

  /** An act has ended: the last one closes the game, any other leads on. */
  function afterActEnds(): void {
    if (requireBridge().controller.isGameOver()) queueGameOver()
    else triggerActTransitionModals()
  }

  /** The last act's chapter page, whose button finishes the game. */
  function queueGameOver(): void {
    const b = requireBridge()
    const text = b.controller.getResultText()
    modalQueue.value.push({
      title: '🏆 Act Complete!',
      body: renderMarkup(text),
      sound: null,
      chapter: {
        kind: 'complete',
        act: currentAct?.act ?? '',
        title: currentAct?.title ?? '',
        body: actCompleteText(text),
        stats: b.controller.getActStats(),
        final: true,
      },
    })
    if (!showModal.value) showNextModal()
  }

  /** A chapter page's button: the final one asks to save, others go on. */
  function continueChapter(): void {
    if (modalChapter.value?.final) finishAsked.value = true
    else dismissModal()
  }

  /** Close the save dialog: back to the last act's chapter page. */
  function cancelFinish(): void {
    finishAsked.value = false
  }

  /**
   * Finish the game, after a quick save when `save` is set (no notice: the
   * end screen says it). A failed save changes nothing and returns false.
   */
  function finishGame(save: boolean): boolean {
    if (save && !saved(requireBridge().quickSaveGame())) return false
    finishAsked.value = false
    modalQueue.value = []
    showModal.value = false
    modalQuest.value = null
    modalChapter.value = null
    ending.value = { text: lastAnswer, saved: save }
    return true
  }

  function triggerActTransitionModals(): void {
    const b = requireBridge()
    // Read the finished act's numbers before the next act starts.
    const stats = b.controller.getActStats()
    const finished = currentAct
    const texts = b.controller.advanceToRunning().filter((t) => t.trim() !== '')
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

  /** Read the room, journal, music, input state and completions from the bridge. */
  function refreshPanels(): void {
    const b = requireBridge()
    roomName.value = b.controller.getRoomName()
    roomDescription.value = b.controller.getRoomDescription()
    characters.value = b.controller.getRoomCharacters()
    items.value = b.controller.getRoomItems()
    exits.value = b.controller.getRoomExits()
    roomWares.value = b.controller.getRoomWares()
    const bag = b.controller.getInventory()
    const spellList = b.controller.getSpells()
    bagEntries.value = bag.map((entry) => entry.name)
    spellEntries.value = spellList.map((entry) => entry.name)
    rawInventory.value = bag
    rawSpells.value = spellList
    rawActiveQuests.value = b.controller.getActiveQuests()
    rawCompletedQuests.value = b.controller.getCompletedQuests()
    questProgress.value = b.controller.getQuestProgress()
    const m = b.controller.getCurrentMusic()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
    acceptInput.value = b.controller.isAcceptingInput()
    completionTree.value = b.controller.getCommandCompletions()
    shortNames.value = b.controller.getShortNames()
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

  /** A load: a notice and the room in the story, or the engine's failure. */
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
    return requireBridge().controller.handleCommand(kind)
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

  /**
   * Collect the engine's quest events: new and updated quests go in the story
   * on the latest turn (with a chime); each completion is also a pop-up.
   */
  function pollQuestEvents(): void {
    const b = requireBridge()
    const news: QuestNews[] = []

    let activated: string | null
    while ((activated = b.controller.activateQuest()) !== null) {
      news.push(parseQuestNews('new', activated))
    }

    let updated: string | null
    while ((updated = b.controller.updateQuest()) !== null) {
      news.push(parseQuestNews('updated', updated))
    }

    let completed: string | null
    const completions: string[] = []
    while ((completed = b.controller.completeQuest()) !== null) {
      completions.push(completed)
    }

    // Completions also stay in the story as records, each with the act's
    // quest count as it stood once that quest was done.
    const events: QuestEvent[] = []
    if (completions.length) {
      const { completed: done, total } = b.controller.getQuestProgress()
      completions.forEach((payload, index) => {
        const record: QuestNews = {
          ...parseQuestNews('completed', payload),
          progress: {
            completed: done - (completions.length - 1 - index),
            total,
          },
        }
        news.push(record)
        events.push({
          title: '🏆 Quest Complete!',
          body: renderMarkup(payload),
          sound: 'questComplete',
          quest: record,
        })
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
    if (event.sound === 'questComplete') audioPlayer?.playQuestComplete()
  }

  function dismissModal(): void {
    showNextModal()
    // When the last modal is dismissed, restore input acceptance from the bridge
    if (!showModal.value) {
      const b = requireBridge()
      acceptInput.value = b.controller.isAcceptingInput()
      // If this was the act intro modal, fire a look to trigger quest start
      if (pendingLookOnDismiss) {
        pendingLookOnDismiss = false
        showOutput(null, b.controller.look())
        refreshPanels()
        pollQuestEvents()
        // The look may start quests: list them (as submitCommand does).
        refreshPanels()
      } else if (!acceptInput.value && !b.controller.isActRunning()) {
        // Quest completion modals were dismissed but the act has ended:
        // show the next act's pages, or the last act's final page.
        afterActEnds()
      }
    }
  }

  /**
   * Perform Tab completion on the current command input.
   *
   * Mirrors the logic of NestedSuggester.get_suggestion() in the engine:
   * - Splits the input into previously-completed tokens and a partial last token.
   * - Traverses the completion tree for the completed tokens.
   * - Collects candidates that match the partial last token as a prefix
   *   (the `@` "can be sent here" marker is never a candidate).
   * - When exactly one candidate is found, auto-expands and keeps going while
   *   each subsequent level also has exactly one option (chain expansion). The
   *   expansion stops where the command can already be sent (a `@` marker).
   *
   * Returns an object with:
   *   - `newInput`: the expanded command string (unchanged if ambiguous / no match)
   *   - `candidates`: the list of matching next tokens (empty if no match)
   */
  function tabComplete(input: string): {
    newInput: string
    candidates: string[]
  } {
    const tokens = input.toLowerCase().split(' ')
    const lastToken = tokens[tokens.length - 1]
    const prevTokens = tokens.slice(0, -1)

    let node: CompletionTree | null = completionTree.value
    for (const token of prevTokens) {
      if (node && token !== SENDABLE_MARKER && Object.hasOwn(node, token)) {
        node = node[token]
      } else {
        return { newInput: input, candidates: [] }
      }
    }

    if (!node || typeof node !== 'object') {
      return { newInput: input, candidates: [] }
    }

    const candidates = Object.keys(node).filter(
      (k) => k !== SENDABLE_MARKER && k.startsWith(lastToken),
    )
    const sendableHere = lastToken === '' && SENDABLE_MARKER in node

    if (candidates.length === 1 && !sendableHere) {
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

  /**
   * What the word list shows for the command box text: the words that could
   * come next for the word being typed, whether the text can already be sent
   * as a command, and which of three states the list is in — `matches` (some
   * words to offer), `none` (an earlier word is unknown, or the last word
   * matches nothing) or `complete` (the command needs no more words). Matching
   * ignores case; `word` is the last word as typed.
   */
  function completionState(input: string): CompletionState {
    const typed = input.trimStart().toLowerCase()
    const tokens = typed.split(/ +/)
    const last = tokens[tokens.length - 1]
    const typedWords = input.trim().split(/ +/)
    const word = typed.endsWith(' ') ? '' : typedWords[typedWords.length - 1]
    // An unknown word is quoted even when a space follows it.
    const none: CompletionState = {
      kind: 'none',
      candidates: [],
      sendable: false,
      word: typedWords[typedWords.length - 1],
    }

    let node: CompletionTree | null = completionTree.value
    for (const token of tokens.slice(0, -1)) {
      if (node === null) {
        // Words after a finished command: nothing to offer.
        return { ...none, kind: 'complete', sendable: true }
      }
      if (token === SENDABLE_MARKER || !Object.hasOwn(node, token)) return none
      node = node[token]
    }
    if (node === null) return { ...none, kind: 'complete', sendable: true }

    const candidates = Object.keys(node).filter(
      (k) => k !== SENDABLE_MARKER && k.startsWith(last),
    )
    const endNode =
      last === '' ? node : Object.hasOwn(node, last) ? node[last] : undefined
    const sendable =
      tokens.length > 1 || last !== ''
        ? endNode === null ||
          (endNode !== undefined && SENDABLE_MARKER in endNode)
        : false
    const finished =
      last === ''
        ? candidates.length === 0
        : candidates.length === 1 && candidates[0] === last && endNode === null
    if (finished)
      return { kind: 'complete', candidates: [], sendable: true, word }
    if (candidates.length === 0) return { ...none, sendable }
    return { kind: 'matches', candidates, sendable, word }
  }

  return {
    runDebugScript,
    // State
    loading,
    turns,
    questProgress,
    roomWares,
    bagEntries,
    spellEntries,
    completionTree,
    shortNames,
    readInfo,
    quitAsked,
    finishAsked,
    ending,
    continueChapter,
    cancelFinish,
    finishGame,
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
    loadFailed,
    roomName,
    roomDescription,
    characters,
    items,
    exits,
    acceptInput,
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
    refreshPanels,
    saveGame,
    loadGame,
    saveNamedGame,
    loadNamedGame,
    getSaveSlots,
    saveToSlot,
    loadFromSlot,
    pollQuestEvents,
    dismissModal,
    markSeen,
    tabComplete,
    completionState,
  }
})

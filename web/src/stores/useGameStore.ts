import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  NamedItem,
  RoomExits,
  CompletionTree,
  SaveSlot,
  QuestProgress,
  QuestSummary,
  RoomWare,
} from '@/types/bridge'
import type { useBridge } from '@/composables/useBridge'
import { normalizeSaveName } from '@/engine'
import { inventoryChanges, type Chip } from '@/lantern/inventoryChanges'
import { toQuestNews, type QuestNews } from '@/lantern/questNews'
import { parseActIntro, type ActIntro } from '@/lantern/parseActIntro'
import { actFolder } from '@/lantern/narrationManifest'
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
  /** The room as found on arrival or on a look, kept for the story (null otherwise). */
  arrival: Arrival | null
  /** Quests that started, moved on or were completed with this turn. */
  quests?: QuestNews[]
  /** Set on a player's command and on the arrival that opens an act: its answer is narrated (never on a load). */
  narrate?: true
  /** Set when the turn arrived in a room the player had not been in before. */
  firstVisit?: true
  /** Set on a narrated look: the room is shown and read again without a move. */
  lookedAround?: true
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

/**
 * The side panels that wait for a narrated turn, in groups that switch
 * together: `place` (room card, Here, map, header room and act), `quests`
 * (the quest count, progress and dot) and `stock` (Bag and Spells with their dots).
 */
export type PanelGroup = 'place' | 'quests' | 'stock'

/** Every panel group. */
export const PANEL_GROUPS: readonly PanelGroup[] = ['place', 'quests', 'stock']

/** What the engine says the panels of each group show right now. */
interface PanelSnapshot {
  place: {
    roomName: string
    roomDescription: string
    characters: string[]
    items: string[]
    exits: RoomExits
    roomWares: RoomWare[]
    actNumber: number | null
    /** What the command box offers: words of the place the panels show. */
    completions: CompletionTree
  }
  quests: {
    activeQuests: QuestSummary[]
    completedQuests: QuestSummary[]
    progress: QuestProgress
  }
  stock: {
    bag: NamedItem[]
    spells: NamedItem[]
  }
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
  const activeQuests = ref<QuestSummary[]>([])
  const completedQuests = ref<QuestSummary[]>([])
  /** Quests done / total in the current act (null until the game starts). */
  const questProgress = ref<QuestProgress | null>(null)

  // --- Story ---
  const turns = ref<Turn[]>([])
  let nextTurnId = 1
  let lastTurnRoom = ''
  /** The rooms visited as of the last turn, to tell a first visit. */
  let lastVisited: string[] = []
  // Bag and spells as the bridge listed them after the previous turn
  let lastBag: string[] = []
  let lastSpells: string[] = []
  const bagHasNew = ref(false)
  const spellsHaveNew = ref(false)
  const questsHaveNew = ref(false)

  // --- Panels held while a turn is narrated ---
  /** Whether a narrated command holds the panels (the layout turns it on). */
  let panelHoldEnabled = false
  /** The turn whose panels are held, or null. */
  const heldTurn = ref<number | null>(null)
  const held = ref<Record<PanelGroup, boolean>>({
    place: false,
    quests: false,
    stock: false,
  })
  /** Counts each group's switches that should light up (a new value lights again). */
  const panelFlash = ref<Record<PanelGroup, number>>({
    place: 0,
    quests: 0,
    stock: 0,
  })
  /** What the engine showed at the last refresh; held groups apply it on release. */
  let latest: PanelSnapshot | null = null
  /** Dots earned while their group is held. */
  let pendingDots: Record<JournalTab, boolean> = {
    bag: false,
    spells: false,
    quests: false,
  }
  /** True while a narrated turn holds some panel. */
  const panelsHeld = computed(() => PANEL_GROUPS.some((g) => held.value[g]))
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
  /** The chapter page that is open (act intro / complete), else null. */
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

  /** The running act's heading label ("Act I"), empty before an act has started. */
  const actLabel = ref('')
  /** The folder of the running act's recordings (`act1`...), or null before an act has started. */
  const narrationFolder = computed(() => actFolder(actLabel.value))

  /** A loaded save may be in another act: keep its heading instead. */
  function rememberLoadedAct(b: GameBridge): void {
    currentAct = parseActIntro(b.controller.getActIntro())
    actLabel.value = currentAct.act
  }

  /** Queue an act intro pop-up, with its chapter page. */
  function queueActIntro(raw: string): void {
    currentAct = parseActIntro(raw)
    actLabel.value = currentAct.act
    modalQueue.value.push({ kind: 'intro', ...currentAct })
  }
  /**
   * Chapter pages (act intros and completions) wait here. Quest news is never
   * a page: it goes in the story, on the turn that caused it.
   */
  const modalQueue = ref<Chapter[]>([])
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
   * `redescribe` (a look) shows the room again although the player stayed.
   */
  function showOutput(
    command: string | null,
    raw: string,
    {
      chips = command !== null,
      arrive = false,
      redescribe = false,
      narrate = false,
      hold = false,
    }: {
      chips?: boolean
      arrive?: boolean
      redescribe?: boolean
      narrate?: boolean
      hold?: boolean
    } = {},
  ): void {
    const b = requireBridge()
    const turnId = nextTurnId++
    // A player's command in a narrated game keeps the panels as they were
    // until the narration reaches them (see `releasePanels`).
    if (hold) startHold(turnId)
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
    if (showChips && itemChanges.gained.length) markNew('bag')
    if (showChips && spellChanges.gained.length) markNew('spells')
    lastBag = bag
    lastSpells = spellList

    // A load shows the room even when it is the same one.
    const roomChanged = arrive || room !== lastTurnRoom
    // A room is new when it joins the visited rooms. Compared by name, as a
    // room can also leave the list (the dream, once Elior wakes).
    const visited = b.controller.getVisitedRooms()
    const lookedAround = redescribe && actRunning && !roomChanged
    const firstVisit =
      actRunning && visited.includes(room) && !lastVisited.includes(room)
    lastVisited = visited
    turns.value.push({
      id: turnId,
      command,
      text: raw,
      room,
      roomChanged,
      gained,
      lost,
      // The engine only says "You move north to …"; keep what the room looked
      // like now so the story can show it later.
      ...(narrate ? { narrate: true as const } : {}),
      ...(narrate && firstVisit ? { firstVisit: true as const } : {}),
      ...(narrate && lookedAround ? { lookedAround: true as const } : {}),
      // A look shows the room again without having moved.
      arrival:
        roomChanged || lookedAround
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

  /** Let a command's panels wait (applying an older turn's first). */
  function startHold(turnId: number): void {
    if (!panelHoldEnabled) return
    if (heldTurn.value !== null)
      releasePanels(heldTurn.value, [...PANEL_GROUPS], false)
    heldTurn.value = turnId
    held.value = { place: true, quests: true, stock: true }
  }

  /** Whether the panels of `group` are in the hold. */
  function groupOf(tab: JournalTab): PanelGroup {
    return tab === 'quests' ? 'quests' : 'stock'
  }

  /** Something new for a journal tab: its dot shows now, or when its group is released. */
  function markNew(tab: JournalTab): void {
    if (held.value[groupOf(tab)]) pendingDots[tab] = true
    else setDot(tab, true)
  }

  /** Set a journal tab's dot. */
  function setDot(tab: JournalTab, on: boolean): void {
    if (tab === 'bag') bagHasNew.value = on
    else if (tab === 'spells') spellsHaveNew.value = on
    else questsHaveNew.value = on
  }

  /** What the panels of `group` show now, to tell whether a release changed them. */
  function shownState(group: PanelGroup): string {
    if (group === 'place')
      return JSON.stringify([
        roomName.value,
        roomDescription.value,
        characters.value,
        items.value,
        exits.value,
        questProgress.value?.actNumber,
      ])
    if (group === 'quests')
      return JSON.stringify([
        activeQuests.value,
        completedQuests.value,
        questProgress.value?.completed,
        questProgress.value?.total,
        questsHaveNew.value,
      ])
    return JSON.stringify([
      rawInventory.value,
      rawSpells.value,
      bagHasNew.value,
      spellsHaveNew.value,
    ])
  }

  /** Put a group's latest values on the panels. */
  function applyGroup(group: PanelGroup): void {
    if (!latest) return
    if (group === 'place') {
      const place = latest.place
      roomName.value = place.roomName
      roomDescription.value = place.roomDescription
      characters.value = place.characters
      items.value = place.items
      exits.value = place.exits
      roomWares.value = place.roomWares
      completionTree.value = place.completions
      if (questProgress.value && place.actNumber !== null)
        questProgress.value = {
          ...questProgress.value,
          actNumber: place.actNumber,
        }
    } else if (group === 'quests') {
      const quests = latest.quests
      activeQuests.value = quests.activeQuests
      completedQuests.value = quests.completedQuests
      questProgress.value = {
        ...quests.progress,
        actNumber: questProgress.value?.actNumber ?? quests.progress.actNumber,
      }
    } else {
      const stock = latest.stock
      rawInventory.value = stock.bag
      rawSpells.value = stock.spells
      bagEntries.value = stock.bag.map((entry) => entry.name)
      spellEntries.value = stock.spells.map((entry) => entry.name)
    }
  }

  /**
   * The narration of turn `turnId` has reached `groups`: they show the
   * engine's state now (and their dots), lighting up when `flash` is set. Does
   * nothing for another turn than the one held, or for a group already released.
   */
  function releasePanels(
    turnId: number,
    groups: PanelGroup[],
    flash: boolean,
  ): void {
    if (turnId !== heldTurn.value) return
    for (const group of groups) {
      if (!held.value[group]) continue
      held.value[group] = false
      const before = shownState(group)
      applyGroup(group)
      for (const tab of ['bag', 'spells', 'quests'] as const)
        if (groupOf(tab) === group && pendingDots[tab]) {
          pendingDots[tab] = false
          setDot(tab, true)
        }
      // Only a panel that changed lights up.
      if (flash && shownState(group) !== before) panelFlash.value[group]++
    }
    if (!panelsHeld.value) heldTurn.value = null
  }

  /** Forget a hold without applying it (a load or a new game refreshes the panels itself). */
  function dropHold(): void {
    heldTurn.value = null
    held.value = { place: false, quests: false, stock: false }
    pendingDots = { bag: false, spells: false, quests: false }
  }

  /** Let the layout hold the panels of narrated commands (off: they change at once). */
  function setPanelHold(enabled: boolean): void {
    panelHoldEnabled = enabled
    if (!enabled && heldTurn.value !== null)
      releasePanels(heldTurn.value, [...PANEL_GROUPS], false)
  }

  /** A loaded save or a new act: no item or spell is "new" any more. */
  function clearNewDots(): void {
    pendingDots = { bag: false, spells: false, quests: false }
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

  /**
   * Play the sound owed by quest cards `cards` (indices into turn `turnId`'s
   * quests) as they show, once for all of them so cards shown together do not
   * stack: the fanfare when one of them completes a quest, else the chime.
   * Cards with nothing owed play nothing.
   */
  function ringQuestSounds(turnId: number, cards: number[]): void {
    const quests = turns.value.find((entry) => entry.id === turnId)?.quests
    const owed = cards
      .map((index) => quests?.[index])
      .filter((news): news is QuestNews => !!news?.chime || !!news?.fanfare)
    if (!owed.length) return
    const fanfare = owed.some((news) => news.fanfare)
    for (const news of owed) {
      delete news.chime
      delete news.fanfare
    }
    if (fanfare) audioPlayer?.playQuestComplete()
    else audioPlayer?.playNewQuest()
  }

  /**
   * Whether the act-complete page must wait for turn `turn` (the act's last)
   * to be read aloud; set by the story view (`setActEndGate`). With no gate,
   * the page opens at once.
   */
  let actEndGate: ((turn: Turn) => boolean) | null = null
  /** The act has ended and its page waits for the last turn's narration. */
  const actEndPending = ref(false)

  /** Let the story view hold the act-complete page while the act's last turn is read. */
  function setActEndGate(gate: ((turn: Turn) => boolean) | null): void {
    actEndGate = gate
  }

  /** The last turn has been read: open the act-complete page that was held. */
  function resumeActEnd(): void {
    if (!actEndPending.value) return
    actEndPending.value = false
    afterActEnds()
  }

  /**
   * A save asked for while the act-complete page is held opens the page and
   * saves nothing (true then): the act is over, so there is nothing to save
   * until the next act begins.
   */
  function openHeldActEnd(): boolean {
    if (!actEndPending.value) return false
    resumeActEnd()
    return true
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
    actEndPending.value = false
    ending.value = null
    lastAnswer = ''
    gameNumber.value++
    b.newGame()
    dropHold()
    turns.value = []
    lastTurnRoom = ''
    lastVisited = []
    lastBag = []
    lastSpells = []
    currentAct = null
    actLabel.value = ''
    clearNewDots()
    questToOpen.value = null
    shownQuest.value = null
    modalQueue.value = []
    showModal.value = false
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
    showOutput(command, result, {
      redescribe: b.controller.lastTurnRedescribesRoom(),
      narrate: true,
      hold: true,
    })
    refreshPanels()
    pollQuestEvents()
    refreshPanels()
    if (
      !acceptInput.value &&
      !showModal.value &&
      !b.controller.isActRunning()
    ) {
      const last = turns.value.at(-1)
      if (last && actEndGate?.(last)) actEndPending.value = true
      else afterActEnds()
    }
    return result
  }

  /**
   * Dev only (`debug <name>`): play the dev server's script `<name>` as
   * typed commands (see `@/utils/debugScript`). The module is imported under
   * the DEV flag only, so a production build carries none of it. When the
   * script ends the panels show the engine's state at once, not after the
   * last command's narration.
   */
  async function runDebugScript(name: string): Promise<void> {
    if (!import.meta.env.DEV) return
    const { playDebugScript } = await import('@/utils/debugScript')
    try {
      await playDebugScript(name, {
        play: playCommand,
        running: () => requireBridge().controller.isActRunning(),
        goldenPath: (n) => requireBridge().controller.goldenPath(n),
        show: (text) => showOutput(`debug ${name}`, text, { chips: false }),
      })
    } finally {
      // The last command's narration would hold the panels on the room the
      // script started in; show where it ended.
      if (heldTurn.value !== null)
        releasePanels(heldTurn.value, [...PANEL_GROUPS], false)
    }
  }

  /** An act has ended: the last one closes the game, any other leads on. */
  function afterActEnds(): void {
    if (requireBridge().controller.isGameOver()) queueGameOver()
    else triggerActTransitionModals()
  }

  /** The last act's chapter page, whose button finishes the game. */
  function queueGameOver(): void {
    const b = requireBridge()
    modalQueue.value.push({
      kind: 'complete',
      act: currentAct?.act ?? '',
      title: currentAct?.title ?? '',
      body: b.controller.getActCompleteText() ?? '',
      stats: b.controller.getActStats(),
      final: true,
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
    modalChapter.value = null
    ending.value = { text: lastAnswer, saved: save }
    return true
  }

  function triggerActTransitionModals(): void {
    const b = requireBridge()
    // Read the finished act's numbers before the next act starts.
    const stats = b.controller.getActStats()
    const finished = currentAct
    const screens = b.controller
      .advanceToRunning()
      .filter((screen) => screen.text.trim() !== '')
    if (screens.length === 0) return
    const transitionScreens = screens.slice(0, -1)
    const actIntroText = screens[screens.length - 1].text
    const nextAct = parseActIntro(actIntroText).act || undefined
    for (const { actComplete } of transitionScreens) {
      modalQueue.value.push({
        kind: 'complete',
        act: finished?.act ?? '',
        title: finished?.title ?? '',
        body: actComplete ?? '',
        stats,
        nextAct,
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
    const bag = b.controller.getInventory()
    const spellList = b.controller.getSpells()
    const progress = b.controller.getQuestProgress()
    latest = {
      place: {
        roomName: b.controller.getRoomName(),
        roomDescription: b.controller.getRoomDescription(),
        characters: b.controller.getRoomCharacters(),
        items: b.controller.getRoomItems(),
        exits: b.controller.getRoomExits(),
        roomWares: b.controller.getRoomWares(),
        actNumber: progress ? progress.actNumber : null,
        completions: b.controller.getCommandCompletions(),
      },
      quests: {
        activeQuests: b.controller.getActiveQuests(),
        completedQuests: b.controller.getCompletedQuests(),
        progress,
      },
      stock: { bag, spells: spellList },
    }
    for (const group of PANEL_GROUPS) if (!held.value[group]) applyGroup(group)
    syncMusic(b)
    acceptInput.value = b.controller.isAcceptingInput()
    shortNames.value = b.controller.getShortNames()
  }

  /**
   * Play what the engine says is playing now. The engine is already in the
   * next act while a finished act's closing page shows
   * (`triggerActTransitionModals` advances it), so nothing may sync the music
   * then: the finished act's track plays on under the page, and the next
   * act's starts with its intro pop-up (`showNextModal`).
   */
  function syncMusic(b: GameBridge): void {
    const m = b.controller.getCurrentMusic()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
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
    const name = rawName === undefined ? null : normalizeSaveName(rawName)
    if (rawName !== undefined && name === null) return false
    const isSave = verb.toLowerCase() === 'save'
    if (isSave && name) saveNamedGame(name, command)
    else if (isSave) saveGame(command)
    else if (name) loadNamedGame(name, command)
    else loadGame(command)
    return true
  }

  /** Quick save; true when the game was saved (a failure goes in the story). */
  function saveGame(command: string | null = null): boolean {
    if (openHeldActEnd()) return false
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
    dropHold()
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(command, result, 'Game loaded')
    refreshPanels()
  }

  function saveNamedGame(name: string, command: string | null = null): boolean {
    if (openHeldActEnd()) return false
    const b = requireBridge()
    const result = b.saveNamedGame(name)
    if (!showNotice(result, `Game saved · ${name}`))
      showOutput(command, result, { chips: false })
    return saved(result)
  }

  function loadNamedGame(name: string, command: string | null = null): void {
    const b = requireBridge()
    const result = b.loadNamedGame(name)
    dropHold()
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(command, result, `Game loaded · ${name}`)
    refreshPanels()
  }

  /**
   * A load: a notice and the room in the story, or the engine's failure. A
   * load plays on in the loaded act, so an act-complete page still held for
   * narration is dropped.
   */
  function showLoaded(
    command: string | null,
    result: string,
    text: string,
  ): void {
    if (showNotice(result, text)) {
      actEndPending.value = false
      showOutput(null, '', { chips: false, arrive: true })
    } else showOutput(command, result, { chips: false })
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
    if (openHeldActEnd()) return false
    const b = requireBridge()
    const result = b.saveToSlot(slot)
    if (!showNotice(result, `Game saved · Slot ${slot}`))
      showOutput(null, result)
    return saved(result)
  }

  function loadFromSlot(slot: number): void {
    const b = requireBridge()
    const result = b.loadFromSlot(slot)
    dropHold()
    rememberLoadedAct(b)
    clearNewDots()
    showLoaded(null, result, `Game loaded · Slot ${slot}`)
    refreshPanels()
  }

  /**
   * Collect the engine's quest events into the story on the latest turn:
   * completions first (what was done comes before what it starts), then new
   * and updated quests.
   */
  function pollQuestEvents(): void {
    const b = requireBridge()
    const news: QuestNews[] = []

    const settled = b.controller.settleQuests()
    const completions = settled.completed

    // Each completion is a record with the act's quest count as it stood once
    // that quest was done.
    if (completions.length) {
      const { completed: done, total } = b.controller.getQuestProgress()
      completions.forEach((completion, index) => {
        news.push({
          ...toQuestNews('completed', completion),
          progress: {
            completed: done - (completions.length - 1 - index),
            total,
          },
        })
      })
    }
    for (const report of settled.activated) {
      news.push(toQuestNews('new', report))
    }
    for (const report of settled.updated) {
      news.push(toQuestNews('updated', report))
    }

    // Each card's sound waits for the card to show (the story view rings it):
    // the fanfare for a completion, the chime for a new or updated quest.
    const turn = turns.value.at(-1)
    if (news.length && turn) {
      turn.quests = [...(turn.quests ?? []), ...news]
      markNew('quests')
      for (const item of news)
        if (item.kind === 'completed') item.fanfare = true
        else item.chime = true
    }
  }

  function showNextModal(): void {
    if (modalQueue.value.length === 0) {
      showModal.value = false
      modalChapter.value = null
      return
    }
    modalChapter.value = modalQueue.value.shift()!
    showModal.value = true
    // The engine already runs the act: its music starts with its intro pop-up.
    if (modalChapter.value.kind === 'intro') syncMusic(requireBridge())
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
        // The act's first room is read aloud like any first visit.
        showOutput(null, b.controller.look(), { narrate: true })
        refreshPanels()
        pollQuestEvents()
        // The look may start quests: list them (as submitCommand does).
        refreshPanels()
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
    actLabel,
    narrationFolder,
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
    ringQuestSounds,
    setActEndGate,
    resumeActEnd,
    actEndPending,
    getQuickSave,
    notice,
    rawInventory,
    rawSpells,
    activeQuests,
    completedQuests,
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
    modalChapter,
    musicFile,
    musicInfo,
    heldTurn,
    panelsHeld,
    panelFlash,
    // Actions
    setPanelHold,
    releasePanels,
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

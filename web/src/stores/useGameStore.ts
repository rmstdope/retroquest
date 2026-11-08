import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  NamedItem,
  RoomExits,
  CompletionTree,
  MapPlace,
  SaveSlot,
  QuestProgress,
  QuestSummary,
  RoomWare,
} from '@/types/bridge'
import type { useBridge } from '@/composables/useBridge'
import {
  LOADED_ROOM,
  normalizeSaveName,
  type RoomDescription,
  type SoundFiring,
} from '@/engine'
import { inventoryChanges, type Chip } from '@/lantern/inventoryChanges'
import { routeTo } from '@/lantern/mapRoute'
import { toQuestNews, type QuestNews } from '@/lantern/questNews'
import {
  toSpellNews,
  withoutLearnedLines,
  type SpellNews,
} from '@/lantern/spellNews'
import { parseActIntro, type ActIntro } from '@/lantern/parseActIntro'
import { actFolder } from '@/lantern/narrationManifest'
import { roomTrackId } from '@/lantern/musicLists'
import {
  eliorPortraitUrl,
  portraitUrl,
  pictureExists,
  madePatches,
  roomPatchUrl,
  roomPictureUrl,
} from '@/lantern/roomPicture'
import {
  appliedMotion,
  declaredMotion,
  madeAreaBoxes,
  type MotionSpec,
} from '@/lantern/roomMotion'
import { ELIOR } from '@/lantern/stageSpeech'
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
  playNewSpell(): void
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

/** A point the walk of the completion tree reached, and the typed word it stood at. */
interface TreePoint {
  start: number
  node: CompletionTree
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
  /**
   * How the engine described the room this turn: null when the room block is
   * not shown, otherwise whether the player moved and whether it is a first
   * visit. The story, the narration and the arrival block all read this.
   */
  description: RoomDescription | null
  /** Items and spells this command added (none for system output). */
  gained: Chip[]
  /** Items and spells this command removed (none for system output). */
  lost: Chip[]
  /** The room as found on arrival or on a look, kept for the story (null otherwise). */
  arrival: Arrival | null
  /** Quests that started, moved on or were completed with this turn. */
  quests?: QuestNews[]
  /** Spells this turn taught, in the order learned: told in the middle of the picture before any quest news. */
  spells?: SpellNews[]
  /**
   * The answer as the engine wrote it, kept only when `text` had the learned
   * spells' lines taken off because they are told in the middle
   * (`tellSpellsInMiddle`); Story so far shows this one.
   */
  fullText?: string
  /** Set on a player's command and on the arrival that opens an act: its answer is narrated (never on a load). */
  narrate?: true
  /** The room character a player's command was for (talk to, say … to, give … to), when it was for one. */
  addressed?: string
  /**
   * Set on a player's command that changed which picture its own room shows
   * (the shed's door opening): the picture follows where the answer says it
   * changes (`sceneBlock`), not at the press.
   */
  pictureChanged?: true
  /**
   * Set on a turn a load brought back from the save's story: the stage shows
   * it as it stood, telling no news again and flying nothing.
   */
  restored?: true
}

/**
 * Whether a save's story (unknown JSON) reads as turns: an array of entries
 * with the fields every turn has. Anything else is treated as no story.
 */
function isStory(value: unknown): value is Turn[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'text' in entry &&
        typeof entry.text === 'string' &&
        'room' in entry &&
        typeof entry.room === 'string' &&
        'gained' in entry &&
        Array.isArray(entry.gained) &&
        'lost' in entry &&
        Array.isArray(entry.lost) &&
        'command' in entry &&
        (entry.command === null || typeof entry.command === 'string') &&
        'description' in entry &&
        typeof entry.description === 'object' &&
        'arrival' in entry &&
        typeof entry.arrival === 'object',
    )
  )
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
 * (the quest count, progress and dot), `stock` (Bag and Spells with their dots)
 * and `picture` (the patches laid over the room's picture).
 */
export type PanelGroup = 'place' | 'quests' | 'stock' | 'picture'

/** Every panel group. */
export const PANEL_GROUPS: readonly PanelGroup[] = [
  'place',
  'quests',
  'stock',
  'picture',
]

/** What the engine says the panels of each group show right now. */
interface PanelSnapshot {
  place: {
    roomName: string
    roomDescription: string
    characters: string[]
    items: string[]
    exits: RoomExits
    /** The act's map: visited places and those seen from them. */
    mapPlaces: MapPlace[]
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
  /** The room the picture is of, and the ids of its patches that apply. */
  picture: { roomKey: string; variant: string; patchIds: string[] }
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
  /** The act's map (visited places, and those seen from them), as the place panels show it. */
  const mapPlaces = ref<MapPlace[]>([])
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
    picture: false,
  })
  /** Counts each group's switches that should light up (a new value lights again). */
  const panelFlash = ref<Record<PanelGroup, number>>({
    place: 0,
    quests: 0,
    stock: 0,
    picture: 0,
  })
  /** The room the picture shows and the patches that apply there, as the held `picture` group lets them be seen. */
  const shownPicture = ref<{
    roomKey: string
    variant: string
    patchIds: string[]
  }>({
    roomKey: '',
    variant: '',
    patchIds: [],
  })
  /** The same as the engine says now, which `shownPicture` takes on release. */
  const latestPicture = ref<{
    roomKey: string
    variant: string
    patchIds: string[]
  }>({
    roomKey: '',
    variant: '',
    patchIds: [],
  })
  /** What the engine showed at the last refresh; held groups apply it on release. */
  let latest: PanelSnapshot | null = null
  /** Dots earned while their group is held. */
  let pendingDots: Record<JournalTab, boolean> = {
    bag: false,
    spells: false,
    quests: false,
  }
  /**
   * True while a narrated turn holds some panel a player can press in. The
   * room picture's patches wait too, but they are not a panel: a press never
   * has to bring them up first.
   */
  const panelsHeld = computed(() =>
    PANEL_GROUPS.some((g) => g !== 'picture' && held.value[g]),
  )
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
  /** The act and room the music plays in (see `getMusicPlace`), '' while nothing plays. */
  const musicActName = ref('')
  const musicRoomKey = ref('')
  /** The sound state of the music's room (see `getMusicPlace`), held and released with it. */
  const musicSoundState = ref('')
  /** Which of the music room's pictures shows (`Room.pictureVariant`), '' for its one picture. */
  const musicPicture = ref('')
  /** The picture variant the engine shows now, which `musicPicture` takes on release. */
  let latestVariant = ''
  /**
   * Whether a command that changes its own room's picture keeps the old
   * picture until the answer reaches the change (`releasePicture`).
   */
  let pictureHeld = false
  /** Which pictures are known to exist, by URL; one not asked about yet is absent (`pictureExists`). */
  const paintedPictures = ref<Record<string, boolean>>({})
  /**
   * Whether a narrated command keeps the room's music at the room it started
   * in, until the narration reaches the new scene (`releaseMusic`).
   */
  let musicHeld = false
  /** Whether the picture and music follow the room at once (see `setScenePicture`). */
  const scenePicture = ref(false)
  /** The room key the engine plays in now, which `musicRoomKey` takes on release. */
  let latestRoomKey = ''
  /** That room's sound state now, which `musicSoundState` takes on release. */
  let latestSoundState = ''

  /** The sound triggers the game fired and the music's room has not taken yet. */
  let latestSoundFirings: SoundFiring[] = []
  /**
   * The sound triggers fired by the latest commands, each with its room's
   * key, published as the music moves to the room (a new list each time, never
   * repeated).
   */
  const musicSoundFirings = ref<SoundFiring[]>([])

  /** The music moves to the room the engine plays in now, with its sound state and the triggers fired. */
  function moveMusic(): void {
    musicRoomKey.value = latestRoomKey
    musicSoundState.value = latestSoundState
    if (!pictureHeld) musicPicture.value = latestVariant
    if (latestSoundFirings.length > 0) {
      musicSoundFirings.value = latestSoundFirings
      latestSoundFirings = []
    }
  }

  /** The picture of the room the player is in (follows the held music room, so it changes as the narration reaches the new scene). */
  const roomPicture = computed(() => {
    const own = roomPictureUrl(musicActName.value, musicRoomKey.value)
    if (!musicPicture.value) return own
    // Another picture of the room shows once it is known to exist, so one not
    // painted yet never blanks the stage.
    const other = roomPictureUrl(
      musicActName.value,
      musicRoomKey.value,
      musicPicture.value,
    )
    return paintedPictures.value[other] ? other : own
  })

  /** Ask once whether the picture at `url` exists; `roomPicture` takes it up when it does. */
  function checkPicture(url: string): void {
    if (!url || url in paintedPictures.value) return
    paintedPictures.value[url] = false
    void pictureExists(url).then((exists) => {
      paintedPictures.value[url] = exists
    })
  }

  /** The images manifest as fetched (null until it is, or when it cannot be). */
  const imageManifest = ref<unknown>(null)

  /** Fetch the images manifest, which lists the patches that have been made; a failure leaves none, silently. */
  async function loadImageManifest(): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}images/generated/manifest.json`,
      )
      if (response.ok) imageManifest.value = await response.json()
    } catch {
      imageManifest.value = null
    }
  }

  /** The picture state of the room the player is in: what the held group shows, or, after a move to another room, that room's at once; null when no room's state is there. */
  const roomPictureState = computed(() => {
    const room = musicRoomKey.value
    if (!room) return null
    const shown =
      shownPicture.value.roomKey === room
        ? shownPicture.value
        : latestPicture.value
    return shown.roomKey === room ? shown : null
  })

  /** The manifest id of the picture the player sees: the room's own, or `<room>-<variant>`; null while the held picture and the room's picture are not the same one. */
  const shownPictureId = computed<string | null>(() => {
    const room = musicRoomKey.value
    const shown = roomPictureState.value
    if (!room || !shown) return null
    // The patches and the movement belong to one picture: they show only over that picture.
    const variant = shown.variant
    if (variant !== musicPicture.value) return null
    if (
      variant &&
      roomPicture.value !== roomPictureUrl(musicActName.value, room, variant)
    )
      return null
    const id = roomTrackId(musicActName.value, room)
    return variant ? `${id}-${variant}` : id
  })

  /**
   * The movement over the room's painting that applies to the story as it
   * stands (the declared effects whose patch condition holds, the spots with
   * the box the studio placed for them; a spot not placed is left out).
   */
  const roomMotion = computed<MotionSpec[]>(() => {
    const shown = roomPictureState.value
    const id = shownPictureId.value
    if (!shown || id === null) return []
    const effects = declaredMotion(musicActName.value, shown.roomKey)
    if (effects.length === 0) return []
    const boxes = madeAreaBoxes(imageManifest.value, id)
    return appliedMotion(effects, shown.patchIds, boxes)
  })

  /** The size of the room's picture as the manifest lists it, for the boxes laid on it; absent while it is not known. */
  const roomPictureSize = computed(() => {
    const id = shownPictureId.value
    const manifest = imageManifest.value
    if (id === null || typeof manifest !== 'object' || manifest === null)
      return undefined
    const image: unknown = (manifest as Record<string, unknown>)[id]
    if (typeof image !== 'object' || image === null) return undefined
    const { width, height } = image as Record<string, unknown>
    return typeof width === 'number' &&
      typeof height === 'number' &&
      width > 0 &&
      height > 0
      ? { width, height }
      : undefined
  })

  /**
   * The URLs of the patches laid over the room's picture: the ones that apply
   * to the story (what the held `picture` group shows; after a move to
   * another room, that room's at once) and that the manifest lists as made.
   */
  const roomPatchUrls = computed<string[]>(() => {
    const room = musicRoomKey.value
    const shown = roomPictureState.value
    const id = shownPictureId.value
    if (!room || !shown || id === null) return []
    const variant = shown.variant
    const made = madePatches(imageManifest.value, id)
    return shown.patchIds
      .filter((patch) => made.includes(patch))
      .map((patch) => roomPatchUrl(musicActName.value, room, patch, variant))
  })

  /** The running act's characters by class key and name, for their portraits. */
  const actCast = ref<{ key: string; name: string }[]>([])

  /** The portrait of Elior, or of a character of the running act; '' when the name is not on its list (a name the act does not register). */
  function portraitFor(name: string): string {
    if (name.toLowerCase() === ELIOR.toLowerCase()) return eliorPortraitUrl()
    const entry = actCast.value.find(
      (cast) => cast.name.toLowerCase() === name.toLowerCase(),
    )
    return entry ? portraitUrl(musicActName.value, entry.key) : ''
  }

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
   * `description` is the engine's word on whether the room is shown (see
   * `RoomDescription`); it is ignored while no act runs.
   */
  function showOutput(
    command: string | null,
    raw: string,
    {
      chips = command !== null,
      description = null,
      narrate = false,
      hold = false,
      addressed = null,
    }: {
      chips?: boolean
      description?: RoomDescription | null
      narrate?: boolean
      hold?: boolean
      addressed?: string | null
    } = {},
  ): void {
    const b = requireBridge()
    const turnId = nextTurnId++
    // A player's command in a narrated game keeps the panels as they were
    // until the narration reaches them (see `releasePanels`).
    if (hold)
      startHold(turnId, addressed !== null && description?.moved === true)
    // A command that changes the picture of the room it stays in holds the
    // old picture until the answer reaches the change.
    const place = b.controller.getMusicPlace()
    const pictureChanged =
      hold &&
      panelHoldEnabled &&
      description?.moved !== true &&
      place.roomKey === musicRoomKey.value &&
      place.pictureVariant !== musicPicture.value
    if (pictureChanged) pictureHeld = true
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

    const shown = actRunning ? description : null
    const spells = showChips ? learnedSpells(spellChanges.gained, b) : []
    turns.value.push({
      id: turnId,
      command,
      text: raw,
      room,
      description: shown,
      gained,
      lost,
      // The engine only says "You move north to …"; keep what the room looked
      // like now so the story can show it later.
      ...(spells.length ? { spells } : {}),
      ...(narrate ? { narrate: true as const } : {}),
      ...(addressed ? { addressed } : {}),
      ...(pictureChanged ? { pictureChanged: true as const } : {}),
      // A look shows the room again without having moved.
      arrival: shown
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

  /** The news of the spells a command taught: their names as the bag lists them, with the descriptions. */
  function learnedSpells(gained: Chip[], b: GameBridge): SpellNews[] {
    const known = b.controller.getSpells()
    return gained.flatMap((chip) => {
      const spell = known.find(
        (entry) => entry.name.replace(/\[\/?spell_name\]/g, '') === chip.name,
      )
      return spell ? [toSpellNews(spell.name, spell.description)] : []
    })
  }

  /**
   * The turn's learned spells are told in the middle of the picture: take
   * their "You have learned …" lines off the turn the narrator's card shows
   * and keep the whole text for Story so far. Once is enough.
   */
  function tellSpellsInMiddle(turnId: number): void {
    const turn = turns.value.find((entry) => entry.id === turnId)
    if (!turn?.spells?.length || turn.fullText !== undefined) return
    const text = withoutLearnedLines(turn.text, turn.spells)
    if (text === turn.text) return
    turn.fullText = turn.text
    turn.text = text
  }

  /** The spell sound as a piece of spell news comes up. */
  function ringSpellSound(): void {
    audioPlayer?.playNewSpell()
  }

  /**
   * Let a command's panels wait (applying an older turn's first). The music
   * waits too, except on a picture stage, where it moves at the press; a talk
   * that moves Elior (`movingTalk`) is told over the old picture first, so
   * there it waits for its scene even on the stage.
   */
  function startHold(turnId: number, movingTalk: boolean): void {
    if (!panelHoldEnabled) return
    if (heldTurn.value !== null)
      releasePanels(heldTurn.value, [...PANEL_GROUPS], false)
    // A newer command brings the older one's picture up at once.
    releasePicture()
    heldTurn.value = turnId
    held.value = { place: true, quests: true, stock: true, picture: true }
    musicHeld = !scenePicture.value || movingTalk
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
    if (group === 'picture')
      return JSON.stringify([
        shownPicture.value.variant,
        shownPicture.value.patchIds,
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
      mapPlaces.value = place.mapPlaces
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
    } else if (group === 'picture') {
      shownPicture.value = latest.picture
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
    // The room's music is never later than the room card.
    if (groups.includes('place')) {
      releaseMusic(turnId)
      releasePicture(turnId)
    }
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
    if (!PANEL_GROUPS.some((g) => held.value[g])) heldTurn.value = null
  }

  /** Whether the panels of `group` still show the state from before the narrated turn. */
  function groupHeld(group: PanelGroup): boolean {
    return held.value[group]
  }

  /** Forget a hold without applying it (a load or a new game refreshes the panels itself). */
  function dropHold(): void {
    heldTurn.value = null
    held.value = {
      place: false,
      quests: false,
      stock: false,
      picture: false,
    }
    pendingDots = { bag: false, spells: false, quests: false }
    musicHeld = false
    pictureHeld = false
    // The firings of an abandoned turn never sound.
    latestSoundFirings = []
    moveMusic()
  }

  /**
   * The narration of turn `turnId` has reached the new scene: the music moves
   * to the room the player is in now. Does nothing for another turn than the
   * one held, or once the music has moved.
   */
  function releaseMusic(turnId: number): void {
    if (turnId !== heldTurn.value || !musicHeld) return
    musicHeld = false
    moveMusic()
  }

  /**
   * The answer of turn `turnId` has reached the change of its room's picture
   * (or it is brought up at once): the picture follows the room's state now.
   * Without a turn it lets go whatever is held. Does nothing for another turn
   * than the one held, or when nothing is held.
   */
  function releasePicture(turnId?: number): void {
    if (!pictureHeld) return
    if (turnId !== undefined && turnId !== heldTurn.value) return
    pictureHeld = false
    musicPicture.value = latestVariant
  }

  /**
   * The layout plays the room on its picture stage: the picture and music move
   * at the press (the change of scene), so a narrated command no longer holds
   * the music's room back for the narrator, unless it is a talk (which the
   * layout releases where the talk's scene changes). Off: it does, as before.
   */
  function setScenePicture(enabled: boolean): void {
    scenePicture.value = enabled
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

  /** Why the last load from the title page failed (the engine's line, plain), else ''. */
  const titleLoadError = ref('')

  function dismissTitle(): void {
    showTitle.value = false
    titleLoadError.value = ''
  }

  /**
   * Load a save from the title page (`0` is the quick save). No game is in
   * play, so the title page and the opening chapter page give way at once and
   * the player lands in the saved room. A save made under a name is loaded by
   * its `name`. A failed load changes nothing but
   * `titleLoadError`; true when the game was loaded.
   */
  function loadFromTitle(slot: number, name?: string): boolean {
    const b = requireBridge()
    titleLoadError.value = ''
    let result: string
    try {
      result =
        name !== undefined
          ? b.loadNamedGame(name)
          : slot === 0
            ? b.quickLoadGame()
            : b.loadFromSlot(slot)
    } catch {
      titleLoadError.value =
        "Your saves could not be read: this browser's storage is blocked."
      return false
    }
    if (result.includes('[failure]')) {
      titleLoadError.value = result.replace(/\[[^\]]*\]/g, '').trim()
      return false
    }
    modalQueue.value = []
    showModal.value = false
    modalChapter.value = null
    pendingLookOnDismiss = false
    afterLoad(
      b,
      null,
      result,
      name !== undefined
        ? `Game loaded · ${name}`
        : slot === 0
          ? 'Game loaded'
          : `Game loaded · Slot ${slot}`,
    )
    acceptInput.value = b.controller.isAcceptingInput()
    dismissTitle()
    return true
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
  /** Counts loads, so views that hold open panels (the stage's drawer and map) close them. */
  const loadNumber = ref(0)

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

  /**
   * Walk to a place on the map: one `go` per step of the route through the
   * visited places (the last step may enter a seen one), each played and
   * shown as if typed. The trip stops where walking would: when a step is
   * refused, leaves the player elsewhere than the route says, or the game
   * stops taking input (a pop-up, the end of the act). Does nothing while the
   * game is busy, for the place the player is in, or for an unknown place.
   */
  function travelTo(targetKey: string): void {
    if (!acceptInput.value) return
    const b = requireBridge()
    const places = b.controller.getMapPlaces()
    const route = routeTo(places, targetKey)
    if (route === null) return
    let here = places.find((place) => place.current)
    for (const direction of route) {
      const next = here?.exits[direction]
      if (!next) return
      const answer = playCommand(`go ${direction}`)
      if (answer.includes('[failure]') || !acceptInput.value) return
      // A scene on entering, or news of a quest, is where walking would stop to read.
      if (b.controller.lastTurnHadArrivalScene()) return
      if (turns.value.at(-1)?.quests?.length) return
      here = b.controller.getMapPlaces().find((place) => place.current)
      if (here?.key !== next.to) return
    }
  }

  /** Run one command as the player typed it: log it, refresh, raise quest news. */
  function playCommand(command: string): string {
    const b = requireBridge()
    const result = b.controller.takeTurn(command)
    lastAnswer = result
    showOutput(command, result, {
      description: b.controller.lastTurnRoomDescription(),
      narrate: true,
      hold: true,
      addressed: b.controller.lastTurnAddressee(),
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

  /**
   * Queue the finished act's closing page and the next act's intro pop-up.
   * The engine stays in the finished act, so the controller still answers for
   * the act on screen; it moves on when the pop-up shows (`showNextModal`).
   */
  function triggerActTransitionModals(): void {
    const b = requireBridge()
    const introText = b.controller.getNextActIntro()
    if (introText === null) return
    modalQueue.value.push({
      kind: 'complete',
      act: currentAct?.act ?? '',
      title: currentAct?.title ?? '',
      body: b.controller.getActCompleteText() ?? '',
      stats: b.controller.getActStats(),
      nextAct: parseActIntro(introText).act || undefined,
    })
    modalQueue.value.push({ kind: 'intro', ...parseActIntro(introText) })
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
        mapPlaces: b.controller.getMapPlaces(),
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
      picture: b.pictureState(),
    }
    latestPicture.value = latest.picture
    for (const group of PANEL_GROUPS) if (!held.value[group]) applyGroup(group)
    syncMusic(b)
    acceptInput.value = b.controller.isAcceptingInput()
    shortNames.value = b.controller.getShortNames()
  }

  /**
   * Play what the engine says is playing now: under a finished act's closing
   * page that is still the finished act's track, and the next act's starts
   * once its intro pop-up has moved the engine on (`showNextModal`). Under an
   * act's intro pop-up the player is not in a room yet, so the act's own loop
   * plays there; the first room's track starts when the pop-up is dismissed.
   * A narrated command keeps the room it started in until the narration
   * reaches the new scene (`releaseMusic`).
   */
  function syncMusic(b: GameBridge): void {
    const m = b.controller.getCurrentMusic()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
    const place = b.controller.getMusicPlace()
    musicActName.value = place.actName
    actCast.value = b.controller.getActCharacters()
    latestRoomKey = isIntroShowing() ? '' : place.roomKey
    latestSoundState = isIntroShowing() ? '' : place.soundState
    latestVariant = isIntroShowing() ? '' : place.pictureVariant
    // Every other picture of the act's rooms is asked about as the act runs, so
    // each is known by the time a move or a command brings it up.
    for (const other of b.controller.getPictureVariants())
      checkPicture(roomPictureUrl(place.actName, other.roomKey, other.variant))
    latestSoundFirings = [
      ...latestSoundFirings,
      ...b.controller.takeSoundFirings(),
    ]
    if (!musicHeld) moveMusic()
  }

  /** Whether an act's intro pop-up is on screen. */
  function isIntroShowing(): boolean {
    return showModal.value && modalChapter.value?.kind === 'intro'
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
    const result = b.quickSaveGame(turns.value)
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
    afterLoad(b, command, b.quickLoadGame(), 'Game loaded')
  }

  function saveNamedGame(name: string, command: string | null = null): boolean {
    if (openHeldActEnd()) return false
    const b = requireBridge()
    const result = b.saveNamedGame(name, turns.value)
    if (!showNotice(result, `Game saved · ${name}`))
      showOutput(command, result, { chips: false })
    return saved(result)
  }

  function loadNamedGame(name: string, command: string | null = null): void {
    const b = requireBridge()
    afterLoad(b, command, b.loadNamedGame(name), `Game loaded · ${name}`)
  }

  /**
   * After a load. A failed one (no save, or a save too old to load) only
   * shows the engine's line under the command, and the game, the room and the
   * turn stay as they were. A loaded game starts afresh (hold, act, music,
   * dots and panels) with a notice, and the story is the save's story so far,
   * as it stood when the game was saved (`restoreStory`). A save made before
   * the story was kept shows only the room, under the command when one was
   * typed. It plays on in the loaded act, so an act-complete page still held
   * for narration is dropped.
   */
  function afterLoad(
    b: GameBridge,
    command: string | null,
    result: string,
    text: string,
  ): void {
    if (!showNotice(result, text)) {
      showOutput(command, result, { chips: false })
      return
    }
    dropHold()
    rememberLoadedAct(b)
    loadNumber.value++
    clearNewDots()
    actEndPending.value = false
    const story = b.takeLoadedStory()
    if (isStory(story)) restoreStory(b, story)
    else {
      turns.value = []
      // The typed word stays on the turn (the narration card's command line).
      showOutput(command, '', { chips: false, description: LOADED_ROOM })
    }
    refreshPanels()
  }

  /**
   * The story of a loaded save, as it stood when it was saved: each turn
   * numbered afresh for this session and marked `restored`, and nothing
   * owed by it (narration, a chime or fanfare) is owed again. The next
   * command's chips compare with the loaded bag and spells.
   */
  function restoreStory(b: GameBridge, story: Turn[]): void {
    turns.value = story.map((turn) => {
      const { narrate: _narrate, ...kept } = turn
      return {
        ...kept,
        id: nextTurnId++,
        ...(turn.quests
          ? {
              quests: turn.quests.map(
                ({ chime: _chime, fanfare: _fanfare, ...news }) => news,
              ),
            }
          : {}),
        restored: true as const,
      }
    })
    lastTurnRoom = b.controller.getRoomName()
    lastBag = b.controller.getInventory().map((entry) => entry.name)
    lastSpells = b.controller.getSpells().map((entry) => entry.name)
  }

  /** The engine's stats or help text, for a dialog (adds nothing to the story). */
  function readInfo(kind: 'stats' | 'help'): string {
    return requireBridge().controller.handleCommand(kind)
  }

  function getQuickSave(): SaveSlot | null {
    return requireBridge().getQuickSave()
  }

  /** The saves made under a name, as cards, newest first. */
  function getNamedSaves(): SaveSlot[] {
    return requireBridge().getNamedSaves()
  }

  function getSaveSlots(): SaveSlot[] {
    const b = requireBridge()
    return b.getSaveSlots()
  }

  function saveToSlot(slot: number): boolean {
    if (openHeldActEnd()) return false
    const b = requireBridge()
    const result = b.saveToSlot(slot, turns.value)
    if (!showNotice(result, `Game saved · Slot ${slot}`))
      showOutput(null, result)
    return saved(result)
  }

  function loadFromSlot(slot: number): void {
    const b = requireBridge()
    afterLoad(b, null, b.loadFromSlot(slot), `Game loaded · Slot ${slot}`)
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

  /**
   * The next act's intro pop-up shows: the engine leaves the finished act's
   * closing pages for the new act, whose heading and music start with it.
   */
  function startQueuedAct(b: GameBridge): void {
    if (!b.controller.isActRunning()) {
      b.controller.advanceToRunning()
      rememberLoadedAct(b)
    }
    syncMusic(b)
  }

  function showNextModal(): void {
    if (modalQueue.value.length === 0) {
      showModal.value = false
      modalChapter.value = null
      return
    }
    modalChapter.value = modalQueue.value.shift()!
    showModal.value = true
    if (modalChapter.value.kind === 'intro') startQueuedAct(requireBridge())
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
        showOutput(null, b.controller.openRoom(), {
          narrate: true,
          description: b.controller.lastTurnRoomDescription(),
        })
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
   * matches nothing) or `complete` (the command needs no more words). Text
   * the tree cannot follow is `complete` when, from where the tree offers a
   * character, it names one here: the tree holds only full names and a
   * character answers to more. An item answers to more as well: its other
   * name is read as its full name (`readItemName`).
   * Matching ignores case; `word` is the last word as typed.
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
    let nameStart = -1
    const walked: TreePoint[] = []
    const unmatched = (sendable: boolean): CompletionState =>
      nameStart >= 0 &&
      bridge?.controller.namesCharacter(typedWords.slice(nameStart).join(' '))
        ? { ...none, kind: 'complete', sendable: true }
        : (readItemName(walked, typed, typedWords) ?? { ...none, sendable })

    let node: CompletionTree | null = completionTree.value
    for (const [index, token] of tokens.slice(0, -1).entries()) {
      if (node === null) {
        // Words after a finished command: nothing to offer.
        return { ...none, kind: 'complete', sendable: true }
      }
      walked.push({ start: index, node })
      if (offersCharacter(node)) nameStart = index
      if (token === SENDABLE_MARKER || !Object.hasOwn(node, token))
        return unmatched(false)
      node = node[token]
    }
    if (node === null) return { ...none, kind: 'complete', sendable: true }
    walked.push({ start: tokens.length - 1, node })
    if (offersCharacter(node)) nameStart = tokens.length - 1

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
    if (candidates.length === 0) return unmatched(sendable)
    return { kind: 'matches', candidates, sendable, word }
  }

  /**
   * The list for text the tree cannot follow, when an item's other name is
   * what stopped it: a name ending the text closes the list (`complete`, and
   * sendable only if the command needs no more), and anything else
   * reads on as the same text with the item's full name, which the tree
   * follows. Null when no item here is named from a point of the tree that
   * offers it, or words follow a name that takes none.
   */
  function readItemName(
    walked: TreePoint[],
    typed: string,
    typedWords: string[],
  ): CompletionState | null {
    const trailing = typed.endsWith(' ') ? ' ' : ''
    for (const { start, node } of [...walked].reverse()) {
      for (let end = typedWords.length; end > start; end--) {
        const fullName = bridge?.controller.itemNamed(
          typedWords.slice(start, end).join(' '),
          (name) => nodeAfter(node, name) !== undefined,
        )
        if (!fullName) continue
        const last = end === typedWords.length
        if (last && !trailing)
          return {
            kind: 'complete',
            candidates: [],
            sendable: sendableAfter(nodeAfter(node, fullName)),
            word: typedWords[end - 1],
          }
        if (!last && nodeAfter(node, fullName) === null) continue
        const reread =
          [
            ...typedWords.slice(0, start),
            fullName,
            ...typedWords.slice(end),
          ].join(' ') + trailing
        if (reread.toLowerCase() !== typed) return completionState(reread)
      }
    }
    return null
  }

  /** Whether a command that has reached this point of the tree can be sent. */
  function sendableAfter(node: CompletionTree | null | undefined): boolean {
    return node === null || (node !== undefined && SENDABLE_MARKER in node)
  }

  /** Where a whole name leads from this point of the tree; undefined when it cannot be followed. */
  function nodeAfter(
    node: CompletionTree,
    name: string,
  ): CompletionTree | null | undefined {
    let at: CompletionTree | null = node
    for (const word of name.toLowerCase().split(/\s+/)) {
      if (at === null || !Object.hasOwn(at, word)) return undefined
      at = at[word]
    }
    return at
  }

  /** Whether a character's whole name can be followed from this point of the tree. */
  function offersCharacter(node: CompletionTree): boolean {
    return characters.value.some((name) => nodeAfter(node, name) !== undefined)
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
    titleLoadError,
    loadFromTitle,
    dismissTitle,
    gameNumber,
    loadNumber,
    restartGame,
    ringQuestSounds,
    ringSpellSound,
    tellSpellsInMiddle,
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
    mapPlaces,
    travelTo,
    acceptInput,
    showModal,
    modalChapter,
    musicFile,
    musicInfo,
    musicActName,
    musicRoomKey,
    musicSoundState,
    musicPicture,
    musicSoundFirings,
    roomPicture,
    roomPatchUrls,
    roomMotion,
    roomPictureSize,
    imageManifest,
    loadImageManifest,
    portraitFor,
    heldTurn,
    panelsHeld,
    groupHeld,
    panelFlash,
    // Actions
    setPanelHold,
    scenePicture,
    setScenePicture,
    releasePanels,
    releaseMusic,
    releasePicture,
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
    getNamedSaves,
    saveToSlot,
    loadFromSlot,
    pollQuestEvents,
    dismissModal,
    markSeen,
    tabComplete,
    completionState,
  }
})

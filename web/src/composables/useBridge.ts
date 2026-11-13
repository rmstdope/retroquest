/**
 * Vue composable wrapping the TypeScript game engine. Provides typed access
 * to the game and its controller, and keeps saves in the browser's storage.
 */
import { Game, GameController, isOutdatedSave, type Act } from '@/engine'
import type { SaveSlot } from '@/types/bridge'
import { areaThingsOf, type AreaThing } from '@/lantern/areaThings'
import { appliedPatchIds } from '@/lantern/roomPatchState'
import { appStorage } from '@/storage/appStorage'

type StoredNamedSave = {
  name: string
  timestamp: string
  data: string
  /** Where the player was; missing in saves made before the details were kept. */
  act?: string
  room?: string
  quests?: SaveSlot['quests']
  /** The story so far as the UI kept it; missing in saves made before it was kept. */
  story?: unknown
}

type StoredSaveSlot = {
  slot: number
  act: string
  room: string
  timestamp: string
  data: string
  /** Missing in saves made before quest counts were kept. */
  quests?: SaveSlot['quests']
  /** The story so far as the UI kept it; missing in saves made before it was kept. */
  story?: unknown
}

/** The quick save's data and its details. */
const QUICK_KEY = 'retroquest_save'
const QUICK_META_KEY = 'retroquest_save_meta'
/** The quick save's story so far (JSON), written with it. */
const QUICK_STORY_KEY = 'retroquest_save_story'
const SLOTS_KEY = 'retroquest_save_slots'
const NAMED_KEY = 'retroquest_named_saves'
const SLOT_COUNT = 8
/** The `slot` of a card for a save made under a name. */
const NAMED_SLOT = -1

/** A save the browser could not keep (storage full or blocked). */
const SAVE_FAILED =
  "[failure]The game could not be saved: this browser's storage is full or blocked.[/failure]"
const NO_SAVE = '[failure]No save file found.[/failure]'
const SAVED = 'Game saved.'

function readQuickMeta(): Partial<Omit<SaveSlot, 'slot'>> {
  try {
    const raw = appStorage.getItem(QUICK_META_KEY)
    const meta: unknown = raw ? JSON.parse(raw) : null
    return meta && typeof meta === 'object'
      ? (meta as Partial<Omit<SaveSlot, 'slot'>>)
      : {}
  } catch {
    return {}
  }
}

/** True for save data this engine wrote (JSON); saves of the Python engine are not. */
function isSaveData(data: unknown): data is string {
  return typeof data === 'string' && data.startsWith('{')
}

/** Read and validate persisted named saves from local storage. */
function readStoredNamedSaves(): StoredNamedSave[] {
  try {
    const raw = appStorage.getItem(NAMED_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is StoredNamedSave => {
      if (typeof entry !== 'object' || entry === null) return false
      const candidate = entry as Record<string, unknown>
      return typeof candidate.name === 'string' && isSaveData(candidate.data)
    })
  } catch {
    return []
  }
}

/**
 * Read persisted 8-slot save data from localStorage.
 * Always returns an array of exactly 8 entries (null = empty slot).
 */
function readStoredSaveSlots(): (StoredSaveSlot | null)[] {
  try {
    const raw = appStorage.getItem(SLOTS_KEY)
    if (!raw) return Array(SLOT_COUNT).fill(null)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== SLOT_COUNT) {
      return Array(SLOT_COUNT).fill(null)
    }
    return parsed.map((entry: unknown) =>
      entry &&
      typeof entry === 'object' &&
      isSaveData((entry as StoredSaveSlot).data)
        ? (entry as StoredSaveSlot)
        : null,
    )
  } catch {
    return Array(SLOT_COUNT).fill(null)
  }
}

/** An act the bridge can play. */
export type ActClass = new () => Act

/** The room the picture is of, the ids of its patches that apply, and what is in the room that its areas can mark. */
export interface PictureState {
  roomKey: string
  variant: string
  patchIds: string[]
  things: AreaThing[]
}

/** The acts, loaded on demand so each is its own chunk of the build. */
async function loadActs(): Promise<ActClass[]> {
  const [{ Act1 }, { Act2 }, { Act3 }, { Act4 }] = await Promise.all([
    import('@/act1/Act1'),
    import('@/act2/Act2'),
    import('@/act3/Act3'),
    import('@/act4/Act4'),
  ])
  return [Act1, Act2, Act3, Act4]
}

/**
 * The game the UI plays. `controller` is the engine's read model of the
 * running game (it changes when `newGame` starts a fresh one); the rest is
 * what only the browser can do: loading the acts and keeping saves in storage.
 *
 * @param loader Loads the acts to play; the real acts unless a test injects its own.
 */
export function useBridge(loader: () => Promise<ActClass[]> = loadActs) {
  let acts: ActClass[] = []
  let game: Game | null = null
  let controller: GameController | null = null
  /** The story kept with the save loaded last, until `takeLoadedStory` takes it. */
  let loadedStory: unknown = null

  function requireGame(): { game: Game; controller: GameController } {
    if (!game || !controller) throw new Error('Game not started')
    return { game, controller }
  }

  async function init(
    onProgress: (status: string) => void = () => {},
  ): Promise<void> {
    onProgress('Loading the acts...')
    acts = await loader()
    onProgress('Starting game...')
    newGame()
    onProgress('Ready!')
  }

  function isReady(): boolean {
    return game !== null
  }

  /** Throw the running game away and start a fresh one from Act I. */
  function newGame(): void {
    if (acts.length === 0) throw new Error('Game not started')
    game = new Game(acts.map((ActClass) => new ActClass()))
    controller = new GameController(game)
  }

  /** The act's quests done/total for a save card, or null if unreadable. */
  function readQuests(): SaveSlot['quests'] {
    try {
      const { completed, total } = requireGame().controller.getQuestProgress()
      return { completed, total }
    } catch {
      return null
    }
  }

  /** The details stored next to a save: where the player was and when. */
  function saveDetails(): Omit<StoredSaveSlot, 'slot' | 'data'> {
    const { controller } = requireGame()
    return {
      act: controller.getActName(),
      room: controller.getRoomName(),
      timestamp: new Date().toISOString(),
      quests: readQuests(),
    }
  }

  /**
   * Load save data into the game, keeping `story` (the story stored with it)
   * for `takeLoadedStory` when it loads; a failed load keeps none.
   */
  function loadWithStory(data: string, story: unknown): string {
    loadedStory = null
    const result = requireGame().game.loadSaveData(data)
    if (!result.includes('[failure]')) loadedStory = story ?? null
    return result
  }

  /** The story kept with the save loaded last (null when it has none), once. */
  function takeLoadedStory(): unknown {
    const story = loadedStory
    loadedStory = null
    return story
  }

  /**
   * The room the player is in, the ids of the patches of its picture that
   * apply to the story now and the things and ways out in it that its
   * picture's areas can mark; empty while no room is known. Read from the game
   * each time, so a loaded game answers as the played one did.
   */
  function pictureState(): PictureState {
    const { game } = requireGame()
    const { roomKey, pictureVariant } = game.currentMusicPlace()
    if (!roomKey) return { roomKey: '', variant: '', patchIds: [], things: [] }
    return {
      roomKey,
      variant: pictureVariant,
      things: areaThingsOf(
        game.acts[game.currentAct],
        roomKey,
        game.state,
        pictureVariant,
      ),
      patchIds: appliedPatchIds(
        game.acts[game.currentAct],
        roomKey,
        game.state,
        pictureVariant,
      ),
    }
  }

  /** The quick save, with `story` (the UI's story so far) stored beside it. */
  function quickSaveGame(story: unknown = null): string {
    const { game } = requireGame()
    try {
      const data = game.toSaveData()
      const meta = JSON.stringify(saveDetails())
      const told = story === null ? null : JSON.stringify(story)
      appStorage.setItem(QUICK_KEY, data)
      try {
        appStorage.setItem(QUICK_META_KEY, meta)
      } catch {
        // No details rather than the previous save's.
        appStorage.removeItem(QUICK_META_KEY)
      }
      try {
        if (told === null) appStorage.removeItem(QUICK_STORY_KEY)
        else appStorage.setItem(QUICK_STORY_KEY, told)
      } catch {
        // No story rather than the previous save's.
        appStorage.removeItem(QUICK_STORY_KEY)
      }
    } catch {
      return SAVE_FAILED
    }
    return SAVED
  }

  /** The quick save's story, or null when it has none that can be read. */
  function readQuickStory(): unknown {
    try {
      const raw = appStorage.getItem(QUICK_STORY_KEY)
      return raw ? (JSON.parse(raw) as unknown) : null
    } catch {
      return null
    }
  }

  function quickLoadGame(): string {
    const data = appStorage.getItem(QUICK_KEY)
    if (!isSaveData(data)) return NO_SAVE
    return loadWithStory(data, readQuickStory())
  }

  /**
   * The quick save as a card (slot 0), or null when there is none this engine
   * can read. A save from an older version is a card marked `outdated`.
   */
  function getQuickSave(): SaveSlot | null {
    const data = appStorage.getItem(QUICK_KEY)
    if (!isSaveData(data)) return null
    const meta = readQuickMeta()
    return {
      slot: 0,
      act: meta.act ?? null,
      room: meta.room ?? null,
      timestamp: meta.timestamp ?? null,
      quests: meta.quests ?? null,
      outdated: isOutdatedSave(data),
    }
  }

  /** The 8 slots as cards; a save from an older version is marked `outdated`. */
  function getSaveSlots(): SaveSlot[] {
    const stored = readStoredSaveSlots()
    return Array.from({ length: SLOT_COUNT }, (_, i) => {
      const entry = stored[i]
      const slot = i + 1
      if (!entry)
        return { slot, act: null, room: null, timestamp: null, quests: null }
      return {
        slot,
        act: entry.act ?? null,
        room: entry.room ?? null,
        timestamp: entry.timestamp ?? null,
        quests: entry.quests ?? null,
        outdated: isOutdatedSave(entry.data),
      }
    })
  }

  /**
   * The named saves as cards (slot -1), newest first; one from an older
   * version is marked `outdated`, and one made before the details were kept
   * has only its name and time.
   */
  function getNamedSaves(): SaveSlot[] {
    return readStoredNamedSaves()
      .map((entry, index) => ({
        entry,
        index,
        at: Date.parse(entry.timestamp),
      }))
      .sort((a, b) => {
        const byTime =
          (Number.isNaN(b.at) ? -Infinity : b.at) -
          (Number.isNaN(a.at) ? -Infinity : a.at)
        return byTime === 0 || Number.isNaN(byTime) ? a.index - b.index : byTime
      })
      .map(({ entry }) => ({
        slot: NAMED_SLOT,
        name: entry.name,
        act: entry.act ?? null,
        room: entry.room ?? null,
        timestamp: entry.timestamp ?? null,
        quests: entry.quests ?? null,
        outdated: isOutdatedSave(entry.data),
      }))
  }

  /**
   * Run `write` with the story, and when the storage cannot hold it, again
   * without: the game is kept even when its story is not. SAVED, or
   * SAVE_FAILED when even the game cannot be stored.
   */
  function withStoryIfRoom(
    story: unknown,
    write: (story: unknown) => void,
  ): string {
    try {
      write(story)
    } catch {
      if (story === null) return SAVE_FAILED
      try {
        write(null)
      } catch {
        return SAVE_FAILED
      }
    }
    return SAVED
  }

  /** Save to slot `slot` (1–8), with `story` (the UI's story so far) beside it when there is room. */
  function saveToSlot(slot: number, story: unknown = null): string {
    if (slot < 1 || slot > SLOT_COUNT)
      return '[failure]Invalid save slot.[/failure]'
    const { game } = requireGame()
    return withStoryIfRoom(story, (told) => {
      const stored = readStoredSaveSlots()
      stored[slot - 1] = {
        slot,
        data: game.toSaveData(),
        ...saveDetails(),
        ...(told === null ? {} : { story: told }),
      }
      appStorage.setItem(SLOTS_KEY, JSON.stringify(stored))
    })
  }

  function loadFromSlot(slot: number): string {
    if (slot < 1 || slot > SLOT_COUNT) return NO_SAVE
    const entry = readStoredSaveSlots()[slot - 1]
    if (!entry) return NO_SAVE
    return loadWithStory(entry.data, entry.story)
  }

  /** Save under `name`, with `story` (the UI's story so far) beside it when there is room. */
  function saveNamedGame(name: string, story: unknown = null): string {
    const { game } = requireGame()
    return withStoryIfRoom(story, (told) => {
      const saves = readStoredNamedSaves()
      const entry: StoredNamedSave = {
        name,
        data: game.toSaveData(),
        ...saveDetails(),
        ...(told === null ? {} : { story: told }),
      }
      const existing = saves.findIndex((s) => s.name === name)
      if (existing >= 0) saves[existing] = entry
      else saves.push(entry)
      appStorage.setItem(NAMED_KEY, JSON.stringify(saves))
    })
  }

  function loadNamedGame(name: string): string {
    const entry = readStoredNamedSaves().find((s) => s.name === name)
    if (!entry) return NO_SAVE
    return loadWithStory(entry.data, entry.story)
  }

  return {
    init,
    isReady,
    newGame,
    /** The read model of the running game; throws before `init`. */
    get controller(): GameController {
      return requireGame().controller
    },
    pictureState,
    quickSaveGame,
    quickLoadGame,
    saveNamedGame,
    loadNamedGame,
    getSaveSlots,
    getNamedSaves,
    getQuickSave,
    saveToSlot,
    loadFromSlot,
    takeLoadedStory,
  }
}

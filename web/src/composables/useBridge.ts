/**
 * Vue composable wrapping the TypeScript game engine. Provides typed access
 * to the game and its controller, and keeps saves in the browser's storage.
 */
import { Game, GameController, type Act } from '@/engine'
import type { SaveSlot } from '@/types/bridge'

type StoredNamedSave = {
  name: string
  timestamp: string
  data: string
}

type StoredSaveSlot = {
  slot: number
  act: string
  room: string
  timestamp: string
  data: string
  /** Missing in saves made before quest counts were kept. */
  quests?: SaveSlot['quests']
}

/** The quick save's data and its details. */
const QUICK_KEY = 'retroquest_save'
const QUICK_META_KEY = 'retroquest_save_meta'
const SLOTS_KEY = 'retroquest_save_slots'
const NAMED_KEY = 'retroquest_named_saves'
const SLOT_COUNT = 8

/** A save the browser could not keep (storage full or blocked). */
const SAVE_FAILED =
  "[failure]The game could not be saved: this browser's storage is full or blocked.[/failure]"
const NO_SAVE = '[failure]No save file found.[/failure]'
const SAVED = 'Game saved.'

function readQuickMeta(): Partial<Omit<SaveSlot, 'slot'>> {
  try {
    const raw = localStorage.getItem(QUICK_META_KEY)
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
    const raw = localStorage.getItem(NAMED_KEY)
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
    const raw = localStorage.getItem(SLOTS_KEY)
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

/** The acts, loaded on demand so each is its own chunk of the build. */
/** An act the bridge can play. */
export type ActClass = new () => Act

async function loadActs(): Promise<ActClass[]> {
  const [{ Act1 }, { Act2 }, { Act3 }] = await Promise.all([
    import('@/act1/Act1'),
    import('@/act2/Act2'),
    import('@/act3/Act3'),
  ])
  return [Act1, Act2, Act3]
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

  function quickSaveGame(): string {
    const { game } = requireGame()
    try {
      const data = game.toSaveData()
      const meta = JSON.stringify(saveDetails())
      localStorage.setItem(QUICK_KEY, data)
      try {
        localStorage.setItem(QUICK_META_KEY, meta)
      } catch {
        // No details rather than the previous save's.
        localStorage.removeItem(QUICK_META_KEY)
      }
    } catch {
      return SAVE_FAILED
    }
    return SAVED
  }

  function quickLoadGame(): string {
    const data = localStorage.getItem(QUICK_KEY)
    if (!isSaveData(data)) return NO_SAVE
    return requireGame().game.loadSaveData(data)
  }

  /** The quick save as a card (slot 0), or null when there is none this engine can read. */
  function getQuickSave(): SaveSlot | null {
    if (!isSaveData(localStorage.getItem(QUICK_KEY))) return null
    const meta = readQuickMeta()
    return {
      slot: 0,
      act: meta.act ?? null,
      room: meta.room ?? null,
      timestamp: meta.timestamp ?? null,
      quests: meta.quests ?? null,
    }
  }

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
      }
    })
  }

  function saveToSlot(slot: number): string {
    if (slot < 1 || slot > SLOT_COUNT)
      return '[failure]Invalid save slot.[/failure]'
    const { game } = requireGame()
    try {
      const stored = readStoredSaveSlots()
      stored[slot - 1] = { slot, data: game.toSaveData(), ...saveDetails() }
      localStorage.setItem(SLOTS_KEY, JSON.stringify(stored))
    } catch {
      return SAVE_FAILED
    }
    return SAVED
  }

  function loadFromSlot(slot: number): string {
    if (slot < 1 || slot > SLOT_COUNT) return NO_SAVE
    const entry = readStoredSaveSlots()[slot - 1]
    if (!entry) return NO_SAVE
    return requireGame().game.loadSaveData(entry.data)
  }

  function saveNamedGame(name: string): string {
    const { game } = requireGame()
    try {
      const saves = readStoredNamedSaves()
      const entry: StoredNamedSave = {
        name,
        timestamp: new Date().toISOString(),
        data: game.toSaveData(),
      }
      const existing = saves.findIndex((s) => s.name === name)
      if (existing >= 0) saves[existing] = entry
      else saves.push(entry)
      localStorage.setItem(NAMED_KEY, JSON.stringify(saves))
    } catch {
      return SAVE_FAILED
    }
    return SAVED
  }

  function loadNamedGame(name: string): string {
    const entry = readStoredNamedSaves().find((s) => s.name === name)
    if (!entry) return NO_SAVE
    return requireGame().game.loadSaveData(entry.data)
  }

  return {
    init,
    isReady,
    newGame,
    /** The read model of the running game; throws before `init`. */
    get controller(): GameController {
      return requireGame().controller
    },
    quickSaveGame,
    quickLoadGame,
    saveNamedGame,
    loadNamedGame,
    getSaveSlots,
    getQuickSave,
    saveToSlot,
    loadFromSlot,
  }
}

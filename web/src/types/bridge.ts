/** TypeScript interfaces for the Pyodide bridge return types. */

/** One entry in the 8-slot save system. */
export interface SaveSlot {
  /** 1–8, or 0 for the quick save. */
  slot: number
  act: string | null
  room: string | null
  timestamp: string | null
  /** The act's quests done/total when saved (null for older saves). */
  quests: { completed: number; total: number } | null
}

/** Quest progress for the current act (from controller.get_quest_progress()). */
export interface QuestProgress {
  /** Quests completed in the current act. */
  completed: number
  /** All quests of the current act, including ones not yet started. */
  total: number
  /** 1-based number of the current act. */
  actNumber: number
  /** Plain name of the act's main quest, or null when it has none. */
  mainQuest: string | null
}

/** An act's statistics for its act-complete page (controller.get_act_stats()). */
export interface ActStats {
  questsCompleted: number
  questsTotal: number
  /** Spells known. */
  spells: number
  /** Rooms visited. */
  places: number
}

/** Something a merchant in the current room sells (controller.get_room_wares()). */
export interface RoomWare {
  name: string
  price: number
  seller: string
}

export interface NamedItem {
  name: string
  description: string
}

export interface MusicInfo {
  musicFile: string
  musicInfo: string
}

export interface RoomExits {
  [direction: string]: string
}

/**
 * Recursive type for the nested completion tree returned by
 * `game.get_command_completions()`. Each key maps to either another subtree
 * (more tokens available) or `null` (leaf / terminal token).
 */
export type CompletionTree = { [token: string]: CompletionTree | null }

/**
 * Pyodide runtime interface — subset of the loadPyodide() result
 * used by the bridge.
 */
export interface PyodideRuntime {
  runPython(code: string): unknown
  runPythonAsync(code: string): Promise<unknown>
  globals: {
    get(name: string): unknown
    set(name: string, value: unknown): void
  }
}

/** Result from a Python list/tuple that can be converted to JS. */
export interface PyProxy {
  toJs(): unknown
}

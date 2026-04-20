/** TypeScript interfaces for the Pyodide bridge return types. */

/** A named save slot with metadata. */
export interface NamedSave {
  name: string
  timestamp: string
}

/** One entry in the 8-slot save system. */
export interface SaveSlot {
  slot: number
  act: string | null
  room: string | null
  timestamp: string | null
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

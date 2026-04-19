/** TypeScript interfaces for the Pyodide bridge return types. */

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

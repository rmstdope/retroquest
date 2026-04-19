/**
 * Vue composable wrapping the Pyodide bridge to the Python game engine.
 * Provides typed access to all GameController methods.
 */
import type {
  PyodideRuntime,
  NamedItem,
  MusicInfo,
  RoomExits,
} from '@/types/bridge'

/**
 * Convert a Python list of (name, description) tuples to typed JS objects.
 */
function tuplesToNamedItems(pyResult: { toJs(): unknown }): NamedItem[] {
  const tuples = pyResult.toJs() as [string, string][]
  return tuples.map(([name, description]) => ({ name, description }))
}

/**
 * Return a nullable string from a Python optional result.
 */
function optionalString(value: unknown): string | null {
  return value === undefined || value === null ? null : (value as string)
}

export function useBridge() {
  let pyodide: PyodideRuntime | null = null
  let ready = false

  async function init(
    onProgress: (status: string) => void = () => {},
  ): Promise<void> {
    onProgress('Loading Python runtime...')

    const loadPyodide = (
      globalThis as unknown as {
        loadPyodide: (opts: { indexURL: string }) => Promise<PyodideRuntime>
      }
    ).loadPyodide

    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
    })

    onProgress('Loading game engine...')

    await pyodide.runPythonAsync(`
import sys
sys.path.insert(0, '/home/pyodide/src')
    `)

    await loadPythonSources(onProgress)

    onProgress('Starting game...')

    await pyodide.runPythonAsync(`
from retroquest.engine.Game import Game
from retroquest.engine.textualui.GameController import GameController
from retroquest.act1.Act1 import Act1
from retroquest.act2.Act2 import Act2
from retroquest.act3.Act3 import Act3

game = Game([Act1(), Act2(), Act3()], dev_mode=False)
controller = GameController(game)
    `)

    ready = true
    onProgress('Ready!')
  }

  async function loadPythonSources(
    onProgress: (status: string) => void,
  ): Promise<void> {
    if (!pyodide) throw new Error('Pyodide not initialized')
    const resp = await fetch('/python-src/manifest.json')
    const manifest: string[] = await resp.json()
    const total = manifest.length
    let loaded = 0

    for (const filePath of manifest) {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'))
      pyodide.runPython(
        `import os\nos.makedirs('/home/pyodide/src/${dir}', exist_ok=True)`,
      )

      const fileResp = await fetch(`/python-src/${filePath}`)
      const content = await fileResp.text()

      pyodide.runPython(
        `with open('/home/pyodide/src/${filePath}', 'w') as f:\n    f.write(${JSON.stringify(content)})`,
      )

      loaded++
      if (loaded % 10 === 0 || loaded === total) {
        onProgress(`Loading game files... (${loaded}/${total})`)
      }
    }
  }

  function py(code: string): unknown {
    if (!pyodide) throw new Error('Pyodide not initialized')
    return pyodide.runPython(code)
  }

  function startGame(): string {
    return py('controller.start()') as string
  }

  function advanceToRunning(): string[] {
    const result = py(`
results = []
while not game.is_act_running():
    text = game.get_result_text()
    results.append(text)
    game.new_turn()
results.append(game.get_result_text())
results
    `)
    return (result as { toJs(): unknown }).toJs() as string[]
  }

  function handleCommand(command: string): string {
    if (!pyodide) throw new Error('Pyodide not initialized')
    pyodide.globals.set('_cmd', command)
    return py(`
result = controller.handle_command(_cmd)
game.new_turn()
result
    `) as string
  }

  function getRoom(): string {
    return py('controller.get_room()') as string
  }

  function getRoomName(): string {
    return py('controller.get_room_name()') as string
  }

  function getRoomDescription(): string {
    return py('controller.get_room_description()') as string
  }

  function getRoomCharacters(): string[] {
    const result = py('controller.get_room_characters()')
    return (result as { toJs(): unknown }).toJs() as string[]
  }

  function getRoomItems(): string[] {
    const result = py('controller.get_room_items()')
    return (result as { toJs(): unknown }).toJs() as string[]
  }

  function getRoomExits(): RoomExits {
    const result = py('controller.get_room_exits()')
    return Object.fromEntries(
      (result as { toJs(): unknown }).toJs() as Iterable<[string, string]>,
    )
  }

  function getInventory(): NamedItem[] {
    return tuplesToNamedItems(
      py('controller.get_inventory()') as { toJs(): unknown },
    )
  }

  function getSpells(): NamedItem[] {
    return tuplesToNamedItems(
      py('controller.get_spells()') as { toJs(): unknown },
    )
  }

  function getActiveQuests(): NamedItem[] {
    return tuplesToNamedItems(
      py('controller.get_active_quests()') as { toJs(): unknown },
    )
  }

  function getCompletedQuests(): NamedItem[] {
    return tuplesToNamedItems(
      py('controller.get_completed_quests()') as { toJs(): unknown },
    )
  }

  function activateQuest(): string | null {
    return optionalString(py('controller.activate_quest()'))
  }

  function updateQuest(): string | null {
    return optionalString(py('controller.update_quest()'))
  }

  function completeQuest(): string | null {
    return optionalString(py('controller.complete_quest()'))
  }

  function look(): string {
    return py('controller.look()') as string
  }

  function getActIntro(): string {
    return py('controller.get_act_intro()') as string
  }

  function saveGame(): string {
    const result = py('controller.save_game() or ""')
    try {
      const saveData = py(`
import base64
try:
    with open('retroquest.save', 'rb') as f:
        base64.b64encode(f.read()).decode('ascii')
except FileNotFoundError:
    ''
      `) as string
      if (saveData) {
        localStorage.setItem('retroquest_save', saveData)
      }
    } catch {
      // Silently handle localStorage failures
    }
    return (result as string) || 'Game saved.'
  }

  function loadGame(): string {
    const saveData = localStorage.getItem('retroquest_save')
    if (!saveData) {
      return '[failure]No save file found.[/failure]'
    }
    if (!pyodide) throw new Error('Pyodide not initialized')
    pyodide.globals.set('_save_b64', saveData)
    pyodide.runPython(`
import base64
with open('retroquest.save', 'wb') as f:
    f.write(base64.b64decode(_save_b64))
    `)
    return py('controller.load_game()') as string
  }

  function isAcceptingInput(): boolean {
    return py('game.accept_input') as boolean
  }

  function advanceTurn(): string {
    return py(`
_result_text = game.get_result_text()
game.new_turn()
_result_text
    `) as string
  }

  function isGameRunning(): boolean {
    return py('controller.is_game_running()') as boolean
  }

  function isActRunning(): boolean {
    return py('controller.is_act_running()') as boolean
  }

  function getMusicInfo(): MusicInfo {
    const result = py('controller.get_current_music()')
    const [musicFile, musicInfo] = (result as { toJs(): unknown }).toJs() as [
      string,
      string,
    ]
    return { musicFile, musicInfo }
  }

  function isReady(): boolean {
    return ready
  }

  return {
    init,
    isReady,
    startGame,
    advanceToRunning,
    handleCommand,
    getRoom,
    getRoomName,
    getRoomDescription,
    getRoomCharacters,
    getRoomItems,
    getRoomExits,
    getInventory,
    getSpells,
    getActiveQuests,
    getCompletedQuests,
    activateQuest,
    updateQuest,
    completeQuest,
    look,
    getActIntro,
    saveGame,
    loadGame,
    isAcceptingInput,
    advanceTurn,
    isGameRunning,
    isActRunning,
    getMusicInfo,
  }
}

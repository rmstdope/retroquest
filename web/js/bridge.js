/**
 * Pyodide bridge: loads the Python game engine in WebAssembly
 * and exposes controller methods to JavaScript.
 */

const RetroBridge = {
    pyodide: null,
    controller: null,
    game: null,
    ready: false,

    /**
     * Initialize Pyodide, load the game engine, and create instances.
     * @param {function} onProgress - Callback with status messages.
     * @returns {Promise<void>}
     */
    async init(onProgress = () => {}) {
        onProgress('Loading Python runtime...');
        // Load Pyodide from CDN
        this.pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
        });

        onProgress('Loading game engine...');

        // Add the src directory to Python's import path
        // Files are served by serve.py at /src/
        await this.pyodide.runPythonAsync(`
import sys
import os
from pathlib import Path

# Set up the virtual filesystem to load Python source
# We'll fetch and write files to the Pyodide FS
sys.path.insert(0, '/home/pyodide/src')
        `);

        // Fetch and install the Python source tree into Pyodide's FS
        await this._loadPythonSources(onProgress);

        onProgress('Starting game...');

        // Initialize the game
        await this.pyodide.runPythonAsync(`
from retroquest.engine.Game import Game
from retroquest.engine.textualui.GameController import GameController
from retroquest.act1.Act1 import Act1
from retroquest.act2.Act2 import Act2
from retroquest.act3.Act3 import Act3

game = Game([Act1(), Act2(), Act3()], dev_mode=False)
controller = GameController(game)
        `);

        this.controller = this.pyodide.globals.get('controller');
        this.game = this.pyodide.globals.get('game');
        this.ready = true;
        onProgress('Ready!');
    },

    /**
     * Fetch the Python source file manifest and write all files
     * into Pyodide's in-memory filesystem.
     */
    async _loadPythonSources(onProgress) {
        // Fetch the manifest of Python files
        const resp = await fetch('/src/manifest.json');
        const manifest = await resp.json();

        const total = manifest.length;
        let loaded = 0;

        for (const filePath of manifest) {
            // Ensure parent directories exist in Pyodide FS
            const dir = filePath.substring(0, filePath.lastIndexOf('/'));
            this.pyodide.runPython(`
import os
os.makedirs('/home/pyodide/src/${dir}', exist_ok=True)
            `);

            // Fetch the file and write it
            const fileResp = await fetch(`/src/${filePath}`);
            const content = await fileResp.text();

            // Write file to Pyodide FS — use repr to safely escape content
            this.pyodide.runPython(`
with open('/home/pyodide/src/${filePath}', 'w') as f:
    f.write(${JSON.stringify(content)})
            `);

            loaded++;
            if (loaded % 10 === 0 || loaded === total) {
                onProgress(
                    `Loading game files... (${loaded}/${total})`
                );
            }
        }
    },

    /**
     * Advance the game to the next turn and return the result text.
     * Call this once on startup to move past SHOW_LOGO → ACT_INTRO.
     * @returns {string} The current result text.
     */
    startGame() {
        return this.pyodide.runPython(`
controller.start()
        `);
    },

    /**
     * Advance through the game's initial states (logo, act intro)
     * by calling new_turn() until the act is running.
     * @returns {Array<string>} Array of display texts from each phase.
     */
    advanceToRunning() {
        const texts = [];
        const result = this.pyodide.runPython(`
results = []
# Advance through logo and act intro
while not game.is_act_running():
    text = game.get_result_text()
    results.append(text)
    game.new_turn()
# Get the initial act running text
results.append(game.get_result_text())
results
        `);
        return result.toJs();
    },

    /**
     * Send a command to the game and return the result text.
     * @param {string} command - Player command string.
     * @returns {string} Themed result text.
     */
    handleCommand(command) {
        // Safely pass the command string to Python
        this.pyodide.globals.set('_cmd', command);
        return this.pyodide.runPython(`
result = controller.handle_command(_cmd)
game.new_turn()
result
        `);
    },

    /**
     * Get themed room description (full, including entities/exits).
     * @returns {string} Themed room text.
     */
    getRoom() {
        return this.pyodide.runPython('controller.get_room()');
    },

    /** @returns {string} Current room display name. */
    getRoomName() {
        return this.pyodide.runPython('controller.get_room_name()');
    },

    /** @returns {string} Room narrative description. */
    getRoomDescription() {
        return this.pyodide.runPython(
            'controller.get_room_description()'
        );
    },

    /** @returns {string[]} Character names in current room. */
    getRoomCharacters() {
        const result = this.pyodide.runPython(
            'controller.get_room_characters()'
        );
        return result.toJs();
    },

    /** @returns {string[]} Item names in current room. */
    getRoomItems() {
        const result = this.pyodide.runPython(
            'controller.get_room_items()'
        );
        return result.toJs();
    },

    /** @returns {Object<string, string>} Direction → destination map. */
    getRoomExits() {
        const result = this.pyodide.runPython(
            'controller.get_room_exits()'
        );
        return Object.fromEntries(result.toJs());
    },

    /**
     * @returns {Array<{name: string, description: string}>}
     */
    getInventory() {
        const result = this.pyodide.runPython(
            'controller.get_inventory()'
        );
        const tuples = result.toJs();
        return tuples.map(([name, desc]) => ({
            name, description: desc,
        }));
    },

    /**
     * @returns {Array<{name: string, description: string}>}
     */
    getSpells() {
        const result = this.pyodide.runPython(
            'controller.get_spells()'
        );
        const tuples = result.toJs();
        return tuples.map(([name, desc]) => ({
            name, description: desc,
        }));
    },

    /**
     * @returns {Array<{name: string, description: string}>}
     */
    getActiveQuests() {
        const result = this.pyodide.runPython(
            'controller.get_active_quests()'
        );
        const tuples = result.toJs();
        return tuples.map(([name, desc]) => ({
            name, description: desc,
        }));
    },

    /**
     * @returns {Array<{name: string, description: string}>}
     */
    getCompletedQuests() {
        const result = this.pyodide.runPython(
            'controller.get_completed_quests()'
        );
        const tuples = result.toJs();
        return tuples.map(([name, desc]) => ({
            name, description: desc,
        }));
    },

    /**
     * Poll for a quest activation event.
     * @returns {string|null} Quest popup text or null.
     */
    activateQuest() {
        const result = this.pyodide.runPython(
            'controller.activate_quest()'
        );
        return result === undefined || result === null
            ? null : result;
    },

    /**
     * Poll for a quest update event.
     * @returns {string|null} Quest popup text or null.
     */
    updateQuest() {
        const result = this.pyodide.runPython(
            'controller.update_quest()'
        );
        return result === undefined || result === null
            ? null : result;
    },

    /**
     * Poll for a quest completion event.
     * @returns {string|null} Quest popup text or null.
     */
    completeQuest() {
        const result = this.pyodide.runPython(
            'controller.complete_quest()'
        );
        return result === undefined || result === null
            ? null : result;
    },

    /** @returns {string} Look command result. */
    look() {
        return this.pyodide.runPython('controller.look()');
    },

    /** @returns {string} Act intro text. */
    getActIntro() {
        return this.pyodide.runPython('controller.get_act_intro()');
    },

    /**
     * Save game to Pyodide FS then sync to localStorage.
     * @returns {string} Result message.
     */
    saveGame() {
        const result = this.pyodide.runPython(
            'controller.save_game() or ""'
        );
        // Read the save file from Pyodide FS and store in localStorage
        try {
            const saveData = this.pyodide.runPython(`
import base64
try:
    with open('retroquest.save', 'rb') as f:
        base64.b64encode(f.read()).decode('ascii')
except FileNotFoundError:
    ''
            `);
            if (saveData) {
                localStorage.setItem('retroquest_save', saveData);
            }
        } catch (e) {
            console.warn('Failed to sync save to localStorage:', e);
        }
        return result || 'Game saved.';
    },

    /**
     * Restore save from localStorage to Pyodide FS then load.
     * @returns {string} Result message.
     */
    loadGame() {
        const saveData = localStorage.getItem('retroquest_save');
        if (!saveData) {
            return '[failure]No save file found.[/failure]';
        }
        // Write the save data to Pyodide FS
        this.pyodide.globals.set('_save_b64', saveData);
        this.pyodide.runPython(`
import base64
with open('retroquest.save', 'wb') as f:
    f.write(base64.b64decode(_save_b64))
        `);
        return this.pyodide.runPython('controller.load_game()');
    },

    /** @returns {boolean} Whether the game currently accepts free-form input. */
    isAcceptingInput() {
        return this.pyodide.runPython('game.accept_input');
    },

    /**
     * Advance the game by one turn (used during ACT_INTRO / ACT_TRANSITION).
     * Calls game.new_turn() and returns the current result text.
     * @returns {string} The current result text after advancing.
     */
    advanceTurn() {
        return this.pyodide.runPython(`
game.new_turn()
game.get_result_text()
        `);
    },

    /** @returns {boolean} Whether the game is still running. */
    isGameRunning() {
        return this.pyodide.runPython(
            'controller.is_game_running()'
        );
    },

    /** @returns {boolean} Whether the current act is running. */
    isActRunning() {
        return this.pyodide.runPython(
            'controller.is_act_running()'
        );
    },

    /**
     * Get the music file and attribution info for the current act.
     * Returns { musicFile: '', musicInfo: '' } when act is not running.
     * @returns {{ musicFile: string, musicInfo: string }}
     */
    getMusicInfo() {
        const result = this.pyodide.runPython(
            'controller.get_current_music()'
        );
        const [musicFile, musicInfo] = result.toJs();
        return { musicFile, musicInfo };
    },
};

window.RetroBridge = RetroBridge;

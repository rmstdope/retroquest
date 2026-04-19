/**
 * RetroQuest Web Frontend — Alpine.js Application Store
 *
 * Manages game state, UI interactions, and bridges between
 * the Pyodide game engine and the HTML interface.
 */

document.addEventListener('alpine:init', () => {
    Alpine.store('game', {
        // --- Loading state ---
        loading: true,
        loadingStatus: 'Initializing...',

        // --- Room data ---
        roomName: '',
        roomDescription: '',
        characters: [],
        items: [],
        exits: {},

        // --- Panels ---
        inventory: [],
        spells: [],
        activeQuests: [],
        completedQuests: [],

        // --- Output ---
        lastOutput: '',
        introText: '',

        // --- UI state ---
        commandInput: '',
        showContextMenu: false,
        contextMenuX: 0,
        contextMenuY: 0,
        contextMenuTarget: null,
        contextMenuType: '',
        contextMenuActions: [],

        // --- Mobile ---
        showActionSheet: false,
        actionSheetTarget: null,
        actionSheetType: '',
        actionSheetActions: [],
        showDrawer: false,

        // --- Modal ---
        showModal: false,
        modalTitle: '',
        modalBody: '',
        modalQueue: [],

        // --- Sidebar sections ---
        showActiveQuests: true,
        showCompletedQuests: false,
        showInventory: true,
        showSpells: true,

        // --- Music ---
        musicMuted: false,
        currentMusicFile: '',
        musicInfo: '',

        // Direction arrows for exit display
        directionArrows: {
            north: '↑', south: '↓', east: '→', west: '←',
            up: '⬆', down: '⬇',
            northeast: '↗', northwest: '↖',
            southeast: '↘', southwest: '↙',
        },

        /**
         * Initialize the game: boot Pyodide and load the engine.
         */
        async init() {
            // Restore persisted mute preference before the game starts.
            this.musicMuted =
                localStorage.getItem('retroquest_music_muted') === 'true';

            try {
                await RetroBridge.init((status) => {
                    this.loadingStatus = status;
                });

                // Advance through logo and act intro
                const texts = RetroBridge.advanceToRunning();
                this.introText = texts
                    .map(t => RetroTheme.renderMarkup(t))
                    .join('<hr style="border-color:var(--border-color);margin:12px 0">');

                // Refresh all panel data
                this.refreshPanels();

                this.loading = false;
            } catch (err) {
                this.loadingStatus = `Error: ${err.message}`;
                console.error('Failed to initialize game:', err);
            }
        },

        /**
         * Submit a command (from text input, chip click, etc.)
         */
        submitCommand(cmd) {
            if (!cmd || !cmd.trim()) return;

            const result = RetroBridge.handleCommand(cmd.trim());
            this.lastOutput = RetroTheme.renderMarkup(result);
            this.commandInput = '';

            // Refresh all panels after command
            this.refreshPanels();

            // Retry music playback on first user gesture (browser autoplay policy)
            this._ensureMusicStarted();

            // Append music attribution to help output
            if (cmd.trim().toLowerCase() === 'help' && this.musicInfo) {
                this.lastOutput += this._buildMusicAttributionHtml();
            }

            // Check for quest events
            this.pollQuestEvents();
        },

        /**
         * Refresh all panel data from the bridge.
         */
        refreshPanels() {
            this.roomName = RetroBridge.getRoomName();
            this.roomDescription = RetroBridge.getRoomDescription();
            this.characters = RetroBridge.getRoomCharacters();
            this.items = RetroBridge.getRoomItems();
            this.exits = RetroBridge.getRoomExits();
            this.inventory = RetroBridge.getInventory();
            this.spells = RetroBridge.getSpells();
            this.activeQuests = RetroBridge.getActiveQuests();
            this.completedQuests = RetroBridge.getCompletedQuests();
            const m = RetroBridge.getMusicInfo();
            this._loadMusicTrack(m.musicFile, m.musicInfo);
        },

        /**
         * Poll for quest activation/update/completion events
         * and queue modal popups for each.
         */
        pollQuestEvents() {
            const events = [];

            // Check activated quests
            let activated;
            while ((activated = RetroBridge.activateQuest()) !== null) {
                events.push({
                    title: '📜 New Quest!',
                    body: RetroTheme.renderMarkup(activated),
                });
            }

            // Check updated quests
            let updated;
            while ((updated = RetroBridge.updateQuest()) !== null) {
                events.push({
                    title: '📜 Quest Updated',
                    body: RetroTheme.renderMarkup(updated),
                });
            }

            // Check completed quests
            let completed;
            while ((completed = RetroBridge.completeQuest()) !== null) {
                events.push({
                    title: '🏆 Quest Complete!',
                    body: RetroTheme.renderMarkup(completed),
                });
            }

            if (events.length > 0) {
                this.modalQueue.push(...events);
                if (!this.showModal) {
                    this.showNextModal();
                }
            }

            // Refresh quests panel after processing events
            this.activeQuests = RetroBridge.getActiveQuests();
            this.completedQuests = RetroBridge.getCompletedQuests();
        },

        /**
         * Show the next modal in the queue.
         */
        showNextModal() {
            if (this.modalQueue.length === 0) {
                this.showModal = false;
                return;
            }
            const event = this.modalQueue.shift();
            this.modalTitle = event.title;
            this.modalBody = event.body;
            this.showModal = true;
        },

        /**
         * Dismiss the current modal and show the next one.
         */
        dismissModal() {
            this.showNextModal();
        },

        /**
         * Determine if we're on a touch/mobile device.
         */
        isMobile() {
            return window.innerWidth <= 768;
        },

        /**
         * Handle entity chip click — show context menu or action sheet.
         */
        onEntityClick(event, name, type) {
            const actions = this.getActionsForType(type, name);

            if (this.isMobile()) {
                this.actionSheetTarget = name;
                this.actionSheetType = type;
                this.actionSheetActions = actions;
                this.showActionSheet = true;
            } else {
                this.contextMenuTarget = name;
                this.contextMenuType = type;
                this.contextMenuActions = actions;
                this.contextMenuX = Math.min(
                    event.clientX,
                    window.innerWidth - 200
                );
                this.contextMenuY = Math.min(
                    event.clientY,
                    window.innerHeight - 250
                );
                this.showContextMenu = true;
            }
        },

        /**
         * Handle inventory item click.
         */
        onInventoryClick(event, name) {
            // Strip markup tags and count prefix from the name
            const cleanName = name
                .replace(/\[.*?\]/g, '')
                .replace(/^\d+\s+/, '')
                .trim();
            const actions = [
                { label: '👀 Look at', cmd: `look ${cleanName}` },
                { label: '🔧 Use', cmd: `use ${cleanName}` },
                { label: '🗑️ Drop', cmd: `drop ${cleanName}` },
            ];

            if (this.isMobile()) {
                this.actionSheetTarget = cleanName;
                this.actionSheetType = 'inventory';
                this.actionSheetActions = actions;
                this.showActionSheet = true;
            } else {
                this.contextMenuTarget = cleanName;
                this.contextMenuType = 'inventory';
                this.contextMenuActions = actions;
                this.contextMenuX = Math.min(
                    event.clientX,
                    window.innerWidth - 200
                );
                this.contextMenuY = Math.min(
                    event.clientY,
                    window.innerHeight - 250
                );
                this.showContextMenu = true;
            }
        },

        /**
         * Handle spell item click.
         */
        onSpellClick(event, name) {
            const cleanName = name
                .replace(/\[.*?\]/g, '')
                .trim();
            const actions = [
                { label: '✨ Cast', cmd: `cast ${cleanName}` },
                { label: '👀 Look at', cmd: `look ${cleanName}` },
            ];

            if (this.isMobile()) {
                this.actionSheetTarget = cleanName;
                this.actionSheetType = 'spell';
                this.actionSheetActions = actions;
                this.showActionSheet = true;
            } else {
                this.contextMenuTarget = cleanName;
                this.contextMenuType = 'spell';
                this.contextMenuActions = actions;
                this.contextMenuX = Math.min(
                    event.clientX,
                    window.innerWidth - 200
                );
                this.contextMenuY = Math.min(
                    event.clientY,
                    window.innerHeight - 250
                );
                this.showContextMenu = true;
            }
        },

        /**
         * Get available actions for an entity type.
         */
        getActionsForType(type, name) {
            if (type === 'character') {
                return [
                    { label: '💬 Talk to', cmd: `talk to ${name}` },
                    { label: '👀 Look at', cmd: `look ${name}` },
                    { label: '🎁 Give item...', cmd: `give`, needsItem: true },
                    { label: '✨ Cast spell...', cmd: `cast`, needsSpell: true },
                ];
            } else if (type === 'item') {
                return [
                    { label: '✋ Take', cmd: `take ${name}` },
                    { label: '👀 Look at', cmd: `look ${name}` },
                    { label: '🔧 Use', cmd: `use ${name}` },
                ];
            }
            return [];
        },

        /**
         * Execute a context menu / action sheet action.
         */
        executeAction(action) {
            if (action.needsItem) {
                // Show inventory sub-selection
                const target = this.contextMenuTarget
                    || this.actionSheetTarget;
                // For simplicity, prompt for item name via a
                // secondary action sheet showing inventory items
                this.closeMenus();
                if (this.inventory.length === 0) {
                    this.lastOutput = RetroTheme.renderMarkup(
                        '[failure]You have no items to give.[/failure]'
                    );
                    return;
                }
                const invActions = this.inventory.map(item => {
                    const cleanName = item.name
                        .replace(/\[.*?\]/g, '')
                        .replace(/^\d+\s+/, '')
                        .trim();
                    return {
                        label: `🎁 ${cleanName}`,
                        cmd: `give ${cleanName} to ${target}`,
                    };
                });
                // Re-show as sub-menu
                if (this.isMobile()) {
                    this.actionSheetTarget = `Give to ${target}`;
                    this.actionSheetActions = invActions;
                    this.showActionSheet = true;
                } else {
                    this.contextMenuActions = invActions;
                    this.showContextMenu = true;
                }
                return;
            }

            if (action.needsSpell) {
                const target = this.contextMenuTarget
                    || this.actionSheetTarget;
                this.closeMenus();
                if (this.spells.length === 0) {
                    this.lastOutput = RetroTheme.renderMarkup(
                        '[failure]You know no spells.[/failure]'
                    );
                    return;
                }
                const spellActions = this.spells.map(spell => {
                    const cleanName = spell.name
                        .replace(/\[.*?\]/g, '')
                        .trim();
                    return {
                        label: `✨ ${cleanName}`,
                        cmd: `cast ${cleanName} on ${target}`,
                    };
                });
                if (this.isMobile()) {
                    this.actionSheetTarget =
                        `Cast on ${target}`;
                    this.actionSheetActions = spellActions;
                    this.showActionSheet = true;
                } else {
                    this.contextMenuActions = spellActions;
                    this.showContextMenu = true;
                }
                return;
            }

            this.closeMenus();
            this.submitCommand(action.cmd);
        },

        /**
         * Close all menus.
         */
        closeMenus() {
            this.showContextMenu = false;
            this.showActionSheet = false;
        },

        /**
         * Navigate to a room via an exit.
         */
        goDirection(direction) {
            this.submitCommand(`go ${direction}`);
        },

        /**
         * Save the game.
         */
        saveGame() {
            const result = RetroBridge.saveGame();
            this.lastOutput = RetroTheme.renderMarkup(result);
        },

        /**
         * Load the game.
         */
        loadGame() {
            const result = RetroBridge.loadGame();
            this.lastOutput = RetroTheme.renderMarkup(result);
            this.refreshPanels();
            this._ensureMusicStarted();
        },

        /**
         * Toggle drawer (mobile sidebar).
         */
        toggleDrawer() {
            this.showDrawer = !this.showDrawer;
        },

        /**
         * Get the direction arrow for an exit.
         */
        getArrow(direction) {
            return this.directionArrows[direction.toLowerCase()]
                || '•';
        },

        /**
         * Load a music track into the <audio> element when the file changes.
         * Silently swallows autoplay rejection (browser policy) — playback
         * will be retried via _ensureMusicStarted() on the next user gesture.
         * @param {string} file - Filename (no path) of the MP3 to play.
         * @param {string} info - Attribution text for the track.
         */
        _loadMusicTrack(file, info) {
            if (!file || file === this.currentMusicFile) return;
            this.currentMusicFile = file;
            this.musicInfo = info;
            const audio = document.getElementById('bg-music');
            const url = '/src/retroquest/audio/music/'
                + encodeURIComponent(file);
            audio.src = url;
            if (!this.musicMuted) {
                audio.play().catch(() => {});
            }
        },

        /**
         * Retry music playback if the track is loaded but paused.
         * Call this inside user-gesture handlers to recover from
         * browser autoplay blocking.
         */
        _ensureMusicStarted() {
            if (!this.currentMusicFile || this.musicMuted) return;
            const audio = document.getElementById('bg-music');
            if (audio && audio.paused) {
                audio.play().catch(() => {});
            }
        },

        /**
         * Build the HTML snippet that shows the current track attribution.
         * Renders each non-empty line of musicInfo, with URLs linkified.
         * @returns {string} HTML string to append to command output.
         */
        _buildMusicAttributionHtml() {
            const lines = this.musicInfo
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .map(l => l.replace(
                    /(https?:\/\/[^\s]+)/g,
                    '<a href="$1" target="_blank" rel="noopener">$1</a>'
                ))
                .join('<br>');
            return '<hr style="border-color:var(--border-color);margin:12px 0">'
                + '<div style="opacity:0.7;font-size:0.85em">'
                + '🎵 <strong>Now playing:</strong><br>' + lines
                + '</div>';
        },

        /**
         * Toggle music mute state and persist the preference to localStorage.
         */
        toggleMute() {
            this.musicMuted = !this.musicMuted;
            localStorage.setItem(
                'retroquest_music_muted', String(this.musicMuted)
            );
            const audio = document.getElementById('bg-music');
            if (!audio) return;
            if (this.musicMuted) {
                audio.pause();
            } else if (this.currentMusicFile) {
                audio.play().catch(() => {});
            }
        },
    });
});

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NamedItem, RoomExits, CompletionTree } from '@/types/bridge'
import { renderMarkup } from '@/utils/theme'

/**
 * Shape of the bridge object injected via setBridge().
 * Matches the return type of useBridge().
 */
export interface GameBridge {
  init(onProgress?: (status: string) => void): Promise<void>
  isReady(): boolean
  handleCommand(command: string): string
  getRoomName(): string
  getRoomDescription(): string
  getRoomCharacters(): string[]
  getRoomItems(): string[]
  getRoomExits(): RoomExits
  getInventory(): NamedItem[]
  getSpells(): NamedItem[]
  getActiveQuests(): NamedItem[]
  getCompletedQuests(): NamedItem[]
  activateQuest(): string | null
  updateQuest(): string | null
  completeQuest(): string | null
  saveGame(): string
  loadGame(): string
  isAcceptingInput(): boolean
  getCommandCompletions(): CompletionTree
  advanceTurn(): string
  getMusicInfo(): { musicFile: string; musicInfo: string }
  look(): string
}

/** Minimal interface required for quest sound-effect playback. */
export interface QuestAudioPlayer {
  playNewQuest(): void
  playQuestComplete(): void
}

interface QuestEvent {
  title: string
  body: string
}

export const useGameStore = defineStore('game', () => {
  // --- Bridge reference ---
  let bridge: GameBridge | null = null

  // --- Audio player reference ---
  let audioPlayer: QuestAudioPlayer | null = null

  // --- Loading ---
  const loading = ref(true)
  const loadingStatus = ref('Initializing...')

  // --- Room data ---
  const roomName = ref('')
  const roomDescription = ref('')
  const characters = ref<string[]>([])
  const items = ref<string[]>([])
  const exits = ref<RoomExits>({})

  // --- Panels ---
  const inventory = ref<NamedItem[]>([])
  const spells = ref<NamedItem[]>([])
  const activeQuests = ref<NamedItem[]>([])
  const completedQuests = ref<NamedItem[]>([])

  // --- Output ---
  const lastOutput = ref('')
  const introText = ref('')

  // --- Input ---
  const acceptInput = ref(false)

  // --- Completion tree (refreshed after every command / panel refresh) ---
  const completionTree = ref<CompletionTree>({})

  // --- Sidebar sections ---
  const showActiveQuests = ref(true)
  const showCompletedQuests = ref(false)
  const showInventory = ref(true)
  const showSpells = ref(true)

  // --- Modal ---
  const showModal = ref(false)
  const modalTitle = ref('')
  const modalBody = ref('')
  const modalQueue = ref<QuestEvent[]>([])
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

      // Advance SHOW_LOGO → ACT_INTRO: get the logo/splash text for the output area
      const logoRaw = b.advanceTurn()
      introText.value = renderMarkup(logoRaw)

      // Advance ACT_INTRO → ACT_RUNNING: get the act intro text
      const actIntroRaw = b.advanceTurn()
      refreshPanels()

      // Block input until the player dismisses the act intro modal
      acceptInput.value = false
      pendingLookOnDismiss = true
      modalQueue.value.push({
        title: '📖 Act Intro',
        body: renderMarkup(actIntroRaw),
      })
      if (!showModal.value) {
        showNextModal()
      }

      loading.value = false
    } catch (err) {
      loadingStatus.value = `Error: ${(err as Error).message}`
    }
  }

  function submitCommand(cmd: string): void {
    if (!acceptInput.value) return
    if (!cmd || !cmd.trim()) return

    const b = requireBridge()
    const result = b.handleCommand(cmd.trim())
    lastOutput.value = renderMarkup(result)
    refreshPanels()
    pollQuestEvents()
  }

  function advanceTurn(): void {
    const b = requireBridge()
    const result = b.advanceTurn()
    lastOutput.value = renderMarkup(result)
    refreshPanels()
  }

  function refreshPanels(): void {
    const b = requireBridge()
    const renderItem = (item: NamedItem): NamedItem => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    })
    roomName.value = b.getRoomName()
    roomDescription.value = b.getRoomDescription()
    characters.value = b.getRoomCharacters()
    items.value = b.getRoomItems()
    exits.value = b.getRoomExits()
    inventory.value = b.getInventory().map(renderItem)
    spells.value = b.getSpells().map(renderItem)
    activeQuests.value = b.getActiveQuests().map(renderItem)
    completedQuests.value = b.getCompletedQuests().map(renderItem)
    const m = b.getMusicInfo()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
    acceptInput.value = b.isAcceptingInput()
    completionTree.value = b.getCommandCompletions()
  }

  function saveGame(): void {
    const b = requireBridge()
    const result = b.saveGame()
    lastOutput.value = renderMarkup(result)
  }

  function loadGame(): void {
    const b = requireBridge()
    const result = b.loadGame()
    lastOutput.value = renderMarkup(result)
    refreshPanels()
  }

  function pollQuestEvents(): void {
    const b = requireBridge()
    const events: QuestEvent[] = []

    let activated: string | null
    while ((activated = b.activateQuest()) !== null) {
      events.push({
        title: '📜 New Quest!',
        body: renderMarkup(activated),
      })
      audioPlayer?.playNewQuest()
    }

    let updated: string | null
    while ((updated = b.updateQuest()) !== null) {
      events.push({
        title: '📜 Quest Updated',
        body: renderMarkup(updated),
      })
      audioPlayer?.playNewQuest()
    }

    let completed: string | null
    while ((completed = b.completeQuest()) !== null) {
      events.push({
        title: '🏆 Quest Complete!',
        body: renderMarkup(completed),
      })
      audioPlayer?.playQuestComplete()
    }

    if (events.length > 0) {
      modalQueue.value.push(...events)
      if (!showModal.value) {
        showNextModal()
      }
    }

    activeQuests.value = b.getActiveQuests().map((item) => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    }))
    completedQuests.value = b.getCompletedQuests().map((item) => ({
      name: renderMarkup(item.name),
      description: renderMarkup(item.description),
    }))
  }

  function showNextModal(): void {
    if (modalQueue.value.length === 0) {
      showModal.value = false
      return
    }
    const event = modalQueue.value.shift()!
    modalTitle.value = event.title
    modalBody.value = event.body
    showModal.value = true
  }

  function dismissModal(): void {
    showNextModal()
    // When the last modal is dismissed, restore input acceptance from the bridge
    if (!showModal.value) {
      const b = requireBridge()
      acceptInput.value = b.isAcceptingInput()
      // If this was the act intro modal, fire a look to trigger quest start
      if (pendingLookOnDismiss) {
        pendingLookOnDismiss = false
        lastOutput.value = renderMarkup(b.look())
        refreshPanels()
        pollQuestEvents()
      }
    }
  }

  function toggleSection(section: string): void {
    const map: Record<string, typeof showActiveQuests> = {
      activeQuests: showActiveQuests,
      completedQuests: showCompletedQuests,
      inventory: showInventory,
      spells: showSpells,
    }
    const toggle = map[section]
    if (toggle) toggle.value = !toggle.value
  }

  /**
   * Perform Tab completion on the current command input.
   *
   * Mirrors the logic of NestedSuggester.get_suggestion() in the Python engine:
   * - Splits the input into previously-completed tokens and a partial last token.
   * - Traverses the completion tree for the completed tokens.
   * - Collects candidates that match the partial last token as a prefix.
   * - When exactly one candidate is found, auto-expands and keeps going while
   *   each subsequent level also has exactly one option (chain expansion).
   *
   * Returns an object with:
   *   - `newInput`: the expanded command string (unchanged if ambiguous / no match)
   *   - `candidates`: the list of matching next tokens (empty if no match)
   */
  function tabComplete(input: string): {
    newInput: string
    candidates: string[]
  } {
    const tokens = input.split(' ')
    const lastToken = tokens[tokens.length - 1]
    const prevTokens = tokens.slice(0, -1)

    let node: CompletionTree | null = completionTree.value
    for (const token of prevTokens) {
      if (node && token in node) {
        node = node[token]
      } else {
        return { newInput: input, candidates: [] }
      }
    }

    if (!node || typeof node !== 'object') {
      return { newInput: input, candidates: [] }
    }

    const candidates = Object.keys(node).filter((k) => k.startsWith(lastToken))

    if (candidates.length === 1) {
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

  return {
    // State
    loading,
    loadingStatus,
    roomName,
    roomDescription,
    characters,
    items,
    exits,
    inventory,
    spells,
    activeQuests,
    completedQuests,
    lastOutput,
    introText,
    acceptInput,
    showActiveQuests,
    showCompletedQuests,
    showInventory,
    showSpells,
    showModal,
    modalTitle,
    modalBody,
    musicFile,
    musicInfo,
    // Actions
    setBridge,
    setAudioPlayer,
    initGame,
    submitCommand,
    advanceTurn,
    refreshPanels,
    saveGame,
    loadGame,
    pollQuestEvents,
    dismissModal,
    toggleSection,
    tabComplete,
  }
})

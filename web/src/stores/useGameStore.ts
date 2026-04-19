import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NamedItem, RoomExits } from '@/types/bridge'
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
  advanceTurn(): string
  isActRunning(): boolean
  isActTransitioning(): boolean
  getResultText(): string
  getMusicInfo(): { musicFile: string; musicInfo: string }
}

interface QuestEvent {
  title: string
  body: string
}

export const useGameStore = defineStore('game', () => {
  // --- Bridge reference ---
  let bridge: GameBridge | null = null

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

  // --- Music (exposed for useMusic composable) ---
  const musicFile = ref('')
  const musicInfo = ref('')

  // --- Act Transition ---
  const actTransitioning = ref(false)
  const transitionText = ref('')

  function setBridge(b: GameBridge) {
    bridge = b
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

      const introRaw = b.advanceTurn()
      introText.value = renderMarkup(introRaw)
      acceptInput.value = b.isAcceptingInput()
      refreshPanels()
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

    if (!b.isActRunning()) {
      showTransitionPhase(b)
      return
    }

    refreshPanels()
    pollQuestEvents()
  }

  function showTransitionPhase(b: GameBridge): void {
    transitionText.value = renderMarkup(b.getResultText())
    actTransitioning.value = true
    acceptInput.value = false
  }

  function advanceTurn(): void {
    const b = requireBridge()
    if (actTransitioning.value) {
      b.advanceTurn()
      if (b.isActRunning()) {
        actTransitioning.value = false
        refreshPanels()
      } else {
        showTransitionPhase(b)
      }
      return
    }
    const result = b.advanceTurn()
    lastOutput.value = renderMarkup(result)
    refreshPanels()
  }

  function refreshPanels(): void {
    const b = requireBridge()
    roomName.value = b.getRoomName()
    roomDescription.value = b.getRoomDescription()
    characters.value = b.getRoomCharacters()
    items.value = b.getRoomItems()
    exits.value = b.getRoomExits()
    inventory.value = b.getInventory()
    spells.value = b.getSpells()
    activeQuests.value = b.getActiveQuests()
    completedQuests.value = b.getCompletedQuests()
    const m = b.getMusicInfo()
    musicFile.value = m.musicFile
    musicInfo.value = m.musicInfo
    acceptInput.value = b.isAcceptingInput()
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
    }

    let updated: string | null
    while ((updated = b.updateQuest()) !== null) {
      events.push({
        title: '📜 Quest Updated',
        body: renderMarkup(updated),
      })
    }

    let completed: string | null
    while ((completed = b.completeQuest()) !== null) {
      events.push({
        title: '🏆 Quest Complete!',
        body: renderMarkup(completed),
      })
    }

    if (events.length > 0) {
      modalQueue.value.push(...events)
      if (!showModal.value) {
        showNextModal()
      }
    }

    activeQuests.value = b.getActiveQuests()
    completedQuests.value = b.getCompletedQuests()
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
    actTransitioning,
    transitionText,
    // Actions
    setBridge,
    initGame,
    submitCommand,
    advanceTurn,
    refreshPanels,
    saveGame,
    loadGame,
    pollQuestEvents,
    dismissModal,
    toggleSection,
  }
})

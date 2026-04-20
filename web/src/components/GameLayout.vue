<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'
import { useMusic } from '@/composables/useMusic'
import { useAudio } from '@/composables/useAudio'
import { useEntityMenu } from '@/composables/useEntityMenu'
import type { EntityType, EntityMenuAction } from '@/composables/useEntityMenu'
import { renderMarkup } from '@/utils/theme'
import TopBar from './TopBar.vue'
import GameOutput from './GameOutput.vue'
import CommandInput from './CommandInput.vue'
import SidePanel from './SidePanel.vue'
import ContextMenu from './ContextMenu.vue'
import ActionSheet from './ActionSheet.vue'
import MobileDrawer from './MobileDrawer.vue'
import QuestModal from './QuestModal.vue'
import SaveDialog from './SaveDialog.vue'
import LoadDialog from './LoadDialog.vue'
import type { SaveSlot } from '@/types/bridge'

const store = useGameStore()
const {
  roomName,
  roomDescription,
  characters,
  items,
  exits,
  lastOutput,
  introText,
  acceptInput,
  activeQuests,
  completedQuests,
  inventory,
  spells,
  showActiveQuests,
  showCompletedQuests,
  showInventory,
  showSpells,
  showModal,
  modalTitle,
  modalBody,
  musicFile,
  musicInfo: musicInfoText,
} = storeToRefs(store)

// --- Music ---
const audio = new Audio()
audio.loop = true
const music = useMusic(audio)

watch(
  [musicFile, musicInfoText],
  ([file, info]) => {
    music.loadTrack(file, info)
  },
  { immediate: true },
)

// --- Sound effects ---
const sfx = useAudio()
store.setAudioPlayer(sfx)

// --- Entity Menu ---
const entityMenu = useEntityMenu((cmd: string) => {
  store.submitCommand(cmd)
})

// --- Mobile detection ---
function updateMobile() {
  entityMenu.isMobile.value = window.innerWidth <= 768
}

// One-shot handler: start music on the very first user gesture (keydown or click).
// Browsers block autoplay until a user gesture occurs; this ensures music starts
// as soon as the user interacts with anything, even while the intro popup is still visible.
function unlockAudio() {
  music.ensureMusicStarted()
  window.removeEventListener('keydown', unlockAudio)
  window.removeEventListener('click', unlockAudio)
}

onMounted(() => {
  updateMobile()
  window.addEventListener('resize', updateMobile)
  window.addEventListener('keydown', unlockAudio)
  window.addEventListener('click', unlockAudio)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateMobile)
  window.removeEventListener('keydown', unlockAudio)
  window.removeEventListener('click', unlockAudio)
})

// --- UI State ---
const showDrawer = ref(false)
const showSaveDialog = ref(false)
const showLoadDialog = ref(false)
const saveDialogSlots = ref<SaveSlot[]>([])
const loadDialogSlots = ref<SaveSlot[]>([])

function onOpenSaveDialog() {
  saveDialogSlots.value = store.getSaveSlots()
  showSaveDialog.value = true
}

function onSaveDialogConfirm(slot: number) {
  showSaveDialog.value = false
  store.saveToSlot(slot)
}

function onOpenLoadDialog() {
  loadDialogSlots.value = store.getSaveSlots()
  showLoadDialog.value = true
}

function onLoadDialogConfirm(slot: number) {
  showLoadDialog.value = false
  store.loadFromSlot(slot)
}

function onEntityClick(event: MouseEvent, name: string, type: string) {
  entityMenu.openMenu(type as EntityType, name, event)
}

function onInventoryClick(event: MouseEvent, name: string) {
  entityMenu.openMenu('inventory', name, event)
}

function onSpellClick(event: MouseEvent, name: string) {
  entityMenu.openMenu('spell', name, event)
}

function onGoDirection(direction: string) {
  store.submitCommand(`go ${direction}`)
}

function onSubmitCommand(cmd: string) {
  store.submitCommand(cmd)
  music.ensureMusicStarted()
  if (cmd.trim().toLowerCase() === 'help') {
    const attribution = music.buildAttributionHtml()
    if (attribution) {
      store.lastOutput += attribution
    }
  }
}

function onDismissModal() {
  music.ensureMusicStarted()
  store.dismissModal()
}

function onAdvanceTurn() {
  store.advanceTurn()
}

function onExecuteAction(action: EntityMenuAction) {
  const result = entityMenu.selectAction(action, inventory.value, spells.value)
  if (result === 'no-items') {
    store.lastOutput = renderMarkup(
      '[failure]You have no items to give.[/failure]',
    )
  } else if (result === 'no-spells') {
    store.lastOutput = renderMarkup('[failure]You know no spells.[/failure]')
  }
}

function onHelp() {
  store.submitCommand('help')
  const attribution = music.buildAttributionHtml()
  if (attribution) {
    store.lastOutput += attribution
  }
}

function closeMenus() {
  entityMenu.closeMenu()
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <TopBar
      title="RetroQuest"
      :music-muted="music.musicMuted.value"
      :sound-muted="sfx.soundMuted.value"
      @quick-save="store.saveGame()"
      @quick-load="store.loadGame()"
      @save="onOpenSaveDialog"
      @load="onOpenLoadDialog"
      @toggle-mute="music.toggleMute()"
      @toggle-sound-mute="sfx.toggleMute()"
      @help="onHelp"
      @toggle-drawer="showDrawer = !showDrawer"
    />

    <div class="flex h-[calc(100vh-48px)] overflow-hidden">
      <GameOutput
        :room-name="roomName"
        :room-description="roomDescription"
        :characters="characters"
        :items="items"
        :exits="exits"
        :last-output="lastOutput"
        :intro-text="introText"
        @entity-click="onEntityClick"
        @go-direction="onGoDirection"
      />

      <SidePanel
        :active-quests="activeQuests"
        :completed-quests="completedQuests"
        :inventory="inventory"
        :spells="spells"
        :show-active-quests="showActiveQuests"
        :show-completed-quests="showCompletedQuests"
        :show-inventory="showInventory"
        :show-spells="showSpells"
        @toggle-section="store.toggleSection"
        @inventory-click="onInventoryClick"
        @spell-click="onSpellClick"
      />
    </div>

    <CommandInput
      :accept-input="acceptInput"
      :tab-complete="store.tabComplete"
      @submit-command="onSubmitCommand"
      @advance-turn="onAdvanceTurn"
    />

    <ContextMenu
      :visible="!entityMenu.isMobile.value && entityMenu.visible.value"
      :target="entityMenu.target.value"
      :actions="entityMenu.actions.value"
      :x="entityMenu.x.value"
      :y="entityMenu.y.value"
      @close="closeMenus"
      @execute-action="onExecuteAction"
    />

    <ActionSheet
      :visible="entityMenu.isMobile.value && entityMenu.visible.value"
      :target="entityMenu.target.value"
      :actions="entityMenu.actions.value"
      @close="closeMenus"
      @execute-action="onExecuteAction"
    />

    <MobileDrawer
      :visible="showDrawer"
      :active-quests="activeQuests"
      :inventory="inventory"
      :spells="spells"
      @close="showDrawer = false"
      @inventory-click="onInventoryClick"
      @spell-click="onSpellClick"
      @quick-save="store.saveGame()"
      @quick-load="store.loadGame()"
      @save="onOpenSaveDialog"
      @load="onOpenLoadDialog"
      @help="onHelp"
    />

    <QuestModal
      :visible="showModal"
      :title="modalTitle"
      :body="modalBody"
      @dismiss="onDismissModal()"
    />

    <SaveDialog
      :visible="showSaveDialog"
      :slots="saveDialogSlots"
      @confirm="onSaveDialogConfirm"
      @cancel="showSaveDialog = false"
    />

    <LoadDialog
      :visible="showLoadDialog"
      :slots="loadDialogSlots"
      @confirm="onLoadDialogConfirm"
      @cancel="showLoadDialog = false"
    />
  </div>
</template>

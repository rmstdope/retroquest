<script setup lang="ts">
import { ref } from 'vue'
import type { NamedItem } from '@/types/bridge'
import type { MenuAction } from './ContextMenu.vue'
import TopBar from './TopBar.vue'
import GameOutput from './GameOutput.vue'
import CommandInput from './CommandInput.vue'
import SidePanel from './SidePanel.vue'
import ContextMenu from './ContextMenu.vue'
import ActionSheet from './ActionSheet.vue'
import MobileDrawer from './MobileDrawer.vue'
import QuestModal from './QuestModal.vue'

// Placeholder state — will be replaced by Pinia stores in #50
const musicMuted = ref(false)
const acceptInput = ref(true)
const showDrawer = ref(false)
const showContextMenu = ref(false)
const showActionSheet = ref(false)
const showModal = ref(false)

const roomName = ref('Village Square')
const roomDescription = ref('A peaceful village center with a well.')
const characters = ref<string[]>(['Mira', 'Merchant'])
const items = ref<string[]>(['Old Map'])
const exits = ref<Record<string, string>>({
  north: 'Forest Path',
  south: 'Village Gate',
})
const lastOutput = ref('')
const introText = ref('Welcome to RetroQuest!')

const activeQuests = ref<NamedItem[]>([])
const completedQuests = ref<NamedItem[]>([])
const inventory = ref<NamedItem[]>([])
const spells = ref<NamedItem[]>([])

const showActiveQuests = ref(true)
const showCompletedQuests = ref(false)
const showInventory = ref(true)
const showSpells = ref(true)

const contextMenuTarget = ref('')
const contextMenuActions = ref<MenuAction[]>([])
const contextMenuX = ref(0)
const contextMenuY = ref(0)

const actionSheetTarget = ref('')
const actionSheetActions = ref<MenuAction[]>([])

const modalTitle = ref('')
const modalBody = ref('')

function toggleSection(section: string) {
  const map: Record<string, typeof showActiveQuests> = {
    activeQuests: showActiveQuests,
    completedQuests: showCompletedQuests,
    inventory: showInventory,
    spells: showSpells,
  }
  const toggle = map[section]
  if (toggle) toggle.value = !toggle.value
}

function closeMenus() {
  showContextMenu.value = false
  showActionSheet.value = false
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh">
    <TopBar
      title="RetroQuest"
      :music-muted="musicMuted"
      @save="() => {}"
      @load="() => {}"
      @toggle-mute="musicMuted = !musicMuted"
      @help="() => {}"
      @toggle-drawer="showDrawer = !showDrawer"
    />

    <div class="app-layout">
      <GameOutput
        :room-name="roomName"
        :room-description="roomDescription"
        :characters="characters"
        :items="items"
        :exits="exits"
        :last-output="lastOutput"
        :intro-text="introText"
        @entity-click="() => {}"
        @go-direction="() => {}"
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
        @toggle-section="toggleSection"
        @inventory-click="() => {}"
        @spell-click="() => {}"
      />
    </div>

    <CommandInput
      :accept-input="acceptInput"
      @submit-command="() => {}"
      @advance-turn="() => {}"
    />

    <ContextMenu
      :visible="showContextMenu"
      :target="contextMenuTarget"
      :actions="contextMenuActions"
      :x="contextMenuX"
      :y="contextMenuY"
      @close="closeMenus"
      @execute-action="() => {}"
    />

    <ActionSheet
      :visible="showActionSheet"
      :target="actionSheetTarget"
      :actions="actionSheetActions"
      @close="closeMenus"
      @execute-action="() => {}"
    />

    <MobileDrawer
      :visible="showDrawer"
      :active-quests="activeQuests"
      :inventory="inventory"
      :spells="spells"
      @close="showDrawer = false"
      @inventory-click="() => {}"
      @spell-click="() => {}"
    />

    <QuestModal
      :visible="showModal"
      :title="modalTitle"
      :body="modalBody"
      @dismiss="showModal = false"
    />
  </div>
</template>

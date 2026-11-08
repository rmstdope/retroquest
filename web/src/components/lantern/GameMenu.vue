<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useFullscreen } from '@/composables/useFullscreen'
import { LANTERN_TEXT_SIZES } from '@/lantern/tokens'
import LanternDialog from './LanternDialog.vue'

/**
 * The game menu (the ☰ sheet on phones): Quick save and Quick load, then
 * Save game, Load game, Stats, Settings and Help. Quick load is dimmed,
 * and says why, when the quick save is from an older version.
 * `sideways` (a phone on its side, which has no header): one scrolling list
 * of plain rows, opened by the act and its quest count, with the text size,
 * the theme and (where the phone allows it) Full screen after Help.
 */
export type InfoKind = 'stats' | 'help'
export type MenuKind = 'save' | 'load' | 'settings' | InfoKind

defineProps<{ sideways?: boolean }>()
const emit = defineEmits<{ close: []; open: [kind: MenuKind] }>()
const game = useGameStore()
const settings = useSettingsStore()
const fullscreen = useFullscreen()
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
/** The act and its quest count: "Act I" and "Quests 0/11". */
const act = computed(() => {
  const progress = game.questProgress
  if (!progress) return null
  return {
    act: `Act ${ROMAN[progress.actNumber - 1] ?? progress.actNumber}`,
    quests: `Quests ${progress.completed}/${progress.total}`,
  }
})
/** Whether the screen is light now, the player's choice or else the device's. */
const light = computed(() =>
  settings.theme === 'device'
    ? typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-color-scheme: light)').matches
    : settings.theme === 'light',
)
/** Switch to the other theme. */
function toggleTheme(): void {
  settings.theme = light.value ? 'dark' : 'light'
}
const quickSaveOld = game.getQuickSave()?.outdated === true

function quickSave(): void {
  game.saveGame()
  emit('close')
}

function quickLoad(): void {
  game.loadGame()
  emit('close')
}

const ROWS: Array<{
  kind: MenuKind
  label: string
  sideLabel: string
  note: string
}> = [
  {
    kind: 'save',
    label: 'Save game',
    sideLabel: 'Save',
    note: '8 slots · pick one',
  },
  {
    kind: 'load',
    label: 'Load game',
    sideLabel: 'Load',
    note: 'The quick save or a slot',
  },
  {
    kind: 'stats',
    label: 'Stats',
    sideLabel: 'Stats',
    note: 'Where you are, your bag, places and quests',
  },
  {
    kind: 'settings',
    label: 'Settings',
    sideLabel: 'Settings',
    note: 'Theme, text size, sound',
  },
  {
    kind: 'help',
    label: 'Help',
    sideLabel: 'Help',
    note: 'Commands you can type',
  },
]
</script>

<template>
  <LanternDialog title="Game" eyebrow="RetroQuest" @close="emit('close')">
    <div v-if="sideways" class="lq-side-list">
      <p v-if="act" class="lq-side-act">
        <span>{{ act.act }}</span
        ><span>{{ act.quests }}</span>
      </p>
      <button type="button" class="lq-side-row" @click="quickSave">
        <span class="lq-side-label">Quick save</span>
      </button>
      <button
        type="button"
        class="lq-side-row"
        :disabled="quickSaveOld"
        @click="quickLoad"
      >
        <span class="lq-side-label">Quick load</span>
      </button>
      <button
        v-for="row in ROWS"
        :key="row.kind"
        type="button"
        class="lq-side-row"
        @click="emit('open', row.kind)"
      >
        <span class="lq-side-label">{{ row.sideLabel }}</span>
      </button>
      <div
        class="lq-side-row lq-side-sizes"
        role="group"
        aria-label="Text size"
      >
        <span class="lq-side-label">Text size</span>
        <button
          v-for="size in LANTERN_TEXT_SIZES"
          :key="size.value"
          type="button"
          class="lq-size"
          :class="{ 'lq-size-on': settings.textSize === size.value }"
          :aria-label="size.label"
          :aria-pressed="settings.textSize === size.value ? 'true' : 'false'"
          :style="{ fontSize: `${size.px}px` }"
          @click="settings.textSize = size.value"
        >
          A
        </button>
      </div>
      <button
        type="button"
        class="lq-side-row"
        data-row="theme"
        @click="toggleTheme"
      >
        <span class="lq-side-label">Theme</span>
        <span class="lq-note">{{ light ? 'Light' : 'Dark' }}</span>
      </button>
      <button
        v-if="fullscreen.supported"
        type="button"
        class="lq-side-row"
        @click="fullscreen.toggle"
      >
        <span class="lq-side-label">Full screen</span>
        <span class="lq-note">{{
          fullscreen.active.value ? 'On' : 'Off'
        }}</span>
      </button>
    </div>
    <div v-else class="lq-quick">
      <button type="button" class="lq-quick-btn" @click="quickSave">
        <span class="lq-quick-label">Quick save</span>
        <span class="lq-note">Replaces the quick save</span>
      </button>
      <button
        type="button"
        class="lq-quick-btn"
        :disabled="quickSaveOld"
        @click="quickLoad"
      >
        <span class="lq-quick-label">Quick load</span>
        <span class="lq-note">{{
          quickSaveOld
            ? 'The quick save is from an older version'
            : 'Back to the quick save'
        }}</span>
      </button>
    </div>
    <div v-if="!sideways" class="lq-menu-rows">
      <button
        v-for="row in ROWS"
        :key="row.kind"
        type="button"
        class="lq-menu-row"
        @click="emit('open', row.kind)"
      >
        <span class="lq-menu-label">{{ row.label }}</span>
        <span class="lq-note">{{ row.note }}</span>
      </button>
    </div>
  </LanternDialog>
</template>

<style scoped>
.lq-quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lq-quick-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lq-quick-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.lq-quick-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--lq-accent-text);
}
.lq-note {
  display: block;
  font-size: 12px;
  line-height: 1.35;
  color: var(--lq-muted);
}
.lq-menu-rows {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--lq-line);
}
.lq-menu-row {
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  border: none;
  border-bottom: 1px solid var(--lq-line);
  background: none;
  color: var(--lq-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lq-menu-label {
  font-size: 15px;
}
.lq-side-list {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 120px);
  overflow-y: auto;
}
.lq-side-act {
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: 8px 4px;
  font-size: 14px;
  color: var(--lq-muted);
  border-bottom: 1px solid var(--lq-line);
}
.lq-side-row {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px;
  border: none;
  border-bottom: 1px solid var(--lq-line);
  background: none;
  color: var(--lq-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lq-side-row:disabled {
  opacity: 0.5;
  cursor: default;
}
.lq-side-label {
  font-size: 15px;
}
.lq-side-sizes {
  cursor: default;
}
.lq-size {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
  cursor: pointer;
}
.lq-size-on {
  border-color: var(--lq-accent);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
</style>

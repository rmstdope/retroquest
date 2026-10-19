<script setup lang="ts">
import { useGameStore } from '@/stores/useGameStore'
import LanternDialog from './LanternDialog.vue'

/**
 * The game menu (the ☰ sheet on phones): Quick save and Quick load, then
 * Save game, Load game, Stats, Settings and Help.
 */
export type InfoKind = 'stats' | 'help'
export type MenuKind = 'save' | 'load' | 'settings' | InfoKind

const emit = defineEmits<{ close: []; open: [kind: MenuKind] }>()
const game = useGameStore()

function quickSave(): void {
  game.saveGame()
  emit('close')
}

function quickLoad(): void {
  game.loadGame()
  emit('close')
}

const ROWS: Array<{ kind: MenuKind; label: string; note: string }> = [
  { kind: 'save', label: 'Save game', note: '8 slots · pick one' },
  { kind: 'load', label: 'Load game', note: 'The quick save or a slot' },
  {
    kind: 'stats',
    label: 'Stats',
    note: 'Where you are, your bag, places and quests',
  },
  { kind: 'settings', label: 'Settings', note: 'Theme, text size, sound' },
  { kind: 'help', label: 'Help', note: 'Commands you can type' },
]
</script>

<template>
  <LanternDialog title="Game" eyebrow="RetroQuest" @close="emit('close')">
    <div class="lq-quick">
      <button type="button" class="lq-quick-btn" @click="quickSave">
        <span class="lq-quick-label">Quick save</span>
        <span class="lq-note">Replaces the quick save</span>
      </button>
      <button type="button" class="lq-quick-btn" @click="quickLoad">
        <span class="lq-quick-label">Quick load</span>
        <span class="lq-note">Back to the quick save</span>
      </button>
    </div>
    <div class="lq-menu-rows">
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
</style>

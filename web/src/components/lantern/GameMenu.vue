<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useMenuRing } from '@/composables/useMenuRing'
import LanternDialog from './LanternDialog.vue'

/**
 * The pause menu, a panel in the middle of the screen over the dimmed game
 * (the same on a phone): a small "Paused", the heading "Menu", Quick save and
 * Quick load side by side, then Save, Load, Settings and Help, then Quit.
 * Quick load is dimmed, and says why, when the quick save is from an older
 * version. Focus starts on Save, or on `focus` when a window opened from the
 * menu closes and hands it back; Tab and the up and down arrows move between
 * the entries (the arrows go round, passing over a dimmed one), and a moving
 * pointer takes the ring; only the ringed entry is filled, so a resting pointer
 * never leaves a second entry looking picked. Escape, ✕ and
 * a click on the dimmed game emit `close`; Quit emits `quit`.
 */
export type InfoKind = 'help'
export type MenuKind = 'save' | 'load' | 'settings' | InfoKind
/** The entries that hand focus back to themselves: a window's kind, or `quit`. */
export type MenuEntry = MenuKind | 'quit'

const props = defineProps<{ focus?: MenuEntry | null }>()
const emit = defineEmits<{
  close: []
  open: [kind: MenuKind]
  quit: []
}>()
const game = useGameStore()
const quickSaveOld = game.getQuickSave()?.outdated === true
const list = ref<HTMLElement | null>(null)
const ring = useMenuRing('.lq-menu-entry')

function quickSave(): void {
  game.saveGame()
  emit('close')
}

function quickLoad(): void {
  game.loadGame()
  emit('close')
}

/** The entries that open a window, in order. */
const ROWS: Array<{ kind: MenuKind; label: string }> = [
  { kind: 'save', label: 'Save' },
  { kind: 'load', label: 'Load' },
  { kind: 'settings', label: 'Settings' },
  { kind: 'help', label: 'Help' },
]

/** Whether the entry `kind` is the one focus starts on. */
function starts(kind: MenuEntry): boolean {
  return (props.focus ?? 'save') === kind
}

/** Up and down move between the enabled entries, round the ends. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  const entries = Array.from(
    list.value?.querySelectorAll<HTMLButtonElement>('.lq-menu-entry') ?? [],
  ).filter((entry) => !entry.disabled)
  if (!entries.length) return
  event.preventDefault()
  const at = entries.indexOf(document.activeElement as HTMLButtonElement)
  const step = event.key === 'ArrowDown' ? 1 : -1
  entries[(at + step + entries.length) % entries.length].focus()
}
</script>

<template>
  <LanternDialog
    title="Menu"
    eyebrow="Paused"
    centered
    @close="emit('close')"
    @mousemove="ring.onMove"
  >
    <div ref="list" class="lq-menu" @keydown="onKeydown">
      <div class="lq-quick">
        <button type="button" class="lq-menu-entry" @click="quickSave">
          Quick save
        </button>
        <button
          type="button"
          class="lq-menu-entry"
          :disabled="quickSaveOld"
          @click="quickLoad"
        >
          Quick load
        </button>
      </div>
      <p v-if="quickSaveOld" class="lq-note">
        The quick save is from an older version
      </p>
      <hr class="lq-divider" />
      <button
        v-for="row in ROWS"
        :key="row.kind"
        type="button"
        class="lq-menu-entry lq-menu-row"
        :data-autofocus="starts(row.kind) || undefined"
        @click="emit('open', row.kind)"
      >
        {{ row.label }}
      </button>
      <hr class="lq-divider" />
      <button
        type="button"
        class="lq-menu-entry lq-menu-row lq-menu-quit"
        :data-autofocus="starts('quit') || undefined"
        @click="emit('quit')"
      >
        Quit
      </button>
    </div>
  </LanternDialog>
</template>

<style scoped>
.lq-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lq-quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lq-menu-entry {
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: none;
  color: var(--lq-fg);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
.lq-quick .lq-menu-entry {
  border-color: var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  font-weight: 600;
}
.lq-menu-row {
  text-align: left;
}
.lq-menu-entry:focus {
  background: var(--lq-accent-soft);
}
.lq-menu-entry:disabled {
  opacity: 0.5;
  cursor: default;
}
.lq-menu-quit {
  color: var(--lq-failure);
}
.lq-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--lq-muted);
}
.lq-divider {
  width: 100%;
  margin: 6px 0;
  border: none;
  border-top: 1px solid var(--lq-line);
}
</style>

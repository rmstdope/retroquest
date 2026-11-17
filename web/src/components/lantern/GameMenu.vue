<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useMenuRing } from '@/composables/useMenuRing'
import LanternDialog from './LanternDialog.vue'

/**
 * The pause menu, a pane of frosted glass in the middle of the screen over the
 * dimmed game (the same on a phone), in the title page's design: a small
 * "Paused", the heading "Menu", Quick save and Quick load side by side as
 * amber tiles, then Save, Load, Settings and Help as glass rows that each end
 * in an arrow (they open a window), then Quit. Every entry has a quiet icon,
 * hidden from screen readers, so each is named by its word alone.
 * Quick load is dimmed, and says why, when the quick save is from an older
 * version. Focus starts on Save, or on `focus` when a window opened from the
 * menu closes and hands it back; Tab and the up and down arrows move between
 * the entries (the arrows go round, passing over a dimmed one), and a moving
 * pointer takes the ring; only the ringed entry is lit, so a resting pointer
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

/** The icons' outlines (24×24, drawn with a 2px line). */
const ICONS: Record<MenuEntry | 'quickSave' | 'quickLoad', string> = {
  quickSave: 'M12 4v11M8 11l4 4 4-4M5 20h14',
  quickLoad: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  load: 'M3 8V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01',
  quit: 'M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M19 12H9',
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
    glass
    @close="emit('close')"
    @mousemove="ring.onMove"
  >
    <div ref="list" class="lq-menu" @keydown="onKeydown">
      <div class="lq-quick">
        <button
          type="button"
          class="lq-menu-entry lq-menu-tile"
          data-ring
          @click="quickSave"
        >
          <svg class="lq-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="ICONS.quickSave" />
          </svg>
          Quick save
        </button>
        <button
          type="button"
          class="lq-menu-entry lq-menu-tile"
          data-ring
          :disabled="quickSaveOld"
          @click="quickLoad"
        >
          <svg class="lq-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="ICONS.quickLoad" />
          </svg>
          Quick load
        </button>
      </div>
      <p v-if="quickSaveOld" class="lq-note">
        The quick save is from an older version
      </p>
      <div class="lq-menu-rows">
        <button
          v-for="row in ROWS"
          :key="row.kind"
          type="button"
          class="lq-menu-entry lq-menu-row"
          data-ring
          :data-autofocus="starts(row.kind) || undefined"
          @click="emit('open', row.kind)"
        >
          <svg class="lq-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="ICONS[row.kind]" />
          </svg>
          <span class="lq-menu-label">{{ row.label }}</span>
          <svg class="lq-menu-arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        class="lq-menu-entry lq-menu-row lq-menu-quit"
        data-ring
        :data-autofocus="starts('quit') || undefined"
        @click="emit('quit')"
      >
        <svg class="lq-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="ICONS.quit" />
        </svg>
        <span class="lq-menu-label">Quit</span>
      </button>
    </div>
  </LanternDialog>
</template>

<style scoped>
.lq-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lq-quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.lq-menu-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lq-menu-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--lq-fg) 5%, transparent);
  color: var(--lq-fg);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s;
}
.lq-menu-icon,
.lq-menu-arrow {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lq-menu-icon {
  color: var(--lq-accent-text);
}
.lq-menu-label {
  flex: 1;
  text-align: left;
}
.lq-menu-arrow {
  width: 16px;
  height: 16px;
  color: var(--lq-muted);
}
/* Quick save and Quick load: the amber tiles at the top. */
.lq-menu-tile {
  justify-content: center;
  gap: 8px;
  min-height: 56px;
  border-color: var(--lq-accent-line);
  background: color-mix(in srgb, var(--lq-accent-soft) 70%, transparent);
  color: var(--lq-accent-text);
  font-weight: 600;
}
/* Only the ringed entry is lit; a pointer lights one by taking the ring. */
.lq-menu-entry:focus {
  border-color: color-mix(in srgb, var(--lq-accent) 60%, transparent);
  background: color-mix(in srgb, var(--lq-fg) 12%, transparent);
}
.lq-menu-tile:focus {
  background: var(--lq-accent-soft);
}
.lq-menu-entry:disabled {
  opacity: 0.5;
  cursor: default;
}
/* Quit stands apart: no glass, the failure colour. */
.lq-menu-quit {
  margin-top: 2px;
  background: none;
  color: var(--lq-failure);
}
.lq-menu-quit .lq-menu-icon {
  color: inherit;
}
.lq-note {
  margin: -4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--lq-muted);
}
</style>

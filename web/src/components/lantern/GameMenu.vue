<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useMenuRing } from '@/composables/useMenuRing'
import LanternDialog from './LanternDialog.vue'
import type { KeyHint } from './KeyLine.vue'

/**
 * The pause menu, a pane of frosted glass in the middle of the screen over the
 * dimmed game (the same on a phone), in the title page's design: a small
 * "Paused", the heading "Menu", then the journey first, as three tiles:
 * Journal, Quests (with the open quests counted, and the amber dot while
 * something is new) and Map, each with its key in the corner (J, Q, M, which
 * open them from the game too). Then Quick save and Quick load side by side as
 * amber tiles, then Save, Load, Settings and Help as glass rows that each end
 * in an arrow (they open a window), then Quit. Every entry has a quiet icon,
 * hidden from screen readers, so each is named by its word alone (a tile's
 * count is its description).
 * Quick load is dimmed, and says why, when the quick save is from an older
 * version. Focus starts on Save, or on `focus` when a window opened from the
 * menu closes and hands it back; Tab and the up and down arrows move between
 * the entries (the arrows go round, passing over a dimmed one), and a moving
 * pointer takes the ring; only the ringed entry is lit, so a resting pointer
 * never leaves a second entry looking picked. Escape, ✕ and
 * a click on the dimmed game emit `close`; Quit emits `quit`. The quiet key
 * line at its foot names the keys, as in the windows it opens.
 * The ring moving to another entry sounds the soft tick and an entry chosen
 * the brass latch (both silent when the player has turned Menu clicks off); the
 * menu opening, and Escape, ✕ or the dimmed game closing it, are silent.
 */
export type InfoKind = 'help'
/** The journey the menu opens first: the journal (the story so far), the quests and the map. */
export type JourneyKind = 'journal' | 'quests' | 'map'
export type MenuKind = 'save' | 'load' | 'settings' | InfoKind | JourneyKind
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
const KEYS: KeyHint[] = [
  { keys: ['↑', '↓'], word: 'move' },
  { keys: ['Enter'], word: 'choose' },
  { keys: ['Esc'], word: 'back' },
]

function quickSave(): void {
  ring.choose()
  game.saveGame()
  emit('close')
}

function quickLoad(): void {
  ring.choose()
  game.loadGame()
  emit('close')
}

/** The icons' outlines (24×24, drawn with a 2px line); the journey's are with its tiles. */
const ICONS: Record<
  Exclude<MenuEntry, JourneyKind> | 'quickSave' | 'quickLoad',
  string
> = {
  quickSave: 'M12 4v11M8 11l4 4 4-4M5 20h14',
  quickLoad: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  load: 'M3 8V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01',
  quit: 'M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M19 12H9',
}

/** The journey's tiles, in order: what each opens, its word, its key and its icon's outline. */
const JOURNEY: Array<{
  kind: JourneyKind
  label: string
  key: string
  icon: string
}> = [
  {
    kind: 'journal',
    label: 'Journal',
    key: 'J',
    icon: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5M9 11h5',
  },
  {
    kind: 'quests',
    label: 'Quests',
    key: 'Q',
    icon: 'M6 21V4M6 4h11l-2.5 4L17 12H6',
  },
  {
    kind: 'map',
    label: 'Map',
    key: 'M',
    icon: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  },
]

/** The hidden text the Quests tile is described by. */
const questsNoteId = useId()
/** What the Quests tile says beside its name: how many are open, and whether something is new. */
const questsNote = computed(() =>
  [`${game.activeQuests.length} open`, game.questsHaveNew ? 'news' : '']
    .filter(Boolean)
    .join(', '),
)

/** The entries that open a window, in order. */
const ROWS: Array<{ kind: Exclude<MenuKind, JourneyKind>; label: string }> = [
  { kind: 'save', label: 'Save' },
  { kind: 'load', label: 'Load' },
  { kind: 'settings', label: 'Settings' },
  { kind: 'help', label: 'Help' },
]

/** An entry chosen: the latch, then the window it opens (or `quit`). */
function choose(event: 'quit' | MenuKind): void {
  ring.choose()
  if (event === 'quit') emit('quit')
  else emit('open', event)
}

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
    narrow
    :key-line="KEYS"
    @close="emit('close')"
    @focusin="ring.onFocusIn"
    @mousemove="ring.onMove"
  >
    <div ref="list" class="lq-menu" @keydown="onKeydown">
      <div class="lq-journey">
        <button
          v-for="tile in JOURNEY"
          :key="tile.kind"
          type="button"
          class="lq-menu-entry lq-menu-journey"
          data-ring
          :aria-label="tile.label"
          :aria-describedby="tile.kind === 'quests' ? questsNoteId : undefined"
          :aria-keyshortcuts="tile.key"
          :data-autofocus="starts(tile.kind) || undefined"
          @click="choose(tile.kind)"
        >
          <kbd class="lq-menu-key" aria-hidden="true">{{ tile.key }}</kbd>
          <span
            v-if="tile.kind === 'quests'"
            class="lq-menu-journey-tally"
            aria-hidden="true"
            ><span class="lq-menu-journey-count">{{
              game.activeQuests.length
            }}</span
            ><i v-if="game.questsHaveNew" class="lq-menu-journey-new"></i
          ></span>
          <svg
            class="lq-menu-icon lq-menu-journey-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path :d="tile.icon" />
          </svg>
          <span class="lq-menu-journey-name" aria-hidden="true">{{
            tile.label
          }}</span>
        </button>
        <span :id="questsNoteId" class="lq-sr-only">{{ questsNote }}</span>
      </div>
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
          @click="choose(row.kind)"
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
        @click="choose('quit')"
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
  gap: var(--lq-ring-gap);
}
/* The journey: three tiles across the top, the key in each one's corner. */
.lq-journey {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--lq-ring-gap);
}
.lq-journey .lq-menu-journey {
  position: relative;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 92px;
  font-weight: 600;
}
.lq-journey .lq-menu-journey-icon {
  width: 26px;
  height: 26px;
}
.lq-menu-key {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 22px;
  padding: 2px 6px;
  border: 1px solid color-mix(in srgb, var(--lq-fg) 25%, transparent);
  border-bottom-width: 2px;
  border-radius: 6px;
  color: var(--lq-muted);
  font: 600 12px var(--lq-font-mono);
  text-align: center;
}
.lq-menu-journey-tally {
  position: absolute;
  top: 8px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--lq-accent-text);
  font-size: 13px;
}
.lq-menu-journey-new {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lq-accent);
}
.lq-quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lq-ring-gap);
}
.lq-menu-rows {
  display: flex;
  flex-direction: column;
  gap: var(--lq-ring-gap);
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
/* A short screen: lower entries, so the wider gaps between them cost no height. */
@media (max-height: 640px) {
  .lq-menu-entry {
    min-height: 44px;
  }
  .lq-menu-tile {
    min-height: 48px;
  }
  .lq-journey .lq-menu-journey {
    min-height: 72px;
    gap: 4px;
  }
}
/* A narrow phone: the Quick tiles drop their icons so the words stay on one line. */
@media (max-width: 359px) {
  .lq-menu-tile .lq-menu-icon {
    display: none;
  }
}
/* Read by assistive technology only. */
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { usePanelFlash } from '@/composables/usePanelFlash'
import { useSendCommand } from '@/composables/useSendCommand'
import HintButton from './HintButton.vue'

/**
 * The room's name in the stage's top-left corner, written on the picture: no
 * card, light serif with a soft dark glow (dark ink on the paper backdrop,
 * `bare`). Who and what is here is not listed: the picture marks them. The
 * name stays for as long as the player is in the room; `away` fades it out
 * while something is told over the picture (the room's title, an arrival) and
 * it fades back in when that settles. The plate is never read aloud: the
 * room's name and description are read in the story.
 *
 * The name is a button ("<name> ▾"). Pressed, it is outlined, shows ▴ and fans
 * out three pills beneath it (in a row to its right when `compact`, a phone on
 * its side): "👁 Look", "🔍 Search" and "💤 Rest", which send those existing
 * commands. The pills fold on a pill press, on the name again, on Escape, on a
 * press anywhere outside the plate, and when the room changes, a game begins
 * or a pop-up opens. While the game is busy they are dimmed (`aria-disabled`,
 * still focusable); the name still opens. Opened by keyboard, focus goes to
 * Look; ↑ ↓ ← → move between the pills and Escape gives focus back to the name.
 *
 * On the tall-screen stage (`storyButton`) "⟲ Story so far" stands to the
 * right of the name, and stays while the name is away; with `hintButton` a
 * round 💡 Hint stands beside it (that stage has no top-right row of buttons).
 * The plate lets presses through to the picture beneath; only its buttons take
 * them (the name is not inert text: it is a button). Compact (a phone on its side) is smaller.
 */
const props = defineProps<{
  storyButton?: boolean
  hintButton?: boolean
  compact?: boolean
  away?: boolean
  bare?: boolean
}>()
const emit = defineEmits<{ story: [] }>()
const game = useGameStore()
const { busy, send } = useSendCommand()
const storyEl = ref<HTMLButtonElement | null>(null)
const nameEl = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const { flashing, endFlash } = usePanelFlash(['place'])

/** The pills, in order: the label and the existing command each sends. */
const PILLS: ReadonlyArray<{ label: string; command: string }> = [
  { label: '👁 Look', command: 'look' },
  { label: '🔍 Search', command: 'search' },
  { label: '💤 Rest', command: 'rest' },
]

/** Put focus on "⟲ Story so far" (the story so far has just been closed). */
function focusStoryButton(): void {
  storyEl.value?.focus()
}

/** Put focus on the room's name. */
function focusName(): void {
  nameEl.value?.focus()
}

/** Press the name: fan the pills out (focus on Look when a key pressed it), or fold them. */
async function toggle(event: MouseEvent): Promise<void> {
  open.value = !open.value
  if (!open.value || event.detail !== 0) return
  await nextTick()
  root.value?.querySelector<HTMLElement>('.lq-pill')?.focus()
}

/** Send a pill's command and fold, unless the game is busy. */
function press(command: string): void {
  if (busy.value) return
  open.value = false
  send(command)
}

/** ↑ ← and ↓ → move focus between the pills, round the ends. */
function movePill(event: KeyboardEvent, step: 1 | -1): void {
  event.preventDefault()
  const all = [...(root.value?.querySelectorAll<HTMLElement>('.lq-pill') ?? [])]
  const at = all.indexOf(event.target as HTMLElement)
  all[(at + step + all.length) % all.length]?.focus()
}

/** Escape folds the pills (taking the key) and returns focus to the name, but not under a dialog. */
function onDocumentKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) return
  if (document.querySelector('.lq-dialog-layer')) return
  event.stopPropagation()
  event.preventDefault()
  open.value = false
  focusName()
}

/** A press outside the plate folds the pills, and lets the press go on. */
function onOutsidePress(event: Event): void {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

watch(
  open,
  (isOpen) => {
    // Capture, so the layout's narration keys do not also hear this Escape.
    if (isOpen) {
      document.addEventListener('keydown', onDocumentKey, true)
      document.addEventListener('pointerdown', onOutsidePress, true)
    } else {
      document.removeEventListener('keydown', onDocumentKey, true)
      document.removeEventListener('pointerdown', onOutsidePress, true)
    }
  },
  { flush: 'sync' },
)
onUnmounted(() => {
  document.removeEventListener('keydown', onDocumentKey, true)
  document.removeEventListener('pointerdown', onOutsidePress, true)
})

/** Focus leaving the name and its pills (the menu, the typing box) puts the pills away. */
function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget
  if (next instanceof Node && !root.value?.contains(next)) open.value = false
}

// A new room, a new game, a load and a pop-up all put the pills away.
watch(
  () => [game.roomName, game.gameNumber, game.loadNumber, game.showModal],
  () => (open.value = false),
)

defineExpose({ focusStoryButton, focusName })
</script>

<template>
  <section
    ref="root"
    class="lq-plate"
    :class="{
      'lq-flash': flashing,
      'lq-plate-compact': props.compact,
      'lq-plate-away': props.away,
      'lq-plate-bare': props.bare,
      'lq-plate-open': open,
    }"
    aria-label="Current location"
    @animationend.self="endFlash"
  >
    <div
      class="lq-name-wrap"
      :inert="props.away || undefined"
      @focusout="onFocusOut"
    >
      <h2 class="lq-room-name">
        <button
          ref="nameEl"
          type="button"
          class="lq-name-btn"
          :aria-label="`${game.roomName} — Look, Search, Rest`"
          :aria-expanded="open ? 'true' : 'false'"
          @click="toggle"
        >
          <span class="lq-name-text">{{ game.roomName }}</span>
          <span class="lq-name-caret" aria-hidden="true">{{
            open ? ' ▴' : ' ▾'
          }}</span>
        </button>
      </h2>
      <div v-if="open" class="lq-pills" role="group" aria-label="Room actions">
        <button
          v-for="pill in PILLS"
          :key="pill.command"
          type="button"
          class="lq-pill"
          data-hurry="command"
          :aria-disabled="busy"
          :class="{ 'lq-busy': busy }"
          @click="press(pill.command)"
          @keydown.down="movePill($event, 1)"
          @keydown.right="movePill($event, 1)"
          @keydown.up="movePill($event, -1)"
          @keydown.left="movePill($event, -1)"
        >
          {{ pill.label }}
        </button>
      </div>
    </div>
    <button
      v-if="props.storyButton"
      ref="storyEl"
      type="button"
      class="lq-story-so-far"
      @click="emit('story')"
    >
      ⟲ Story so far
    </button>
    <HintButton
      v-if="props.hintButton"
      compact
      class="lq-story-so-far lq-plate-hint"
      data-button="hint"
    />
  </section>
</template>

<style scoped>
.lq-plate {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  /* The plate itself lets a press go through to the picture or the words beneath; only its buttons take one. */
  pointer-events: none;
}
.lq-name-wrap {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
}
.lq-name-btn {
  pointer-events: auto;
  display: flex;
  max-width: 100%;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-shadow: inherit;
  cursor: pointer;
}
.lq-name-text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The caret is always kept, after the ellipsis. */
.lq-name-caret {
  flex: 0 0 auto;
  white-space: pre;
}
.lq-plate-open .lq-name-btn {
  border-color: var(--lq-accent);
}
.lq-pills {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--lq-z-page-room-pills);
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  pointer-events: auto;
}
.lq-plate-compact .lq-pills {
  top: 0;
  left: 100%;
  flex-direction: row;
  margin: 0 0 0 10px;
}
.lq-pill {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--lq-accent-line);
  border-radius: 18px;
  background: var(--lq-raised);
  color: var(--lq-accent-text);
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}
.lq-pill.lq-busy {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-plate-hint {
  margin-left: 0;
}
.lq-name-btn:focus-visible {
  outline: 2px solid var(--lq-accent);
  outline-offset: 0;
}
.lq-room-name {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  white-space: nowrap;
  font-family: var(--lq-font-display);
  font-size: calc(20px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-picture-ink);
  text-shadow: var(--lq-picture-glow);
  /* Fades back in as the room's title settles. */
  transition: opacity calc(1.5s * var(--lq-motion)) ease;
}
/* Gone at once when something is told over the picture. */
.lq-plate-away .lq-room-name {
  opacity: 0;
  transition: none;
}
.lq-plate-bare .lq-room-name {
  color: var(--lq-fg);
  text-shadow: none;
}
.lq-plate-compact .lq-room-name {
  font-size: calc(16px * var(--lq-display-scale));
}
.lq-story-so-far {
  pointer-events: auto;
  flex: 0 0 auto;
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--lq-line);
  border-radius: 16px;
  background: var(--lq-raised);
  color: var(--lq-accent-text);
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
</style>

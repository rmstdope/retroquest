<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useMenuRing } from '@/composables/useMenuRing'
import LanternDialog from './LanternDialog.vue'
import type { KeyHint } from './KeyLine.vue'

/**
 * Asked when the player picks Quit in the menu or types `quit` or `exit`:
 * save first (quick save), quit without saving, or cancel. Quitting goes back
 * to the main menu (the title page; a browser tab cannot close itself). If
 * the save fails, the game is not quit and the dialog says so. Cancel, ✕,
 * Escape and a click outside end the question; the layout then shows the
 * menu again when the question came from it. It works from the keyboard: the
 * ring starts on Cancel, the arrows move it between the buttons (round the
 * ends), a pointer entering a button takes it, and Enter chooses.
 */
const emit = defineEmits<{ cancel: [] }>()
const game = useGameStore()
const saveFailed = ref(false)
const buttons = ref<HTMLElement | null>(null)
const ring = useMenuRing('.lq-quit-buttons > button')
const KEYS: KeyHint[] = [
  { keys: ['←', '→'], word: 'move' },
  { keys: ['Enter'], word: 'choose' },
  { keys: ['Esc'], word: 'back' },
]

/** The arrows move the ring between the buttons, round the ends. */
function onKeydown(event: KeyboardEvent): void {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
    event.key
  ]
  if (!step) return
  event.preventDefault()
  const all = [...(buttons.value?.querySelectorAll('button') ?? [])]
  const at = all.indexOf(document.activeElement as HTMLButtonElement)
  ring.ringTo(all[(at + step + all.length) % all.length])
}

/** A button chosen, with the latch. */
function choose(action: () => void): void {
  ring.choose()
  action()
}

/** Cancel, ✕, Escape or a click outside: the question ends (the layout brings the menu back). */
function cancel(): void {
  game.quitAsked = false
  emit('cancel')
}

function saveAndQuit(): void {
  if (game.saveGame()) game.restartGame()
  else saveFailed.value = true
}
</script>

<template>
  <LanternDialog
    title="Quit to the main menu?"
    eyebrow="Menu"
    centered
    :key-line="KEYS"
    @close="cancel"
    @focusin="ring.onFocusIn"
    @mousemove="ring.track"
  >
    <p class="lq-quit-text">
      Save before you go? Anything since your last save is lost otherwise.
    </p>
    <p v-if="saveFailed" class="lq-quit-error" role="alert">
      Your game could not be saved, so it was not quit. You can quit without
      saving, or go back to the game.
    </p>
    <template #footer>
      <div ref="buttons" class="lq-quit-buttons" @keydown="onKeydown">
        <button
          type="button"
          class="lq-quit-primary"
          @mousemove="ring.onHover"
          @click="choose(saveAndQuit)"
        >
          Save and quit
        </button>
        <button
          type="button"
          class="lq-quit-plain"
          @mousemove="ring.onHover"
          @click="choose(() => game.restartGame())"
        >
          Quit without saving
        </button>
        <button
          type="button"
          class="lq-quit-plain"
          data-autofocus
          @mousemove="ring.onHover"
          @click="choose(cancel)"
        >
          Cancel
        </button>
      </div>
    </template>
  </LanternDialog>
</template>

<style scoped>
.lq-quit-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-quit-error {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-size: 14px;
}
.lq-quit-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.lq-quit-primary,
.lq-quit-plain {
  flex: 1 1 140px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: var(--lq-radius);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
.lq-quit-buttons > button:focus {
  outline: 3px solid #f4ecd2;
  outline-offset: 3px;
}
.lq-quit-primary {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
.lq-quit-plain {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
</style>

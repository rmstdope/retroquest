<script lang="ts">
/** How long the note stays before it fades, in milliseconds. */
export const F1_NOTE_MS = 6000
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

/**
 * The quiet note at the start of a new game that tells keyboard players about
 * F1: "Press F1 to type commands", centred at the foot of the picture. It asks
 * to go (`done`, once) after `F1_NOTE_MS`, at the player's first press or key,
 * or when F1 is pressed. The layout decides whether it is shown at all (never
 * on a phone, never when a save was loaded).
 */
const emit = defineEmits<{ done: [] }>()
let timer: ReturnType<typeof setTimeout> | undefined
let finished = false

function finish(): void {
  if (finished) return
  finished = true
  clearTimeout(timer)
  emit('done')
}

onMounted(() => {
  timer = setTimeout(finish, F1_NOTE_MS)
  window.addEventListener('pointerdown', finish, true)
  window.addEventListener('keydown', finish, true)
})
onUnmounted(() => {
  clearTimeout(timer)
  window.removeEventListener('pointerdown', finish, true)
  window.removeEventListener('keydown', finish, true)
})
</script>

<template>
  <p class="lq-f1-note" role="note">Press <kbd>F1</kbd> to type commands</p>
</template>

<style scoped>
.lq-f1-note {
  margin: 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--lq-surface);
  border: 1px solid var(--lq-line);
  color: var(--lq-muted);
  font-family: var(--lq-font-ui);
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  animation: lq-f1-in calc(0.4s * var(--lq-motion)) ease;
}
kbd {
  padding: 1px 6px;
  border: 1px solid var(--lq-line2);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font: inherit;
  font-weight: 700;
}
@keyframes lq-f1-in {
  from {
    opacity: 0;
  }
}
</style>

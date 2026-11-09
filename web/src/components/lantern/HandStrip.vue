<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { handStrip, type Hand } from '@/lantern/belt'

/**
 * The strip at the top of the room saying what the next press will do with
 * the thing or spell in hand ("Use Bread with…", "Give Bread to…", "Cast
 * Light on…"), with ✕ Cancel. It is a status, so a screen reader hears it
 * when something is taken in hand. With `ghost` (a laptop with a mouse) a
 * small copy of the picture rides beside the pointer; it never takes a press
 * and not a touch brings it.
 */
const props = defineProps<{ hand: Hand; ghost?: boolean }>()
const emit = defineEmits<{ cancel: [] }>()

const text = computed(() => handStrip(props.hand))
const at = ref<{ x: number; y: number } | null>(null)

/** Follow a mouse pointer. */
function onMove(event: Event): void {
  const move = event as PointerEvent
  if (move.pointerType === 'touch') return
  at.value = { x: move.clientX, y: move.clientY }
}
onMounted(() => document.addEventListener('pointermove', onMove))
onBeforeUnmount(() => document.removeEventListener('pointermove', onMove))

/** The cancel button, for focus. */
const cancelButton = ref<HTMLButtonElement | null>(null)
defineExpose({ cancelButton })
</script>

<template>
  <div class="lq-hand" role="status">
    <span class="lq-hand-text">{{ text }}</span>
    <button
      ref="cancelButton"
      type="button"
      class="lq-hand-cancel"
      data-hand-cancel
      @click="emit('cancel')"
    >
      ✕ Cancel
    </button>
  </div>
  <span
    v-if="ghost && at"
    class="lq-hand-ghost"
    :class="`lq-hand-ghost-${hand.kind}`"
    :style="{ left: `${at.x + 12}px`, top: `${at.y + 12}px` }"
    aria-hidden="true"
    >{{ hand.label.charAt(0).toUpperCase() }}</span
  >
</template>

<style scoped>
.lq-hand {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100% - 16px);
  padding: 4px 4px 4px 16px;
  border-radius: 999px;
  border: 1px solid var(--lq-accent);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  font: 600 14px var(--lq-font-ui);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
}
.lq-hand-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lq-hand-cancel {
  flex: none;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font: inherit;
  cursor: pointer;
}
.lq-hand-cancel:focus-visible {
  outline: 3px solid var(--lq-accent);
  outline-offset: 2px;
}
.lq-hand-ghost {
  position: fixed;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid;
  font: 600 16px var(--lq-font-display);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
  pointer-events: none;
}
.lq-hand-ghost-item {
  background: var(--lq-item-soft);
  border-color: var(--lq-item-line);
  color: var(--lq-item);
}
.lq-hand-ghost-spell {
  background: var(--lq-spell-soft);
  border-color: var(--lq-spell-line);
  color: var(--lq-spell);
}
</style>

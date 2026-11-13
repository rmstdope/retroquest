<script setup lang="ts">
import { computed } from 'vue'
import {
  HOLD_RING_MS,
  HOLD_TO_SKIP_MS,
  type HoldRingSpot,
} from '@/composables/useHoldToSkip'

/**
 * The ring a held press fills (`useHoldToSkip`): drawn where the press is,
 * from the moment it shows (`HOLD_RING_MS`, already that far filled) until
 * the hold is full (`HOLD_TO_SKIP_MS`), when the telling is skipped. Under
 * Reduce motion it does not fill; a steady "Skipping…" says what the hold
 * does. It takes no presses.
 */
const props = defineProps<{
  /** Where the press is held, in window coordinates. */
  spot: HoldRingSpot
  /** Reduce motion is on: no filling. */
  still?: boolean
}>()

/** The ring's length (2πr for r = 19). */
const LENGTH = 119.4

const style = computed(() => ({
  left: `${props.spot.x}px`,
  top: `${props.spot.y}px`,
  '--lq-hold-from': `${LENGTH * (1 - HOLD_RING_MS / HOLD_TO_SKIP_MS)}`,
  '--lq-hold-ms': `${HOLD_TO_SKIP_MS - HOLD_RING_MS}ms`,
}))
</script>

<template>
  <div
    class="lq-hold-ring"
    :style="style"
    data-testid="hold-ring"
    aria-hidden="true"
  >
    <svg viewBox="0 0 46 46">
      <circle class="lq-hold-track" cx="23" cy="23" r="19" />
      <circle
        v-if="!props.still"
        class="lq-hold-fill"
        cx="23"
        cy="23"
        r="19"
        :stroke-dasharray="LENGTH"
      />
    </svg>
    <span v-if="props.still" class="lq-hold-label">Skipping…</span>
  </div>
</template>

<style scoped>
.lq-hold-ring {
  position: fixed;
  z-index: 50;
  width: 46px;
  height: 46px;
  margin: -23px 0 0 -23px;
  pointer-events: none;
}
/* A touch is drawn larger, so the finger does not hide it. */
@media (pointer: coarse) {
  .lq-hold-ring {
    width: 64px;
    height: 64px;
    margin: -32px 0 0 -32px;
  }
}
.lq-hold-ring svg {
  width: 100%;
  height: 100%;
}
.lq-hold-ring circle {
  fill: none;
  stroke-width: 4;
}
.lq-hold-track {
  stroke: rgb(10 10 10 / 0.55);
}
.lq-hold-fill {
  stroke: #f7a823;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  stroke-dashoffset: 0;
  animation: lq-hold-fill var(--lq-hold-ms) linear;
}
@keyframes lq-hold-fill {
  from {
    stroke-dashoffset: var(--lq-hold-from);
  }
}
.lq-hold-label {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgb(10 10 10 / 0.7);
  color: #ece6d6;
  font-family: var(--lq-font-ui);
  font-size: 11px;
  white-space: nowrap;
}
</style>

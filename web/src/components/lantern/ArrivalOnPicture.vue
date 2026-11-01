<script setup lang="ts">
import { ref } from 'vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useReadAlong } from '@/composables/useReadAlong'

/**
 * The arrival told on the middle of the room's picture, like a film title:
 * light serif text with a soft dark glow, no paper, at most 760 px wide. First
 * what happens as the player arrives (in italics), then the room's
 * description, the spoken word lit while the narrator tells it. Under it the
 * hint, and, while nobody speaks the part, a thin bar that empties over its
 * reading time. A click anywhere on the picture goes on (`useArrivalStore`).
 * With no picture (`pictured` false) the text is dark ink on the paper in the
 * light theme. The text is also in the story, which waits aside: the layer is
 * a polite live region for screen readers.
 */
defineProps<{ pictured: boolean }>()
const arrival = useArrivalStore()
const root = ref<HTMLElement | null>(null)
const { html } = useReadAlong(() => arrival.turnId ?? 0, root)
</script>

<template>
  <div
    ref="root"
    class="lq-arrival-stage"
    :class="{ 'lq-bare': !pictured, 'lq-on': arrival.active }"
    aria-live="polite"
    data-testid="arrival-on-picture"
    @click="arrival.next()"
  >
    <Transition name="lq-arrival-fade">
      <div v-if="arrival.part" :key="arrival.part.kind" class="lq-arrival-card">
        <!-- eslint-disable vue/no-v-html -->
        <template v-if="arrival.part.kind === 'events'">
          <p
            v-for="line in arrival.part.lines"
            :key="line.unit"
            class="lq-arrival-line lq-arrival-event"
            :data-unit="line.unit"
            v-html="html(line.markup, line.unit)"
          ></p>
        </template>
        <template v-else>
          <p
            v-for="line in arrival.part.lines"
            :key="line.unit"
            class="lq-arrival-line"
            :data-unit="line.unit"
            v-html="html(line.markup, line.unit, 1)"
          ></p>
        </template>
        <!-- eslint-enable vue/no-v-html -->
        <p class="lq-arrival-hint">Click or press Enter to continue</p>
        <div
          v-if="arrival.barMs"
          :key="arrival.barKey"
          class="lq-arrival-bar"
          data-testid="arrival-bar"
        >
          <i :style="{ animationDuration: `${arrival.barMs}ms` }"></i>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lq-arrival-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Above the middle of the picture, clear of the story's tab and the actions. */
  padding: 72px 24px 140px;
  pointer-events: none;
  --lq-arrival-ink: #fbf6ea;
  --lq-arrival-glow:
    0 0 18px rgb(0 0 0 / 0.85), 0 0 6px rgb(0 0 0 / 0.9), 0 1px 2px #000;
  --lq-arrival-track: rgb(255 255 255 / 0.25);
  --lq-arrival-fill: rgb(255 255 255 / 0.85);
}
.lq-arrival-stage.lq-on {
  pointer-events: auto;
  cursor: pointer;
}
/* No picture: ink on the paper in the light theme, the light text in the dark. */
.lq-arrival-stage.lq-bare {
  --lq-arrival-ink: var(--lq-arrival-bare-ink);
  --lq-arrival-glow: var(--lq-arrival-bare-glow);
  --lq-arrival-track: var(--lq-arrival-bare-track);
  --lq-arrival-fill: var(--lq-arrival-bare-fill);
}
.lq-arrival-card {
  width: min(760px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  color: var(--lq-arrival-ink);
  text-shadow: var(--lq-arrival-glow);
}
.lq-arrival-line {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: calc(24px * var(--lq-text-scale, 1));
  line-height: 1.5;
}
.lq-arrival-event {
  font-style: italic;
}
.lq-arrival-card :deep(.lq-w-now) {
  background: rgb(242 158 0 / 0.45);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgb(242 158 0 / 0.45);
}
.lq-arrival-hint {
  margin: 0;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  letter-spacing: 0.02em;
  opacity: 0.8;
}
.lq-arrival-bar {
  width: 160px;
  height: 3px;
  border-radius: 2px;
  background: var(--lq-arrival-track);
  overflow: hidden;
  box-shadow: none;
}
/* Empties over the reading time; Reduce motion keeps it (it is the clock). */
.lq-arrival-bar i {
  display: block;
  height: 100%;
  background: var(--lq-arrival-fill);
  transform-origin: left;
  animation-name: lq-arrival-empty;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes lq-arrival-empty {
  to {
    transform: scaleX(0);
  }
}
.lq-arrival-fade-enter-active,
.lq-arrival-fade-leave-active {
  transition: opacity calc(0.4s * var(--lq-motion));
}
.lq-arrival-fade-enter-from,
.lq-arrival-fade-leave-to {
  opacity: 0;
}
</style>

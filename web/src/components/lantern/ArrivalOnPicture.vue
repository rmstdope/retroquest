<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useReadAlong } from '@/composables/useReadAlong'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'

/**
 * The arrival told on the middle of the room's picture, like a film title:
 * light serif text with a soft dark glow, no paper, at most 760 px wide. First
 * what happens as the player arrives (in italics), then the room's
 * description, the spoken word lit while the narrator tells it. Under it a
 * small dark pill holds the hint and, while nobody speaks the part, a thin bar
 * that empties over its reading time. A click anywhere on the picture goes on
 * (`useArrivalStore`).
 * Names and other inline tags keep the dark theme's light colours on the
 * picture. With no picture (`pictured` false) the text is dark ink on the
 * paper in the light theme. The text is also in the story, which waits aside:
 * the layer is a polite live region for screen readers.
 *
 * A description too tall for the clear space scrolls inside its own box
 * (`.lq-arrival-text`) above the pill, which never leaves the bottom of the
 * space. The box fades out at an edge where the text continues, and, while the
 * narrator speaks, glides to keep the lit word in view (the `lq-follow` event
 * of the read-along); with reduced motion it jumps.
 */
defineProps<{ pictured: boolean; phone?: boolean }>()
const arrival = useArrivalStore()
const root = ref<HTMLElement | null>(null)
const { html } = useReadAlong(() => arrival.turnId ?? 0, root)

/** The text box of the part up; it is a new element for every part. */
const text = ref<HTMLElement | null>(null)
const fadeTop = ref(false)
const fadeBottom = ref(false)
/** The lit word is kept in the top two thirds of the box, and put a third down when it leaves. */
const BAND_END = 2 / 3
const PLACE_AT = 1 / 3
let observer: ResizeObserver | undefined

/** Whether the text continues above and below what shows. */
function measure(): void {
  const el = text.value
  fadeTop.value = !!el && el.scrollTop > 1
  fadeBottom.value =
    !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

/** Whether the game's "less motion" setting (or the system's) is on. */
function motionReduced(): boolean {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  )
}

/** Keep the lit word in view; the event is taken so nothing else scrolls for it. */
function follow(event: Event): void {
  const el = text.value
  const word = event.target
  if (!el || !(word instanceof Element)) return
  event.preventDefault()
  const box = el.getBoundingClientRect()
  const at = word.getBoundingClientRect()
  const top = at.top - box.top
  if (top >= 0 && at.bottom - box.top <= box.height * BAND_END) return
  el.scrollTo({
    top: el.scrollTop + top - el.clientHeight * PLACE_AT,
    behavior: motionReduced() ? 'instant' : 'smooth',
  })
}

watch(text, async (el) => {
  observer?.disconnect()
  await nextTick()
  measure()
  if (el && typeof ResizeObserver !== 'undefined') {
    observer ??= new ResizeObserver(() => requestAnimationFrame(measure))
    observer.observe(el)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="root"
    class="lq-arrival-stage"
    :class="{
      'lq-bare': !pictured,
      'lq-on': arrival.active,
      'lq-phone-arrival': phone,
    }"
    aria-live="polite"
    data-testid="arrival-on-picture"
    @click="arrival.next()"
  >
    <Transition name="lq-arrival-fade">
      <div v-if="arrival.part" :key="arrival.part.kind" class="lq-arrival-card">
        <!-- eslint-disable vue/no-v-html -->
        <div
          ref="text"
          class="lq-arrival-text"
          :class="{ 'lq-fade-t': fadeTop, 'lq-fade-b': fadeBottom }"
          @scroll="measure"
          v-on="{ [FOLLOW_EVENT]: follow }"
        >
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
        </div>
        <!-- eslint-enable vue/no-v-html -->
        <div class="lq-arrival-pill">
          <p class="lq-arrival-hint">
            {{ phone ? 'Tap to continue' : 'Click or press Enter to continue' }}
          </p>
          <div
            v-if="arrival.barMs"
            :key="arrival.barKey"
            class="lq-arrival-bar"
            data-testid="arrival-bar"
          >
            <i :style="{ animationDuration: `${arrival.barMs}ms` }"></i>
          </div>
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
}
/*
 * On a picture the glow is dark in both themes, so the inline tags (names,
 * exits, quests) keep the dark theme's light colours, as tokens.ts sets them.
 */
.lq-arrival-stage:not(.lq-bare) {
  --lq-fg: #ece6d6;
  --lq-muted: #a39d8e;
  --lq-accent-text: #ffb836;
  --lq-failure: #e8896b;
  --lq-success: #8fcf7a;
  --lq-character: #7fb0e6;
  --lq-item: #8fcf7a;
  --lq-spell: #c79bf0;
}
/* The phone: a narrower block of smaller type, above the paper's tab and the bar. */
.lq-phone-arrival {
  /* Clear of the plate across the top, and of the bar and the paper's tab. */
  padding: calc(var(--lq-plate-h, 108px) + 24px) 20px 110px;
}
.lq-phone-arrival .lq-arrival-card {
  width: min(320px, 100%);
}
.lq-phone-arrival .lq-arrival-line {
  font-size: calc(17px * var(--lq-text-scale, 1));
}
.lq-arrival-stage.lq-on {
  pointer-events: auto;
  cursor: pointer;
}
/* No picture: ink on the paper in the light theme, the light text in the dark. */
.lq-arrival-stage.lq-bare {
  --lq-arrival-ink: var(--lq-arrival-bare-ink);
  --lq-arrival-glow: var(--lq-arrival-bare-glow);
}
.lq-arrival-card {
  width: min(760px, 100%);
  /* No taller than the clear space; the text scrolls and the pill stays. */
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  color: var(--lq-arrival-ink);
  text-shadow: var(--lq-arrival-glow);
}
/*
 * The text scrolls here when it is too tall. The padding and the opposite
 * margin keep the glow from being clipped without moving the text; the mask
 * fades an edge where the text continues.
 */
.lq-arrival-text {
  flex: 0 1 auto;
  min-height: 0;
  align-self: stretch;
  margin: -6px -12px;
  padding: 6px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.lq-arrival-text::-webkit-scrollbar {
  display: none;
}
.lq-arrival-text.lq-fade-b {
  mask-image: linear-gradient(#000 calc(100% - 44px), transparent);
}
.lq-arrival-text.lq-fade-t {
  mask-image: linear-gradient(transparent, #000 44px);
}
.lq-arrival-text.lq-fade-t.lq-fade-b {
  mask-image: linear-gradient(
    transparent,
    #000 44px,
    #000 calc(100% - 44px),
    transparent
  );
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
/*
 * The hint and the bar sit on their own dark, see-through pill, so they read
 * over any picture and on the paper alike, in both themes.
 */
.lq-arrival-pill {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgb(20 17 12 / 0.72);
  color: #fbf6ea;
  text-shadow: none;
}
.lq-arrival-hint {
  margin: 0;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  letter-spacing: 0.02em;
}
.lq-arrival-bar {
  width: 100%;
  min-width: 140px;
  height: 2px;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.25);
  overflow: hidden;
  box-shadow: none;
}
/* Empties over the reading time; Reduce motion keeps it (it is the clock). */
.lq-arrival-bar i {
  display: block;
  height: 100%;
  background: rgb(255 255 255 / 0.85);
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

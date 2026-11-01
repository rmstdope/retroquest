<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { ELIOR } from '@/lantern/stageSpeech'
import { renderMarkup } from '@/utils/theme'
import SpeechPortrait from './SpeechPortrait.vue'

/**
 * What characters say, shown on the room's picture like a visual novel: the
 * one Elior talks to (and anyone else who speaks up) from the right, Elior
 * from the left, each with a portrait at the edge of the picture and one
 * thread of lines between them in the order things were said. The newest line
 * is full strength, the one before it about 55% and the rest about 30%; when
 * the room is full the oldest leaves at the top, under a soft fade. A line
 * taller than the room never loses its top: the thread scrolls so the newest
 * line shows from its speaker down, its end faded at the bottom (the paper
 * below has every word). The conversation is kept by
 * `useStageSpeechStore`. A round ✕ clears it (the story band keeps every
 * line) and hands focus to the story band (`focus-story`); Escape clears it
 * too, which the layout handles with the other keys. The zone
 * fills the space between the stage's top and the story band (on a phone,
 * between the plate and the paper, the thread rising to the plate); a press
 * on it shows the rest of the turn's lines at once. Not shown while there is
 * no conversation. The zone reports its height (`room`) whenever it changes,
 * so the layout can fold the plate when the room is too small; `folded` says
 * the plate is folded, and the portraits are then smaller and rest 4px from
 * the foot so the ✕ above the right one stays clear of it.
 */
defineProps<{ phone?: boolean; folded?: boolean }>()
const emit = defineEmits<{ 'focus-story': []; room: [height: number] }>()
const game = useGameStore()
const speech = useStageSpeechStore()
const narration = useNarrationStore()

/** The newest line decides which side is speaking; the other is dimmed. */
const speakingSide = computed(() => speech.visible.at(-1)?.side ?? null)

/** Faded by how far back it was said: 0 newest, 1 the one before, 2 older. */
function age(index: number): 'new' | 'prev' | 'old' {
  const back = speech.visible.length - 1 - index
  return back === 0 ? 'new' : back === 1 ? 'prev' : 'old'
}

/** The thread of lines, while there is one. */
const thread = ref<HTMLElement | null>(null)

/**
 * Bring the newest line into view: the foot of the thread when it fits, or
 * its top (speaker and first words) when it is taller than the room.
 */
function pinNewest(): void {
  const el = thread.value
  const newest = el?.lastElementChild
  if (!el || !(newest instanceof HTMLElement)) return
  const pad = parseFloat(getComputedStyle(el).paddingTop) || 0
  const room = el.clientHeight - 2 * pad
  el.scrollTop =
    newest.offsetHeight > room ? newest.offsetTop - pad : el.scrollHeight
}

// A new line, or a thread made shorter by the paper growing, pins it again.
watch(
  () => speech.visible.at(-1)?.key,
  () => void nextTick(pinNewest),
)
let threadResize: ResizeObserver | undefined
watch(thread, (el) => {
  threadResize?.disconnect()
  if (!el || typeof ResizeObserver === 'undefined') return
  threadResize = new ResizeObserver(pinNewest)
  threadResize.observe(el)
})
onBeforeUnmount(() => threadResize?.disconnect())

/** The room's element, whose height is reported to the layout. */
const zone = ref<HTMLElement | null>(null)
let zoneResize: ResizeObserver | undefined
watch(zone, (el) => {
  zoneResize?.disconnect()
  if (!el || typeof ResizeObserver === 'undefined') return
  zoneResize = new ResizeObserver(() => emit('room', el.clientHeight))
  zoneResize.observe(el)
})
onBeforeUnmount(() => zoneResize?.disconnect())

/** Show the rest of the turn at once (the narrator, if reading, stops too). */
function hurry(): void {
  speech.revealAll()
  narration.skipAll()
}

/** Clear the picture and give focus to the story band. */
function clearAndFocus(): void {
  speech.clear()
  emit('focus-story')
}
</script>

<template>
  <div
    ref="zone"
    class="lq-speech-zone"
    :class="{ 'lq-phone-speech': phone, 'lq-speech-folded': folded }"
    data-testid="speech-zone"
    @click="hurry"
  >
    <div v-if="speech.visible.length" class="lq-speech">
      <SpeechPortrait
        v-if="speech.leftSpeaking"
        class="lq-sp-left"
        :name="ELIOR"
        src=""
        :dim="speakingSide === 'right'"
      />
      <SpeechPortrait
        v-if="speech.rightSpeaker"
        :key="speech.rightSpeaker"
        class="lq-sp-right"
        :name="speech.rightSpeaker"
        :src="game.portraitFor(speech.rightSpeaker)"
        :dim="speakingSide === 'left'"
      />
      <!-- The story band reads every line, so the thread is decoration. -->
      <div ref="thread" class="lq-thread" aria-hidden="true">
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-for="(line, index) in speech.visible"
          :key="line.key"
          class="lq-line"
          :class="[
            `lq-line-${line.side}`,
            `lq-age-${age(index)}`,
            { 'lq-speaking': speech.isSpeaking(line) },
          ]"
          data-testid="speech-line"
        >
          <b class="lq-line-name">{{ line.speaker }}</b>
          <span v-html="renderMarkup(line.markup)"></span>
        </div>
        <!-- eslint-enable vue/no-v-html -->
      </div>
      <button
        type="button"
        class="lq-clear"
        aria-label="Clear the conversation"
        title="Clear the conversation"
        @click.stop="clearAndFocus"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
/* The room between the top of the stage and the story band: its bottom is the band's top. */
.lq-speech-zone {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  /* Under the plate, so a faded line never covers a chip. */
  z-index: 0;
  container-type: inline-size;
  --lq-portrait-w: 9.84cqw;
  /* The picture and the plate under it stay pressable; only what is drawn here takes presses. */
  pointer-events: none;
}
.lq-speech {
  position: absolute;
  inset: 0;
}
.lq-sp-left,
.lq-sp-right {
  position: absolute;
  bottom: 12px;
  pointer-events: auto;
}
.lq-sp-left {
  left: 24px;
}
.lq-sp-right {
  right: 24px;
}
/* Below the row of buttons at the top of the picture, which the ✕ must not
   sit under. It scrolls (without a bar) and fades at both ends, so a line
   that does not fit is never cut by a hard edge. */
.lq-thread {
  position: absolute;
  top: 52px;
  bottom: 0;
  left: calc(var(--lq-portrait-w) + 46px);
  right: calc(var(--lq-portrait-w) + 46px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-block: 12px;
  overflow-y: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 12px,
    #000 calc(100% - 12px),
    transparent
  );
  pointer-events: none;
}
.lq-thread::-webkit-scrollbar {
  display: none;
}
/* The lines rest at the foot of the thread while they fit. */
.lq-line:first-child {
  margin-top: auto;
}
.lq-line {
  pointer-events: auto;
  flex: 0 0 auto;
  max-width: 46%;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid var(--lq-character);
  background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: 1.45;
  color: var(--lq-prose);
  overflow-wrap: anywhere;
  animation: lq-line-in calc(0.25s * var(--lq-motion)) ease-out both;
}
.lq-line-right {
  align-self: flex-end;
}
.lq-line-left {
  align-self: flex-start;
  border-color: var(--lq-accent);
}
.lq-line-name {
  display: block;
  margin-bottom: 2px;
  font-family: var(--lq-font-ui);
  font-size: calc(12px * var(--lq-text-scale));
  color: var(--lq-character);
}
.lq-line-left .lq-line-name {
  color: var(--lq-accent-text);
}
.lq-age-prev {
  opacity: 0.55;
}
.lq-age-old {
  opacity: 0.3;
}
/* The line being read: the read-along ring. */
.lq-line.lq-speaking {
  box-shadow:
    0 0 0 2px var(--lq-accent),
    0 6px 20px rgba(0, 0, 0, 0.25);
}
@keyframes lq-line-in {
  from {
    opacity: 0;
  }
}
/*
 * The phone: small portraits at the edges, a thread about 190 wide between them.
 * The name on the small card is in smaller type on one line, as in the mockup.
 */
.lq-phone-speech {
  --lq-portrait-w: 72px;
}
.lq-phone-speech :deep(.lq-foot) {
  padding: 2px 0;
  font-size: calc(10px * var(--lq-text-scale));
  font-weight: 600;
  letter-spacing: -0.02em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lq-phone-speech .lq-sp-left {
  left: 8px;
}
.lq-phone-speech .lq-sp-right {
  right: 8px;
}
.lq-phone-speech .lq-thread {
  top: 0;
  left: 88px;
  right: 88px;
}
.lq-phone-speech .lq-line {
  max-width: 92%;
  padding: 7px 10px;
}
/* Above the right portrait, clear of the thread that rises to the plate. */
.lq-phone-speech .lq-clear {
  top: 6px;
  right: 29px;
}
/* Folded plate: smaller portraits rest 4px from the foot and the ✕ sits at the very top, centred over the right one, clear of it. */
.lq-phone-speech.lq-speech-folded {
  --lq-portrait-w: 62px;
}
.lq-speech-folded .lq-sp-left,
.lq-speech-folded .lq-sp-right {
  bottom: 4px;
}
.lq-phone-speech.lq-speech-folded .lq-clear {
  top: 2px;
  right: 24px;
}
.lq-clear {
  position: absolute;
  top: 64px;
  right: calc(var(--lq-portrait-w) + 46px);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font-size: 13px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.lq-clear:focus-visible {
  outline: 2px solid var(--lq-accent);
  outline-offset: 2px;
}
</style>

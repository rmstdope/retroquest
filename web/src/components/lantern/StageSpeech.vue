<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { runHeads } from '@/lantern/stageSpeech'
import { renderMarkup } from '@/utils/theme'
import SpeechPortrait from './SpeechPortrait.vue'

/**
 * What characters say, shown on the room's picture chat-style in one column
 * at its right: everyone but Elior at the right edge with their small round
 * portrait on the right of their lines, Elior at the left of the column with
 * his on the left. Several lines in a row from one speaker are a run: the
 * name shows once above its first line still showing, and one portrait
 * beside it (the run's later lines carry only their words, lined up under
 * the first); when the first line leaves at the top, the name and portrait
 * step down to the next line showing. The newest line is full strength, the
 * one before it about 55% and the rest about 30%; a run's name and portrait
 * are as bright as the newest line of the run. When the room is full the
 * oldest leaves at the top, under a soft fade. A line taller than the room
 * never loses its top: the thread scrolls so the newest line shows from its
 * speaker down, its end faded at the bottom (the story band has every word).
 * The conversation is kept by `useStageSpeechStore`. This is the laptop
 * stage with a side each for the narrator and for speech; a phone and a narrow
 * window tell speech in the one column with the cards (`ColumnTurn`). There is
 * no control here: the one Hide of the layout clears both sides, and `away`
 * says the words are hidden, so the zone fades out and is unreachable while
 * the lines are kept. The zone fills the space under the stage's top; a press
 * on it shows the rest of the turn's lines at once. Not shown while there is no
 * conversation.
 */
defineProps<{ away?: boolean }>()
const game = useGameStore()
const speech = useStageSpeechStore()
const narration = useNarrationStore()

/** Faded by how far back it was said: 0 newest, 1 the one before, 2 older. */
function age(index: number): 'new' | 'prev' | 'old' {
  const back = speech.visible.length - 1 - index
  return back === 0 ? 'new' : back === 1 ? 'prev' : 'old'
}

/** Index of the first line still showing at the top of the thread (0 when nothing is laid out). */
const firstShowing = ref(0)

/** Which lines head a run, so carry its name and portrait. */
const heads = computed(() =>
  runHeads(
    speech.visible.map((line) => line.speaker),
    firstShowing.value,
  ),
)

/** How far back the run of a line ends: the age its name and portrait wear. */
function runAge(index: number): 'new' | 'prev' | 'old' {
  const lines = speech.visible
  let last = index
  while (
    last + 1 < lines.length &&
    lines[last + 1].speaker === lines[index].speaker
  )
    last++
  return age(last)
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
  findFirstShowing()
}

/**
 * Find the first line whose top is below the thread's top padding, so the
 * name drawn above it is inside the thread. A head's name and portrait take
 * no room of their own (rows keep a steady height), so moving the head
 * never moves anything else.
 */
function findFirstShowing(): void {
  const el = thread.value
  if (!el || el.clientHeight === 0) {
    firstShowing.value = 0
    return
  }
  const pad = parseFloat(getComputedStyle(el).paddingTop) || 0
  const rows = Array.from(el.children)
  const at = rows.findIndex(
    (row) => row instanceof HTMLElement && row.offsetTop >= el.scrollTop + pad,
  )
  // A thread cut through every row (one very tall line) heads its newest.
  firstShowing.value = at === -1 ? Math.max(0, rows.length - 1) : at
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

/** Show the rest of the turn at once (the narrator, if reading, stops too). */
function hurry(): void {
  speech.revealAll()
  narration.skipAll()
}
</script>

<template>
  <div
    class="lq-speech-zone"
    :class="{ 'lq-speech-away': away }"
    :inert="away || undefined"
    data-testid="speech-zone"
    @click="hurry"
  >
    <div v-if="speech.visible.length" class="lq-speech">
      <!-- The story band reads every line, so the thread is decoration. -->
      <div
        ref="thread"
        class="lq-thread"
        aria-hidden="true"
        @scroll.passive="findFirstShowing"
      >
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-for="(line, index) in speech.visible"
          :key="line.key"
          class="lq-ln"
          :class="[
            `lq-line-${line.side}`,
            {
              'lq-run-first':
                index === 0 ||
                speech.visible[index - 1].speaker !== line.speaker,
            },
          ]"
          data-testid="speech-line"
        >
          <SpeechPortrait
            v-if="heads[index] && line.side === 'left'"
            :class="`lq-age-${runAge(index)}`"
            :name="line.speaker"
            :src="game.portraitFor(line.speaker)"
          />
          <span v-else-if="line.side === 'left'" class="lq-gap"></span>
          <div class="lq-col">
            <b
              v-if="heads[index]"
              class="lq-line-name"
              :class="`lq-age-${runAge(index)}`"
              >{{ line.speaker }}</b
            >
            <div
              class="lq-line"
              :class="[
                `lq-age-${age(index)}`,
                { 'lq-speaking': speech.isSpeaking(line) },
              ]"
            >
              <span v-html="renderMarkup(line.markup)"></span>
            </div>
          </div>
          <SpeechPortrait
            v-if="heads[index] && line.side === 'right'"
            :class="`lq-age-${runAge(index)}`"
            :name="line.speaker"
            :src="game.portraitFor(line.speaker)"
          />
          <span v-else-if="line.side === 'right'" class="lq-gap"></span>
        </div>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The room under the stage's top: its bottom is the band's top (on a phone) or the actions' (the laptop). */
.lq-speech-zone {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  /* Under the plate, so a faded line never covers a chip. */
  z-index: 0;
  /* The picture and the plate under it stay pressable; only what is drawn here takes presses. */
  pointer-events: none;
}
.lq-speech {
  position: absolute;
  inset: 0;
}
/* Hidden with the narrator's cards by the one Hide: faded out, then out of reach. */
.lq-speech-away {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity calc(0.2s * var(--lq-motion)) ease,
    visibility 0s linear calc(0.2s * var(--lq-motion));
}
/* The column at the right of the picture, as wide as the drawing (600px) but
   never more than 44% of the stage, so a narrow window shares its width with
   the narrator's cards. It starts below the row of buttons and the ✕. It
   scrolls (without a bar) and fades at both ends, so a line that does not fit
   is never cut by a hard edge. */
.lq-thread {
  position: absolute;
  top: 110px;
  bottom: 12px;
  right: 16px;
  width: min(600px, 44%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* The top padding is room for a name drawn above the first line. */
  padding: 36px 0 12px;
  overflow-y: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 40px,
    #000 calc(100% - 12px),
    transparent
  );
  pointer-events: none;
  /* The name label measures its room in the column's own width. */
  container-type: inline-size;
}
.lq-thread::-webkit-scrollbar {
  display: none;
}
/* One row: the portrait (or a gap of its width) at the edge, the words beside it. */
.lq-ln {
  position: relative;
  flex: 0 0 auto;
  min-height: 46px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
}
.lq-line-right {
  align-self: flex-end;
  justify-content: flex-end;
}
.lq-line-left {
  align-self: flex-start;
}
.lq-gap {
  flex: none;
  width: 46px;
}
/* A run's real first line keeps room for its name; a name that steps down to a later line is drawn over the gap above it. */
.lq-run-first {
  margin-top: 16px;
}
/* The rows rest at the foot of the thread while they fit. */
.lq-ln:first-child {
  margin-top: auto;
}
.lq-col {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lq-line-right .lq-col {
  align-items: flex-end;
}
.lq-line-right .lq-line-name {
  right: 0;
}
.lq-line-left .lq-line-name {
  left: 0;
}
.lq-line {
  pointer-events: auto;
  max-width: 480px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-character);
  background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: 1.4;
  color: var(--lq-prose);
  overflow-wrap: anywhere;
  animation: lq-line-in calc(0.25s * var(--lq-motion)) ease-out both;
}
.lq-line-left .lq-line {
  border-color: var(--lq-accent);
  background: color-mix(in srgb, var(--lq-accent) 10%, var(--lq-surface));
}
.lq-line-name {
  position: absolute;
  bottom: 100%;
  /* A name reads whole: it wraps between words (or at a hyphen) when the
     column minus the portrait and its gap is too narrow, and only a single
     word wider than that may break. */
  width: max-content;
  max-width: calc(100cqw - 54px);
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: manual;
  margin-bottom: 3px;
  padding: 1px 9px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--lq-surface) 94%, transparent);
  font-family: var(--lq-font-ui);
  font-size: calc(12.5px * var(--lq-text-scale));
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
    0 2px 10px rgba(0, 0, 0, 0.18);
}
@keyframes lq-line-in {
  from {
    opacity: 0;
  }
}
</style>

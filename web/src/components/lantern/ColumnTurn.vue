<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import { useGameStore } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'
import { useReadAlong } from '@/composables/useReadAlong'
import { columnPieces } from '@/lantern/columnPieces'
import { parseTurn } from '@/lantern/parseTurn'
import type { SpeechLine } from '@/lantern/stageSpeech'
import { renderMarkup } from '@/utils/theme'
import SpeechPortrait from './SpeechPortrait.vue'
import StoryTurn from './StoryTurn.vue'

/**
 * One turn told in the single column of a phone or a narrow window: the
 * narrator's paper cards and the chat-style spoken lines in the order they
 * happened (see `columnPieces`). Everyone but Elior speaks at the column's
 * right edge with a small round portrait on the right, Elior at its left with
 * his on the left; the name and portrait show once per run of lines from one
 * speaker, and a narrator card in between ends the run. The whole turn wears
 * the dimming for how many turns ago it was (`age`). A turn that is still being
 * told stops at the first line that has not appeared yet, so later cards
 * never come before the line they follow, and a turn whose move is still
 * changing the picture shows no line at all. The lines are the conversation's
 * (`useStageSpeechStore`) while it holds them, and shown once it lets go.
 * The line being read is announced to the held story with the read-along's
 * `lq-follow` event, whole, so the story brings all of it into view as it
 * starts (its top first when it is taller than the pane), whether or not the
 * turn is a conversation; then its spoken word is lit and followed like the
 * narrator's, counted from the paragraph's place in the quote.
 */
const props = defineProps<{
  turn: Turn
  /** How many turns back this one is: the newest is lit, the one before is dimmed a step, older ones a further step. */
  age: 'new' | 'prev' | 'old'
}>()
const game = useGameStore()
const speech = useStageSpeechStore()
const scene = useSceneStore()

/**
 * The turn's pieces in the order they happened; of a talk that took Elior to
 * another room, only the lines said in the new room (its cards drop the rest
 * themselves).
 */
const pieces = computed(() => {
  const first = scene.firstUnit(props.turn.id)
  return columnPieces(props.turn, parseTurn(props.turn.text)).filter(
    (piece) =>
      piece.kind !== 'line' || first === null || piece.line.unit >= first,
  )
})

/** The pieces told so far: up to the first spoken line that has not appeared. */
const told = computed(() => {
  const all = pieces.value
  const stop = all.findIndex(
    (piece) =>
      piece.kind === 'line' &&
      !speech.lineShown(props.turn.id, piece.line.unit, piece.line.firstWord),
  )
  return stop === -1 ? all : all.slice(0, stop)
})

const root = ref<HTMLElement | null>(null)

// The cards light their own words; the column lights its lines'.
const { html } = useReadAlong(() => props.turn.id, root, { within: '.lq-cl' })

/** A line's HTML, its words marked while its quote is read (Elior's own `say` words are no unit, never read). */
function lineHtml(line: SpeechLine): string {
  return line.unit < 0
    ? renderMarkup(line.markup)
    : html(line.markup, line.unit, 0, Number.POSITIVE_INFINITY, line.firstWord)
}

/**
 * The told line being read aloud now, as its piece index (-1 for none): the
 * first one ringed, since a quote without word timings rings all its
 * paragraphs and is read from its first.
 */
const speakingIndex = computed(() =>
  told.value.findIndex(
    (piece) =>
      piece.kind === 'line' &&
      speech.lineSpeaking(props.turn.id, piece.line.unit, piece.line.firstWord),
  ),
)

// A line that starts being read asks the held story to keep it in view.
watch(
  speakingIndex,
  async (index) => {
    if (index < 0) return
    await nextTick()
    root.value
      ?.querySelector(`[data-piece="${index}"]`)
      ?.dispatchEvent(
        new CustomEvent(FOLLOW_EVENT, { bubbles: true, cancelable: true }),
      )
  },
  { flush: 'post' },
)

/** Whether piece `index` starts a run, so carries the speaker's name and portrait. */
function heads(index: number): boolean {
  const piece = told.value[index]
  const before = told.value[index - 1]
  return (
    piece?.kind === 'line' &&
    !(before?.kind === 'line' && before.line.speaker === piece.line.speaker)
  )
}
</script>

<template>
  <div
    ref="root"
    class="lq-column-turn"
    :class="`lq-age-${age}`"
    data-testid="column-turn"
    @click="speech.revealAll()"
  >
    <template v-for="(piece, index) in told" :key="index">
      <StoryTurn
        v-if="piece.kind === 'card'"
        :turn="turn"
        card
        :piece="piece"
      />
      <div
        v-else
        class="lq-cl"
        :class="[`lq-cl-${piece.line.side}`, { 'lq-cl-head': heads(index) }]"
        :data-unit="piece.line.unit >= 0 ? piece.line.unit : undefined"
        :data-piece="index"
        data-testid="speech-line"
      >
        <SpeechPortrait
          v-if="heads(index) && piece.line.side === 'left'"
          :name="piece.line.speaker"
          :src="game.portraitFor(piece.line.speaker)"
        />
        <span v-else-if="piece.line.side === 'left'" class="lq-gap"></span>
        <div class="lq-col">
          <b v-if="heads(index)" class="lq-line-name">{{
            piece.line.speaker
          }}</b>
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="lq-line"
            :class="{
              'lq-speaking': speech.lineSpeaking(
                turn.id,
                piece.line.unit,
                piece.line.firstWord,
              ),
            }"
          >
            <span v-html="lineHtml(piece.line)"></span>
          </div>
          <!-- eslint-enable vue/no-v-html -->
        </div>
        <SpeechPortrait
          v-if="heads(index) && piece.line.side === 'right'"
          :name="piece.line.speaker"
          :src="game.portraitFor(piece.line.speaker)"
        />
        <span v-else-if="piece.line.side === 'right'" class="lq-gap"></span>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* A turn's pieces one under another; the whole turn is dimmed by its age. */
.lq-column-turn {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lq-column-turn.lq-age-prev {
  opacity: 0.55;
}
.lq-column-turn.lq-age-old {
  opacity: 0.3;
}
/* One row: the portrait (or a gap of its width) at the edge, the words beside it. */
.lq-cl {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  /* Up to about three quarters of the column, whatever the line's own width. */
  max-width: 75%;
  pointer-events: auto;
}
.lq-cl-right {
  align-self: flex-end;
  justify-content: flex-end;
}
.lq-cl-left {
  align-self: flex-start;
}
/* A new run keeps a little air above it. */
.lq-cl-head {
  margin-top: 4px;
}
.lq-gap {
  flex: none;
  width: var(--lq-portrait, 46px);
}
.lq-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lq-cl-right .lq-col {
  align-items: flex-end;
}
.lq-line {
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
}
.lq-cl-left .lq-line {
  border-color: var(--lq-accent);
  background: color-mix(in srgb, var(--lq-accent) 10%, var(--lq-surface));
}
/* The name reads whole: it wraps between words, and only a single word wider than the column may break. */
.lq-line-name {
  align-self: flex-start;
  max-width: 100%;
  margin-bottom: 3px;
  padding: 1px 9px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--lq-surface) 94%, transparent);
  font-family: var(--lq-font-ui);
  font-size: calc(12.5px * var(--lq-text-scale));
  color: var(--lq-character);
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: manual;
}
.lq-cl-right .lq-line-name {
  align-self: flex-end;
}
.lq-cl-left .lq-line-name {
  color: var(--lq-accent-text);
}
/* The line being read: the read-along ring. */
.lq-line.lq-speaking {
  box-shadow:
    0 0 0 2px var(--lq-accent),
    0 2px 10px rgba(0, 0, 0, 0.18);
}
/* The spoken word, lit as in the narrator's cards. */
.lq-line :deep(.lq-w-now) {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--lq-accent-soft);
}
</style>

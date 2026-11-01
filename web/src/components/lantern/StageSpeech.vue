<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
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
 * the room is full the oldest leaves at the top. The conversation is kept by
 * `useStageSpeechStore`. A round ✕ and Escape clear it (the story band keeps
 * every line), and ✕ hands focus to the story band (`focus-story`). The zone
 * fills the space between the stage's top and the story band; a press on it
 * shows the rest of the turn's lines at once. Not shown while there is no
 * conversation.
 */
const emit = defineEmits<{ 'focus-story': [] }>()
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

/** Escape clears the picture, unless something else (a drawer, the map) closed first. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (!speech.conversation) return
  speech.clear()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="lq-speech-zone" data-testid="speech-zone" @click="hurry">
    <div v-if="speech.conversation" class="lq-speech">
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
      <div class="lq-thread" aria-hidden="true">
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
  z-index: 1;
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
/* Below the row of buttons at the top of the picture, which the ✕ must not sit under. */
.lq-thread {
  position: absolute;
  top: 64px;
  bottom: 12px;
  left: calc(var(--lq-portrait-w) + 46px);
  right: calc(var(--lq-portrait-w) + 46px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  overflow: hidden;
  pointer-events: none;
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
@keyframes lq-line-in {
  from {
    opacity: 0;
  }
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

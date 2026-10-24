<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useReadAlong } from '@/composables/useReadAlong'
import { usePanelFlash } from '@/composables/usePanelFlash'
import { displayName } from '@/lantern/displayName'
import { parseTurn } from '@/lantern/parseTurn'

/**
 * The room card above the story on laptops: where the player is, the room
 * description (long ones clamped to three lines with Read more) and who and
 * what is here (the Here chips are buttons: the layout opens their
 * actions menu). While the room is read aloud on arrival (the newest turn's
 * arrival unit, `useReadAlong`) the card is marked, opened if it was clamped,
 * and lights the spoken word of the description (the room's name is read
 * first, in the story's divider).
 */
const game = useGameStore()
const { flashing, endFlash } = usePanelFlash(['place'])

/** Descriptions longer than this get the clamp and a Read more toggle. */
const CLAMP_CHARS = 280

const expanded = ref(false)
const descriptionId = useId()
const clampable = computed(() => game.roomDescription.length > CLAMP_CHARS)

const root = ref<HTMLElement | null>(null)
const newest = computed(() => game.turns.at(-1))
/** The newest turn's arrival unit (after its answer's blocks), or -1. */
const arrivalUnit = computed(() =>
  newest.value?.arrival ? parseTurn(newest.value.text).length : -1,
)
const { isSpeaking, html } = useReadAlong(() => newest.value?.id ?? 0, root)
/** Whether the room is being read aloud now. */
const reading = computed(
  () => arrivalUnit.value >= 0 && isSpeaking(arrivalUnit.value),
)
const here = computed(() => [
  ...game.characters.map((name) => ({ name, kind: 'character' })),
  ...game.items.map((name) => ({ name, kind: 'item' })),
])

// A new room starts collapsed again.
watch(
  () => game.roomName,
  () => {
    expanded.value = false
  },
)
</script>

<template>
  <section
    ref="root"
    class="lq-room-card"
    :class="{ 'lq-speaking': reading, 'lq-flash': flashing }"
    aria-label="Current location"
    @animationend.self="endFlash"
  >
    <span class="lq-label">You are in</span>
    <h2 class="lq-room-name">{{ game.roomName }}</h2>
    <!-- eslint-disable vue/no-v-html -->
    <p
      :id="descriptionId"
      class="lq-room-text"
      :class="{ 'lq-clamp': clampable && !expanded && !reading }"
      v-html="html(game.roomDescription, arrivalUnit, 1)"
    ></p>
    <!-- eslint-enable vue/no-v-html -->
    <button
      v-if="clampable"
      type="button"
      class="lq-read-more"
      :aria-controls="descriptionId"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Read more' }}
    </button>
    <div v-if="here.length" class="lq-here">
      <span class="lq-label">Here</span>
      <button
        v-for="entry in here"
        :key="`${entry.kind}:${entry.name}`"
        type="button"
        class="lq-here-chip"
        :class="`lq-here-${entry.kind}`"
        :data-name-kind="entry.kind"
        :data-name="entry.name"
        aria-haspopup="menu"
      >
        {{ displayName(entry.name) }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* The room being read aloud: its card lit, the spoken word marked. */
.lq-room-card.lq-speaking {
  border-color: var(--lq-accent);
  box-shadow: 0 0 0 1px var(--lq-accent);
}
.lq-room-card :deep(.lq-w-now) {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--lq-accent-soft);
}
.lq-room-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
}
.lq-label {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-room-name {
  margin: 0;
  font-family: var(--lq-font-display);
  font-size: calc(24px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-room-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lq-read-more {
  align-self: flex-start;
  min-height: 32px;
  padding: 0;
  border: none;
  background: none;
  color: var(--lq-accent-text);
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
.lq-here {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}
.lq-here-chip {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
.lq-here-character {
  border: 1px solid var(--lq-character-line);
  background: var(--lq-character-soft);
  color: var(--lq-character);
}
.lq-here-item {
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  color: var(--lq-item);
}
</style>

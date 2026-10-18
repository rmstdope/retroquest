<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Arrival } from '@/stores/useGameStore'
import { displayName } from '@/lantern/displayName'
import { exitArrow } from '@/lantern/exitArrow'
import { renderMarkup } from '@/utils/theme'

/**
 * Arrival in a room inside the story: a chapter-style divider, the room
 * description and a "Here + exits" box. On laptops a long description is
 * clamped to three lines with "Read more"; phones always show it in full.
 */
const props = defineProps<{ arrival: Arrival; command: string | null }>()

/** Descriptions longer than this get the laptop clamp and a Read more toggle. */
const CLAMP_CHARS = 280

const DIRECTIONS: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
}
/** Move commands as the engine's CommandParser accepts them ("go" takes any exit). */
const MOVE =
  /^(?:(?:go|move)\s+(north|south|east|west|up|down)|(north|south|east|west|up|down|n|s|e|w)|go\s+(\w+))$/i

const direction = computed(() => {
  const match = MOVE.exec(props.command?.trim() ?? '')
  if (!match) return null
  const word = (match[1] ?? match[2] ?? match[3]).toLowerCase()
  return DIRECTIONS[word] ?? word
})

const here = computed(() => [
  ...props.arrival.characters.map((name) => ({ name, kind: 'character' })),
  ...props.arrival.items.map((name) => ({ name, kind: 'item' })),
])
const exits = computed(() => Object.entries(props.arrival.exits))

const clampable = computed(() => props.arrival.description.length > CLAMP_CHARS)
const expanded = ref(false)
</script>

<template>
  <section class="lq-arrival" :aria-label="`Arrived at ${arrival.room}`">
    <div class="lq-divider" data-testid="divider">
      <span class="lq-rule" aria-hidden="true"></span>
      <span v-if="direction" class="lq-direction"
        ><span class="lq-arrow" aria-hidden="true">{{
          exitArrow(direction)
        }}</span>
        {{ displayName(direction) }}</span
      >
      <span class="lq-room">{{ arrival.room }}</span>
      <span class="lq-rule" aria-hidden="true"></span>
    </div>

    <!-- eslint-disable vue/no-v-html -->
    <p
      class="lq-arrival-text"
      :class="{ 'lq-clamp': clampable && !expanded }"
      v-html="renderMarkup(arrival.description)"
    ></p>
    <!-- eslint-enable vue/no-v-html -->
    <button
      v-if="clampable"
      type="button"
      class="lq-read-more"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Read more' }}
    </button>

    <div v-if="here.length || exits.length" class="lq-here-box">
      <div v-if="here.length" class="lq-here" data-testid="here">
        <span class="lq-here-label">Here</span>
        <span
          v-for="entry in here"
          :key="`${entry.kind}:${entry.name}`"
          class="lq-here-chip"
          :class="`lq-here-${entry.kind}`"
          >{{ displayName(entry.name) }}</span
        >
      </div>
      <div v-if="exits.length" class="lq-exits" data-testid="exits">
        <span class="lq-here-label">Exits</span>
        <span v-for="[dir, room] in exits" :key="dir" class="lq-exit">
          <span class="lq-exit-dir"
            ><span class="lq-arrow" aria-hidden="true">{{
              exitArrow(dir)
            }}</span>
            {{ dir.replace(/_/g, ' ') }}</span
          >
          ({{ room }})
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lq-arrival {
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--lq-density));
}
.lq-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0;
}
.lq-rule {
  flex: 1;
  min-width: 12px;
  height: 1px;
  background: var(--lq-line2);
}
.lq-direction {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-muted);
  white-space: nowrap;
}
.lq-room {
  font-family: var(--lq-font-display);
  font-size: calc(21px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
  text-align: center;
}
.lq-arrival-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
  max-width: 72ch;
}
.lq-read-more {
  display: none;
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
/* Laptop: long descriptions clamp to three lines (phones show them in full). */
@media (min-width: 1024px) {
  .lq-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .lq-read-more {
    display: inline-block;
  }
}
.lq-here-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
}
.lq-here,
.lq-exits {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-family: var(--lq-font-ui);
  font-size: calc(13px * var(--lq-text-scale));
  color: var(--lq-muted);
}
.lq-here-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lq-here-chip {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 13px;
  white-space: nowrap;
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
.lq-exit-dir {
  color: var(--lq-accent-text);
  font-weight: 600;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Arrival } from '@/stores/useGameStore'
import { useMediaQuery, WIDE_QUERY } from '@/composables/useMediaQuery'
import { displayName } from '@/lantern/displayName'
import { exitArrow } from '@/lantern/exitArrow'
import { escapeHtml, renderMarkup } from '@/utils/theme'

/**
 * Arrival in a room inside the story: a chapter-style divider, the room
 * description and a "Here + exits" box. On laptops the room card shows Here
 * and the map the exits, so the story keeps only the divider and the
 * description (which is read aloud here, never in the card). The
 * Here chips of what is still around are buttons: the layout opens their
 * actions menu. The rest (an earlier room, or gone since) are plain text.
 */
const props = defineProps<{
  arrival: Arrival
  command: string | null
  /** The room's name as HTML with its words marked, while it is read aloud. */
  nameHtml?: string
  /** The description as HTML with its words marked, while it is read aloud. */
  descriptionHtml?: string
  /** True when the player stayed and looked around: the region is not an arrival. */
  stayed?: boolean
}>()
const wide = useMediaQuery(WIDE_QUERY)
const game = useGameStore()

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

const here = computed(() => {
  const inRoom = props.arrival.room === game.roomName
  return [
    ...props.arrival.characters.map((name) => ({
      name,
      kind: 'character',
      present: inRoom && game.characters.includes(name),
    })),
    ...props.arrival.items.map((name) => ({
      name,
      kind: 'item',
      present: inRoom && game.items.includes(name),
    })),
  ]
})
const exits = computed(() => Object.entries(props.arrival.exits))
</script>

<template>
  <section
    class="lq-arrival"
    :aria-label="stayed ? arrival.room : `Arrived at ${arrival.room}`"
  >
    <div class="lq-divider" data-testid="divider">
      <span class="lq-rule" aria-hidden="true"></span>
      <span v-if="direction" class="lq-direction"
        ><span class="lq-arrow" aria-hidden="true">{{
          exitArrow(direction)
        }}</span>
        {{ displayName(direction) }}</span
      >{{ direction ? ' ' : '' }}
      <!-- eslint-disable vue/no-v-html -->
      <h3 class="lq-room" v-html="nameHtml ?? escapeHtml(arrival.room)"></h3>
      <!-- eslint-enable vue/no-v-html -->
      <span class="lq-rule" aria-hidden="true"></span>
    </div>

    <!-- eslint-disable vue/no-v-html -->
    <p
      class="lq-arrival-text"
      v-html="descriptionHtml ?? renderMarkup(arrival.description)"
    ></p>
    <!-- eslint-enable vue/no-v-html -->
    <template v-if="!wide">
      <div v-if="here.length || exits.length" class="lq-here-box">
        <div v-if="here.length" class="lq-here" data-testid="here">
          <span class="lq-here-label">Here</span>
          <template v-for="entry in here" :key="`${entry.kind}:${entry.name}`">
            <button
              v-if="entry.present"
              type="button"
              class="lq-here-chip"
              :class="`lq-here-${entry.kind}`"
              :data-name-kind="entry.kind"
              :data-name="entry.name"
              aria-haspopup="menu"
            >
              {{ displayName(entry.name) }}
            </button>
            <span
              v-else
              class="lq-here-chip"
              :class="`lq-here-${entry.kind}`"
              >{{ displayName(entry.name) }}</span
            >
          </template>
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
    </template>
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
  margin: 0;
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
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}
button.lq-here-chip {
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
.lq-exit-dir {
  color: var(--lq-accent-text);
  font-weight: 600;
}
</style>

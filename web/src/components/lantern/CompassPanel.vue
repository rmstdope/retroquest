<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { displayName } from '@/lantern/displayName'
import { exitArrow } from '@/lantern/exitArrow'

/**
 * The map compass beside the story on laptops: the exits laid out around the
 * current room in a 3 × 3 grid (up/down in the top/bottom-right corners),
 * other named exits listed below. Each exit is a button that moves there.
 * As a phone section it gets a "Map" heading (`heading`).
 */
defineProps<{ heading?: boolean }>()
const game = useGameStore()

/** Grid cell (row-major, 0–8) for each compass direction; 4 is the room. */
const CELLS: Record<string, number> = {
  north: 1,
  up: 2,
  west: 3,
  east: 5,
  south: 7,
  down: 8,
}

const grid = computed(() =>
  Array.from({ length: 9 }, (_, cell) => {
    const entry = Object.entries(game.exits).find(
      ([dir]) => Object.hasOwn(CELLS, dir) && CELLS[dir] === cell,
    )
    return entry ? { dir: entry[0], room: entry[1] } : null
  }),
)
const otherExits = computed(() =>
  Object.entries(game.exits)
    .filter(([dir]) => !Object.hasOwn(CELLS, dir))
    .map(([dir, room]) => ({ dir, room })),
)
const hasExits = computed(() => Object.keys(game.exits).length > 0)

function go(direction: string): void {
  if (game.acceptInput) game.submitCommand(`go ${direction}`)
}
</script>

<template>
  <section class="lq-compass" aria-label="Map">
    <h2 v-if="heading" class="lq-compass-title">Map</h2>
    <div class="lq-grid">
      <template v-for="(exit, cell) in grid" :key="cell">
        <div v-if="cell === 4" class="lq-here">
          <span class="lq-here-label">You are here</span>
          <span class="lq-here-room">{{ game.roomName }}</span>
        </div>
        <button
          v-else-if="exit"
          type="button"
          class="lq-exit"
          :data-dir="exit.dir"
          :aria-label="`Go ${exit.dir} to ${exit.room}`"
          :disabled="!game.acceptInput"
          @click="go(exit.dir)"
        >
          <span class="lq-exit-dir" aria-hidden="true"
            >{{ exitArrow(exit.dir) }} {{ displayName(exit.dir) }}</span
          >
          <span class="lq-exit-room" aria-hidden="true">{{ exit.room }}</span>
        </button>
        <span v-else class="lq-cell" aria-hidden="true"></span>
      </template>
    </div>

    <div v-if="otherExits.length" class="lq-other-exits">
      <button
        v-for="exit in otherExits"
        :key="exit.dir"
        type="button"
        class="lq-exit"
        :data-dir="exit.dir"
        :aria-label="`Go ${displayName(exit.dir)} to ${exit.room}`"
        :disabled="!game.acceptInput"
        @click="go(exit.dir)"
      >
        <span class="lq-exit-dir" aria-hidden="true"
          >{{ exitArrow(exit.dir) }} {{ displayName(exit.dir) }}</span
        >
        <span class="lq-exit-room" aria-hidden="true">{{ exit.room }}</span>
      </button>
    </div>

    <p v-if="!hasExits" class="lq-no-exits">No exits from here.</p>
  </section>
</template>

<style scoped>
.lq-compass {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  font-family: var(--lq-font-ui);
}
/* Inset like the journal's heading (16px) so switching sections keeps it put. */
.lq-compass-title {
  margin: 0;
  padding: 0 4px;
  font-family: var(--lq-font-display);
  font-size: calc(20px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.lq-here,
.lq-cell,
.lq-exit {
  min-height: 56px;
  border-radius: 10px;
}
.lq-here {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  text-align: center;
  border: 1px solid var(--lq-line);
}
.lq-here-label {
  font-size: 11px;
  color: var(--lq-muted);
}
.lq-here-room {
  font-size: 12px;
  color: var(--lq-fg);
}
.lq-cell {
  border: 1px dashed var(--lq-line);
}
.lq-exit {
  overflow-wrap: anywhere;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 12px;
  line-height: 1.25;
  cursor: pointer;
}
.lq-exit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-exit-dir {
  font-weight: 600;
}
.lq-exit-room {
  color: var(--lq-prose);
}
.lq-other-exits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lq-other-exits .lq-exit {
  flex: 1 1 120px;
}
.lq-no-exits {
  margin: 0;
  font-size: 13px;
  color: var(--lq-muted);
}
</style>

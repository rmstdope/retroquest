<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { displayName } from '@/lantern/displayName'
import { exitArrow } from '@/lantern/exitArrow'

/**
 * The folded action panel on phones: one row with the exits as arrow
 * buttons, "Actions ▴" to open the panel and a keyboard button to open it
 * straight into typing.
 */
const emit = defineEmits<{ open: [mode: 'actions' | 'type'] }>()
const game = useGameStore()
const openButton = ref<HTMLButtonElement | null>(null)

const COMPASS = new Set(['north', 'south', 'east', 'west', 'up', 'down'])

/** Exit names read as the compass reads them ("Go north", "Go Secret Passage"). */
const exits = computed(() =>
  Object.entries(game.exits).map(([dir, room]) => ({
    dir,
    room,
    name: COMPASS.has(dir) ? dir : displayName(dir),
  })),
)

function go(direction: string): void {
  if (game.acceptInput) game.submitCommand(`go ${direction}`)
}

/** Put keyboard focus on the Actions button (after the panel folds). */
function focus(): void {
  openButton.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <section class="lq-dock" aria-label="Action bar">
    <div v-if="exits.length" class="lq-dock-exits">
      <button
        v-for="{ dir, room, name } in exits"
        :key="dir"
        type="button"
        class="lq-dock-exit"
        :aria-label="`Go ${name} to ${room}`"
        :disabled="!game.acceptInput"
        @click="go(dir)"
      >
        {{ exitArrow(dir) }}
      </button>
    </div>
    <button
      ref="openButton"
      type="button"
      class="lq-dock-open"
      @click="emit('open', 'actions')"
    >
      Actions ▴
    </button>
    <button
      type="button"
      class="lq-dock-icon"
      aria-label="Type a command"
      @click="emit('open', 'type')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
      </svg>
    </button>
  </section>
</template>

<style scoped>
.lq-dock {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  font-family: var(--lq-font-ui);
}
.lq-dock-exits {
  display: flex;
  gap: 4px;
  flex: 0 1 auto;
  min-width: 0;
  overflow-x: auto;
}
.lq-dock-exit,
.lq-dock-icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font: inherit;
  cursor: pointer;
}
.lq-dock-exit {
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  font-size: 18px;
}
.lq-dock-exit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-dock-icon {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
.lq-dock-open {
  /* Never squeezed: the exits scroll sideways instead. */
  flex: 1 0 auto;
  height: 44px;
  padding: 0 14px;
  white-space: nowrap;
  border: none;
  border-radius: 10px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>

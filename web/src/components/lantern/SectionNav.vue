<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useFlightStore } from '@/stores/useFlightStore'

/**
 * Section tabs on phones: Story, Bag, Spells, Quests and Map. A dot marks
 * Bag, Spells or Quests while something new is in it. Bag and Spells are
 * where a gained item or spell flies to on a phone (`data-flight-target`,
 * `AcquiredFlight`), and the tab it lands in bumps.
 */
export type Section = 'story' | 'bag' | 'spells' | 'quests' | 'map'

const current = defineModel<Section>({ required: true })
/** Every tap on a tab, also on the one already shown (the phone stage closes the story so far on it). */
const emit = defineEmits<{ press: [section: Section] }>()
const game = useGameStore()
const flights = useFlightStore()

/** Show the section and tell the layout it was tapped. */
function choose(id: Section): void {
  current.value = id
  emit('press', id)
}

const sections = computed(() => [
  { id: 'story' as const, label: 'Story', dot: false, flight: undefined },
  { id: 'bag' as const, label: 'Bag', dot: game.bagHasNew, flight: 'item' },
  {
    id: 'spells' as const,
    label: 'Spells',
    dot: game.spellsHaveNew,
    flight: 'spell',
  },
  {
    id: 'quests' as const,
    label: 'Quests',
    dot: game.questsHaveNew,
    flight: undefined,
  },
  { id: 'map' as const, label: 'Map', dot: false, flight: undefined },
])
</script>

<template>
  <nav class="lq-nav" aria-label="Sections">
    <button
      v-for="s in sections"
      :key="s.id"
      type="button"
      class="lq-nav-btn"
      :class="{ 'lq-landed': !!s.flight && flights.landed === s.flight }"
      :data-flight-target="s.flight"
      :aria-current="current === s.id ? 'page' : undefined"
      @click="choose(s.id)"
    >
      {{ s.label
      }}<span v-if="s.dot" class="lq-dot"
        ><span class="lq-sr-only"> (new)</span></span
      >
    </button>
  </nav>
</template>

<style scoped>
.lq-nav {
  display: flex;
  font-family: var(--lq-font-ui);
}
.lq-nav-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding: 0 6px;
  border: none;
  border-top: 2px solid transparent;
  background: none;
  color: var(--lq-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.lq-nav-btn[aria-current='page'] {
  border-top-color: var(--lq-accent);
  color: var(--lq-accent-text);
  font-weight: 600;
}
/* In the header (phone landscape): compact tabs underlined like the journal's. */
.lq-nav-top {
  gap: 2px;
}
.lq-nav-top .lq-nav-btn {
  flex: 0 0 auto;
  padding: 0 8px;
  border-top: none;
  border-bottom: 2px solid transparent;
}
.lq-nav-top .lq-nav-btn[aria-current='page'] {
  border-bottom-color: var(--lq-accent);
}
.lq-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-left: 4px;
  border-radius: 4px;
  background: var(--lq-accent);
  vertical-align: middle;
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
/* A gained item or spell has just flown in: the button bumps (AcquiredFlight). */
.lq-nav-btn.lq-landed {
  transform: scale(1.12);
  transition: transform calc(140ms * var(--lq-motion)) ease-out;
}
.lq-nav-btn:not(.lq-landed) {
  transition: transform calc(300ms * var(--lq-motion)) ease-in;
}
</style>

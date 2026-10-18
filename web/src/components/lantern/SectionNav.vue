<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

/**
 * Section tabs on phones: Story, Bag, Spells, Quests and Map. A dot marks
 * Bag or Spells while something new is in it.
 */
export type Section = 'story' | 'bag' | 'spells' | 'quests' | 'map'

const current = defineModel<Section>({ required: true })
const game = useGameStore()

const sections = computed(() => [
  { id: 'story' as const, label: 'Story', dot: false },
  { id: 'bag' as const, label: 'Bag', dot: game.bagHasNew },
  { id: 'spells' as const, label: 'Spells', dot: game.spellsHaveNew },
  { id: 'quests' as const, label: 'Quests', dot: false },
  { id: 'map' as const, label: 'Map', dot: false },
])
</script>

<template>
  <nav class="lq-nav" aria-label="Sections">
    <button
      v-for="s in sections"
      :key="s.id"
      type="button"
      class="lq-nav-btn"
      :aria-current="current === s.id ? 'page' : undefined"
      @click="current = s.id"
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
</style>

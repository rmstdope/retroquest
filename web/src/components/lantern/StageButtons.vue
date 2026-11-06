<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useFlightStore } from '@/stores/useFlightStore'
import CompassPanel from './CompassPanel.vue'

/**
 * The buttons in the stage's top-right corner: Bag, Spells and Quests (with
 * their counts and today's amber dot while something is new) open the journal
 * drawer, "⟲ Story so far" opens the story drawer, and "🧭 Map" opens the map
 * of the ways out beneath it. They are controlled by the layout, which lets
 * only one of the five be open (`drawer`), and press-only: nothing opens on
 * hover. The button of the open one stays lit. Walking from the map keeps it
 * open. Escape closes the map (asking the layout to, which returns focus to
 * the button) and nothing else hears it. The buttons open their drawers at
 * once, even while a turn is read aloud; only the map's ways out are a held
 * panel (`data-panel`), where a first press catches up. Bag and Spells are
 * where a gained item or spell flies to (`data-flight-target`,
 * `AcquiredFlight`), and the one it lands in bumps.
 */
type Tab = 'bag' | 'spells' | 'quests'

const props = defineProps<{ drawer: Tab | 'story' | 'map' | null }>()
const emit = defineEmits<{
  journal: [tab: Tab]
  story: []
  map: []
  close: []
}>()
const game = useGameStore()
const flights = useFlightStore()

const root = ref<HTMLElement | null>(null)
const mapOpen = computed(() => props.drawer === 'map')

const journalButtons = computed(() => [
  {
    tab: 'bag' as const,
    label: `Bag · ${game.rawInventory.length}`,
    dot: game.bagHasNew,
    flight: 'item' as const,
  },
  {
    tab: 'spells' as const,
    label: `Spells · ${game.rawSpells.length}`,
    dot: game.spellsHaveNew,
    flight: 'spell' as const,
  },
  {
    tab: 'quests' as const,
    label: `Quests · ${game.activeQuests.length}`,
    dot: game.questsHaveNew,
    flight: undefined,
  },
])

/**
 * Escape closes the map, if it is open, and nothing else hears it; but not
 * while a dialog is up (the bigger map), which takes the key itself.
 */
function onDocumentKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !mapOpen.value) return
  if (document.querySelector('.lq-dialog-layer')) return
  event.stopPropagation()
  event.preventDefault()
  emit('close')
}

watch(
  mapOpen,
  (open) => {
    // Capture, so the layout's narration keys do not also hear this Escape.
    if (open) document.addEventListener('keydown', onDocumentKey, true)
    else document.removeEventListener('keydown', onDocumentKey, true)
  },
  { immediate: true },
)
onUnmounted(() => document.removeEventListener('keydown', onDocumentKey, true))

/** Focus a button: a journal button, Story so far, or the Map button. */
async function focusButton(which: Tab | 'story' | 'map'): Promise<void> {
  await nextTick()
  root.value?.querySelector<HTMLElement>(`[data-button="${which}"]`)?.focus()
}
defineExpose({ focusButton })
</script>

<template>
  <div ref="root" class="lq-buttons">
    <div class="lq-button-row">
      <button
        v-for="button in journalButtons"
        :key="button.tab"
        type="button"
        class="lq-stage-btn"
        :class="{
          'lq-lit': props.drawer === button.tab,
          'lq-landed': !!button.flight && flights.landed === button.flight,
        }"
        :data-button="button.tab"
        :data-flight-target="button.flight"
        :aria-pressed="props.drawer === button.tab ? 'true' : 'false'"
        @click="emit('journal', button.tab)"
      >
        {{ button.label }}
        <span v-if="button.dot" class="lq-dot" aria-label="new"></span>
      </button>
      <button
        type="button"
        class="lq-stage-btn"
        :class="{ 'lq-lit': props.drawer === 'story' }"
        data-button="story"
        :aria-pressed="props.drawer === 'story' ? 'true' : 'false'"
        @click="emit('story')"
      >
        ⟲ Story so far
      </button>
      <div class="lq-map-wrap">
        <button
          type="button"
          class="lq-stage-btn"
          :class="{ 'lq-lit': mapOpen }"
          data-button="map"
          aria-haspopup="true"
          :aria-expanded="mapOpen ? 'true' : 'false'"
          @click="emit('map')"
        >
          🧭 Map
        </button>
        <div v-if="mapOpen" class="lq-map-pop" data-panel>
          <CompassPanel stage />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lq-buttons {
  display: flex;
  justify-content: flex-end;
}
.lq-button-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.lq-stage-btn {
  position: relative;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
  color: var(--lq-fg);
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
}
.lq-stage-btn.lq-lit {
  border-color: var(--lq-accent);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: 6px;
  border-radius: 50%;
  background: var(--lq-accent);
}
.lq-map-wrap {
  position: relative;
}
/* Starts at the button's edge. */
.lq-map-pop {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 5;
  width: 300px;
  padding-top: 6px;
}
/* A gained item or spell has just flown in: the button bumps (AcquiredFlight). */
.lq-stage-btn.lq-landed {
  transform: scale(1.12);
  transition: transform calc(140ms * var(--lq-motion)) ease-out;
}
.lq-stage-btn:not(.lq-landed) {
  transition: transform calc(300ms * var(--lq-motion)) ease-in;
}
</style>

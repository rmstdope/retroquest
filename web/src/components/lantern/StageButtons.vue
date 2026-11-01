<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import CompassPanel from './CompassPanel.vue'

/**
 * The buttons in the stage's top-right corner: Bag, Spells and Quests (with
 * their counts and today's amber dot while something is new) open the journal
 * drawer, "⟲ Story so far" goes back to the start of the story, and "🧭 Map"
 * opens the map of the ways out beneath it. The map opens when the pointer is
 * on the button, stays while the pointer is on the button or the map, and
 * closes a moment after it leaves; pressing the button (or Enter or Space on
 * it) also opens it, for keyboards and touch screens. Walking from the map
 * keeps it open. Escape closes it and returns focus to the button; a press
 * outside closes it too. The button of the open drawer stays lit.
 */
type Tab = 'bag' | 'spells' | 'quests'

const props = defineProps<{ drawer: Tab | null }>()
const emit = defineEmits<{ journal: [tab: Tab]; story: [] }>()
const game = useGameStore()

/** How long the map waits after the pointer leaves before it closes. */
const MAP_CLOSE_MS = 250

const root = ref<HTMLElement | null>(null)
const mapOpen = ref(false)
/** The map was opened by a press, so another press closes it. */
const pressed = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | undefined

const journalButtons = computed(() => [
  {
    tab: 'bag' as const,
    label: `Bag · ${game.rawInventory.length}`,
    dot: game.bagHasNew,
  },
  {
    tab: 'spells' as const,
    label: `Spells · ${game.rawSpells.length}`,
    dot: game.spellsHaveNew,
  },
  {
    tab: 'quests' as const,
    label: `Quests · ${game.activeQuests.length}`,
    dot: game.questsHaveNew,
  },
])

function openMap(): void {
  clearTimeout(closeTimer)
  mapOpen.value = true
}

function closeMap(): void {
  clearTimeout(closeTimer)
  mapOpen.value = false
  pressed.value = false
}

/** Only a mouse hovers; on a touch screen the press does it. */
function onEnter(event: PointerEvent): void {
  if (event.pointerType === 'mouse') openMap()
}

function onLeave(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || !mapOpen.value) return
  clearTimeout(closeTimer)
  closeTimer = setTimeout(closeMap, MAP_CLOSE_MS)
}

/** A press opens the map (or, if it was opened by a press, closes it). */
function pressMap(): void {
  if (mapOpen.value && pressed.value) closeMap()
  else {
    openMap()
    pressed.value = true
  }
}

/** Escape closes the map, if it is open, and nothing else hears it. */
function onDocumentKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !mapOpen.value) return
  event.stopPropagation()
  event.preventDefault()
  closeMap()
  focusButton('map')
}

function onDocumentPress(event: Event): void {
  if (root.value && event.target instanceof Node)
    if (!root.value.contains(event.target)) closeMap()
}

watch(mapOpen, (open) => {
  if (open) {
    // Capture, so the layout's narration keys do not also hear this Escape.
    document.addEventListener('keydown', onDocumentKey, true)
    document.addEventListener('pointerdown', onDocumentPress)
  } else {
    document.removeEventListener('keydown', onDocumentKey, true)
    document.removeEventListener('pointerdown', onDocumentPress)
  }
})
onUnmounted(() => {
  clearTimeout(closeTimer)
  document.removeEventListener('keydown', onDocumentKey, true)
  document.removeEventListener('pointerdown', onDocumentPress)
})

/** Focus a button: a journal button, or the Map button. */
async function focusButton(which: Tab | 'map'): Promise<void> {
  await nextTick()
  root.value?.querySelector<HTMLElement>(`[data-button="${which}"]`)?.focus()
}
defineExpose({ focusButton })
</script>

<template>
  <div ref="root" class="lq-buttons" data-panel>
    <div class="lq-button-row">
      <button
        v-for="button in journalButtons"
        :key="button.tab"
        type="button"
        class="lq-stage-btn"
        :class="{ 'lq-lit': props.drawer === button.tab }"
        :data-button="button.tab"
        :aria-pressed="props.drawer === button.tab ? 'true' : 'false'"
        @click="emit('journal', button.tab)"
      >
        {{ button.label }}
        <span v-if="button.dot" class="lq-dot" aria-label="new"></span>
      </button>
      <button
        type="button"
        class="lq-stage-btn"
        data-button="story"
        @click="emit('story')"
      >
        ⟲ Story so far
      </button>
      <div class="lq-map-wrap" @pointerenter="onEnter" @pointerleave="onLeave">
        <button
          type="button"
          class="lq-stage-btn"
          :class="{ 'lq-lit': mapOpen }"
          data-button="map"
          aria-haspopup="true"
          :aria-expanded="mapOpen ? 'true' : 'false'"
          @click="pressMap"
        >
          🧭 Map
        </button>
        <div v-if="mapOpen" class="lq-map-pop">
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
/* Starts at the button's edge, so the pointer never crosses a gap. */
.lq-map-pop {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 5;
  width: 300px;
  padding-top: 6px;
}
</style>

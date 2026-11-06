<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { layoutMap } from '@/lantern/mapLayout'
import { routeTo } from '@/lantern/mapRoute'
import LanternDialog from './LanternDialog.vue'

/**
 * The bigger map (desktop): a middle window drawing every place of the act
 * the player has visited, and every place seen from one, as named boxes
 * laid out like the small map (see `layoutMap`) and joined by paths. A path
 * into a place not visited is dashed; up, down and secret ways carry a tag.
 * Pressing a place (all but the one the player is in) asks the store to walk
 * there and closes the window; × and Escape close it without moving. The
 * places dim while the game is busy, and a visited place that no open way
 * leads to from here (a hut with no door) is drawn but cannot be pressed. It opens with "You are here" in view.
 */
const emit = defineEmits<{ close: [] }>()
const game = useGameStore()

const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const COLUMN = 170
const ROW = 96
const BOX_WIDTH = 136
const BOX_HEIGHT = 52
const MARGIN = 12

const eyebrow = computed(() =>
  game.questProgress
    ? `Act ${ROMAN[game.questProgress.actNumber - 1] ?? game.questProgress.actNumber}`
    : '',
)

const layout = computed(() => layoutMap(game.mapPlaces))
const bounds = computed(() => {
  const cols = layout.value.boxes.map((b) => b.col)
  const rows = layout.value.boxes.map((b) => b.row)
  return { col: Math.min(0, ...cols), row: Math.min(0, ...rows) }
})
const size = computed(() => {
  const cols = layout.value.boxes.map((b) => b.col)
  const rows = layout.value.boxes.map((b) => b.row)
  return {
    width: (Math.max(0, ...cols) - bounds.value.col) * COLUMN + BOX_WIDTH,
    height: (Math.max(0, ...rows) - bounds.value.row) * ROW + BOX_HEIGHT,
  }
})

/** Pixel centre of a box on the map. */
function centre(key: string): { x: number; y: number } {
  const box = layout.value.boxes.find((b) => b.key === key)
  if (!box) return { x: 0, y: 0 }
  return {
    x: MARGIN + (box.col - bounds.value.col) * COLUMN + BOX_WIDTH / 2,
    y: MARGIN + (box.row - bounds.value.row) * ROW + BOX_HEIGHT / 2,
  }
}

const boxes = computed(() =>
  layout.value.boxes.map((box) => {
    const c = centre(box.key)
    return {
      ...box,
      reachable: routeTo(game.mapPlaces, box.key) !== null,
      style: {
        left: `${c.x - BOX_WIDTH / 2}px`,
        top: `${c.y - BOX_HEIGHT / 2}px`,
        width: `${BOX_WIDTH}px`,
        height: `${BOX_HEIGHT}px`,
      },
    }
  }),
)
const paths = computed(() =>
  layout.value.paths.map((path) => {
    const from = centre(path.from)
    const to = centre(path.to)
    return {
      ...path,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      tagStyle: {
        left: `${(from.x + to.x) / 2}px`,
        top: `${(from.y + to.y) / 2}px`,
      },
    }
  }),
)

const map = ref<HTMLElement | null>(null)

/**
 * The places wait while the game is busy, and while the voice still reads the
 * move that brought Elior here (the map shows the place he left until then).
 */
const busy = computed(() => !game.acceptInput || game.groupHeld('place'))

/** Press a place: walk there, and the window closes. */
function go(key: string): void {
  if (busy.value) return
  game.travelTo(key)
  emit('close')
}

onMounted(() => {
  void nextTick(() => {
    map.value
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView?.({ block: 'center', inline: 'center' })
  })
})
</script>

<template>
  <LanternDialog title="Map" :eyebrow="eyebrow" wide @close="emit('close')">
    <div class="lq-bigmap-scroll">
      <div
        ref="map"
        class="lq-bigmap"
        :style="{
          width: `${size.width + MARGIN * 2}px`,
          height: `${size.height + MARGIN * 2}px`,
        }"
      >
        <svg
          class="lq-bigmap-paths"
          :width="size.width + MARGIN * 2"
          :height="size.height + MARGIN * 2"
          aria-hidden="true"
        >
          <line
            v-for="path in paths"
            :key="`${path.from}-${path.to}`"
            class="lq-path"
            :class="{ 'lq-dashed': path.dashed }"
            :data-path-to="path.to"
            :x1="path.x1"
            :y1="path.y1"
            :x2="path.x2"
            :y2="path.y2"
          />
        </svg>
        <span
          v-for="path in paths.filter((p) => p.tag)"
          :key="`tag-${path.from}-${path.to}`"
          class="lq-tag"
          data-tag
          :style="path.tagStyle"
          aria-hidden="true"
          >{{ path.tag }}</span
        >
        <template v-for="box in boxes" :key="box.key">
          <div
            v-if="box.current"
            class="lq-place lq-current"
            :data-place="box.name"
            data-current="true"
            :style="box.style"
          >
            <span class="lq-here">You are here</span>
            <span class="lq-name">{{ box.name }}</span>
          </div>
          <button
            v-else
            type="button"
            class="lq-place"
            :class="{ 'lq-unvisited': !box.visited }"
            :data-place="box.name"
            :style="box.style"
            :aria-label="`Go to ${box.name}`"
            :disabled="busy || !box.reachable"
            @click="go(box.key)"
          >
            <span class="lq-name" aria-hidden="true">{{ box.name }}</span>
          </button>
        </template>
      </div>
    </div>
  </LanternDialog>
</template>

<style scoped>
.lq-bigmap-scroll {
  overflow: auto;
  display: flex;
}
.lq-bigmap {
  position: relative;
  flex: none;
  margin: auto;
}
.lq-bigmap-paths {
  position: absolute;
  inset: 0;
}
.lq-path {
  stroke: var(--lq-line);
  stroke-width: 3;
}
.lq-path.lq-dashed {
  stroke: var(--lq-muted);
  stroke-dasharray: 6 6;
}
.lq-tag {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  color: var(--lq-muted);
  font-size: 11px;
  white-space: nowrap;
}
.lq-place {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border-radius: 10px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-raised, var(--lq-surface));
  color: var(--lq-fg);
  font: inherit;
  font-size: 13px;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}
button.lq-place {
  cursor: pointer;
}
button.lq-place:hover:not(:disabled),
button.lq-place:focus-visible {
  background: var(--lq-accent-soft);
  border-color: var(--lq-accent);
}
button.lq-place:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-place.lq-unvisited {
  border-style: dashed;
  border-color: var(--lq-muted);
  color: var(--lq-muted);
  font-style: italic;
}
.lq-current {
  border: 2px solid var(--lq-accent);
  background: var(--lq-accent-soft);
}
.lq-here {
  font-size: 11px;
  font-weight: 600;
  color: var(--lq-accent-text);
}
</style>

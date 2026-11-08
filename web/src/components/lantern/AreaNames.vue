<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  layoutNames,
  nameAt,
  placeNames,
  type NamedSpot,
  type PlacedName,
} from '@/lantern/areaNames'
import type { AreaThing } from '@/lantern/areaThings'
import type { AreaBox } from '@/lantern/roomMotion'
import type { PictureSize, Rect } from '@/lantern/roomMotionScene'

/**
 * The marks and names of what the room's picture can name, laid over the
 * picture (in `StagePicture`'s slot, so they drift with it and stay on what
 * they mark). With `showing`, each placed thing has a small glowing mark at
 * the middle of what is in view and its name beside it (people blue, things
 * that can be picked up green, ways out amber, scenery plain); a name that
 * would cover another name or a button, a plate or the words moves to a free
 * spot with a thin line back to its mark, and a thing under the words has
 * neither until the words are gone. Otherwise the one thing under the
 * `pointer` has its name just under the pointer, above it near the foot. The
 * marks and names fade in and out (not under Reduce motion, which the
 * stylesheet's `--lq-motion` carries), never take a click and are hidden
 * from assistive technology: the room's corner names list what is here.
 * `relayout` is any value that changes when something it keeps clear of
 * moves (the words coming or going).
 */
const props = defineProps<{
  things: AreaThing[]
  boxes: Record<string, AreaBox>
  pictureSize: PictureSize
  showing: boolean
  pointer: { x: number; y: number } | null
  relayout?: unknown
}>()

/** What a name is made of beyond its words: the padding and the border, and about the width of one letter. */
const NAME_PADDING = 22
const LETTER = 7.4
const NAME_HEIGHT = 25
/** How long the words take to fade away (a little over), before what they covered is clear. */
const SETTLE_MS = 350
/** How far under the pointer its name hangs, and the foot of the picture where it hangs above instead. */
const POINTER_GAP = 18
const FOOT = 60
/** The things in the stage that a name keeps clear of. */
const KEEP_CLEAR =
  '.lq-stage-plate, .lq-phone-plate, .lq-stage-buttons button, .lq-float-menu, .lq-words-hide, ' +
  '.lq-paper-tab, .lq-show-names, .lq-composer, .lq-story-wrap'
/** The words over the picture, under which a thing's mark and name wait. */
const WORDS = '.lq-story-wrap'

const root = ref<HTMLElement | null>(null)
const view = ref<PictureSize>({ width: 0, height: 0 })
const obstacles = ref<Rect[]>([])
const covers = ref<Rect[]>([])
let observer: ResizeObserver | undefined

/** The stage this is laid over, or null before it is on the page. */
function stage(): HTMLElement | null {
  return root.value?.closest<HTMLElement>('.lq-stage') ?? null
}

/** The rectangles of the elements of `scope` matching `selector` that are on show, in the pixels of the stage whose corner is `origin`. */
function rectsOf(
  scope: HTMLElement,
  selector: string,
  origin: DOMRect,
): Rect[] {
  const rects: Rect[] = []
  for (const el of scope.querySelectorAll<HTMLElement>(selector)) {
    const box = el.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) continue
    // Words folded away fade out first: they no longer cover anything.
    if (getComputedStyle(el).visibility === 'hidden') continue
    rects.push({
      x: box.left - origin.left,
      y: box.top - origin.top,
      w: box.width,
      h: box.height,
    })
  }
  return rects
}

/** Measure the stage and what the names keep clear of. */
function measure(): void {
  const el = stage()
  if (!el) return
  view.value = { width: el.clientWidth, height: el.clientHeight }
  const scope = el.closest<HTMLElement>('.lq-main') ?? el
  const origin = el.getBoundingClientRect()
  obstacles.value = rectsOf(scope, KEEP_CLEAR, origin)
  covers.value = rectsOf(scope, WORDS, origin)
}

onMounted(() => {
  measure()
  const el = stage()
  if (el && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(measure)
    observer.observe(el)
  }
})
onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(settleTimer)
})
let settleTimer: ReturnType<typeof setTimeout> | undefined
// What the names keep clear of moved: measure again, and once more when what fades has faded.
watch(
  () => [props.relayout, props.showing] as const,
  () => {
    void nextTick(measure)
    clearTimeout(settleTimer)
    settleTimer = setTimeout(measure, SETTLE_MS)
  },
  { flush: 'post' },
)

/** Whether the mark of `entry` lies under the words. */
function underWords(entry: PlacedName): boolean {
  return covers.value.some(
    (r) =>
      entry.x >= r.x &&
      entry.x <= r.x + r.w &&
      entry.y >= r.y &&
      entry.y <= r.y + r.h,
  )
}

/** The placed things in view and not under the words. */
const placed = computed<PlacedName[]>(() => {
  if (view.value.width < 1 || view.value.height < 1) return []
  return placeNames(
    props.things,
    props.boxes,
    view.value,
    props.pictureSize,
  ).filter((entry) => !underWords(entry))
})

/** The size a name is laid out at (one line, never wider than the picture). */
function sizeOf(label: string): { w: number; h: number } {
  return {
    w: Math.min(view.value.width - 8, label.length * LETTER + NAME_PADDING),
    h: NAME_HEIGHT,
  }
}

/** Every mark and name, when they are all showing. */
const spots = computed<NamedSpot[]>(() =>
  props.showing
    ? layoutNames(placed.value, sizeOf, obstacles.value, {
        w: view.value.width,
        h: view.value.height,
      })
    : [],
)

/** The one name that follows the pointer: the thing it is over, when not everything is shown. */
const pointed = computed<{
  label: string
  kind: string
  left: number
  top: number
} | null>(() => {
  if (props.showing || !props.pointer) return null
  const { x, y } = props.pointer
  const entry = nameAt(placed.value, x, y)
  if (!entry) return null
  const { w, h } = sizeOf(entry.label)
  const above = y > view.value.height - FOOT
  return {
    label: entry.label,
    kind: entry.kind,
    left: Math.max(0, Math.min(view.value.width - w, x - w / 2)),
    top: Math.max(
      0,
      Math.min(
        view.value.height - h,
        above ? y - POINTER_GAP - h : y + POINTER_GAP,
      ),
    ),
  }
})
</script>

<template>
  <div ref="root" class="lq-area-names" aria-hidden="true">
    <TransitionGroup name="lq-area">
      <template v-for="spot in spots" :key="spot.areaId">
        <i
          class="lq-area-mark"
          :data-area-mark="spot.areaId"
          :style="{ left: `${spot.x}px`, top: `${spot.y}px` }"
        ></i>
      </template>
    </TransitionGroup>
    <svg
      v-if="spots.some((spot) => spot.leader)"
      class="lq-area-lines"
      :width="view.width"
      :height="view.height"
    >
      <template v-for="spot in spots" :key="spot.areaId">
        <line
          v-if="spot.leader"
          :x1="spot.leader.x1"
          :y1="spot.leader.y1"
          :x2="spot.leader.x2"
          :y2="spot.leader.y2"
        />
      </template>
    </svg>
    <TransitionGroup name="lq-area">
      <span
        v-for="spot in spots"
        :key="spot.areaId"
        class="lq-area-name"
        :class="`lq-area-${spot.kind}`"
        :data-area-name="spot.areaId"
        :style="{ left: `${spot.left}px`, top: `${spot.top}px` }"
        >{{ spot.label }}</span
      >
    </TransitionGroup>
    <span
      v-if="pointed"
      class="lq-area-name lq-area-pointer"
      :class="`lq-area-${pointed.kind}`"
      data-area-pointer
      :style="{ left: `${pointed.left}px`, top: `${pointed.top}px` }"
      >{{ pointed.label }}</span
    >
  </div>
</template>

<style scoped>
.lq-area-names {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lq-area-mark {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: #ffc14d;
  border: 2px solid #fff6e0;
  box-shadow:
    0 0 0 3px rgb(242 158 0 / 0.45),
    0 0 14px 4px rgb(255 190 80 / 0.8);
}
.lq-area-lines {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}
.lq-area-lines line {
  stroke: #fff6e0;
  stroke-width: 1.5;
}
.lq-area-name {
  position: absolute;
  box-sizing: border-box;
  max-width: calc(100% - 8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px 9px;
  border: 1px solid;
  border-radius: 999px;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.lq-area-scenery {
  background: var(--lq-raised);
  color: var(--lq-fg);
  border-color: var(--lq-line);
}
.lq-area-item {
  background: var(--lq-item-soft);
  color: var(--lq-item);
  border-color: var(--lq-item-line);
}
.lq-area-character {
  background: var(--lq-character-soft);
  color: var(--lq-character);
  border-color: var(--lq-character-line);
}
.lq-area-exit {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-color: var(--lq-accent-line);
}
.lq-area-enter-active,
.lq-area-leave-active {
  transition: opacity calc(0.2s * var(--lq-motion)) ease;
}
.lq-area-enter-from,
.lq-area-leave-to {
  opacity: 0;
}
</style>

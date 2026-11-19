<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSizeWatch } from '@/composables/useSizeWatch'
import { placeNames, type PlacedName } from '@/lantern/areaNames'
import type { AreaThing } from '@/lantern/areaThings'
import type { AreaBox } from '@/lantern/roomMotion'
import type { PictureSize } from '@/lantern/roomMotionScene'

/**
 * What can be pressed on the room's picture: one transparent button over each
 * placed person, thing and piece of scenery, and after them one over each
 * open way out, in the layer the marks and names are drawn in, so it
 * drifts with the picture. The buttons are for the pointer and the finger:
 * they are never Tab stops (a player at the keyboard has F1 and the typing
 * box), and taking focus shows nothing, neither a box nor a mark, since the
 * names come in only when the player moves over the picture, taps it or presses a key. They read
 * their thing's name as a menu opener; where one thing lies on another the
 * smaller lies over, so a press goes to it. A press says which thing and where
 * (the screen's pixels); one made by a key on a thing that holds focus, as
 * when a ring closes and gives it back, opens at the middle of the thing. The
 * words and buttons over the picture cover it as they cover the picture.
 * A way out is a plain button, "Go <direction> to <place>" (as the Map's), for
 * a screen reader to find; it takes no pointer (the marks, names and painted
 * places already take the presses of the sighted) and carries `data-way`, so
 * the click a screen reader makes is the stage's press on that way: it walks
 * there at once and opens no ring.
 */
const props = defineProps<{
  things: AreaThing[]
  boxes: Record<string, AreaBox>
  pictureSize: PictureSize
}>()
const emit = defineEmits<{
  press: [thing: AreaThing, at: { x: number; y: number }]
}>()

const root = ref<HTMLElement | null>(null)
const view = ref<PictureSize>({ width: 0, height: 0 })
function measure(): void {
  if (!root.value) return
  view.value = {
    width: root.value.clientWidth,
    height: root.value.clientHeight,
  }
}
/** Measure when the layer's size is reported (inside the report: it writes only its own state). */
const sizeWatch = useSizeWatch(measure, { inReport: true })
onMounted(() => {
  measure()
  if (root.value) sizeWatch.observe(root.value)
})

/** The things that can be pressed and are in view, left to right, each with its stacking: smaller over larger. */
const stops = computed(() => {
  if (view.value.width < 1 || view.value.height < 1) return []
  const placed: PlacedName[] = placeNames(
    props.things,
    props.boxes,
    view.value,
    props.pictureSize,
  )
  const bySize = [...placed].sort(
    (a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h,
  )
  const leftToRight = (list: PlacedName[]): PlacedName[] =>
    [...list].sort((a, b) => a.rect.x - b.rect.x)
  return [
    ...leftToRight(placed.filter((entry) => entry.kind !== 'exit')),
    ...leftToRight(placed.filter((entry) => entry.kind === 'exit')),
  ].map((entry) => ({ entry, layer: bySize.indexOf(entry) + 1 }))
})

/** What a screen reader hears for a stop: a thing's name, or where a way out goes. */
function labelOf(entry: PlacedName): string {
  return entry.kind === 'exit'
    ? `Go ${entry.direction ?? ''} to ${entry.place ?? ''}`
    : entry.label
}

/** A press or a key on a thing; a key (no pointer, `detail` 0) opens at the middle of the thing. */
function onClick(entry: PlacedName, event: MouseEvent): void {
  const byKey = event.detail === 0
  const el =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  const box = el?.getBoundingClientRect()
  const at =
    byKey && box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: event.clientX, y: event.clientY }
  const { x: _x, y: _y, rect: _rect, ...thing } = entry
  emit('press', thing, at)
}
</script>

<template>
  <div ref="root" class="lq-area-press">
    <button
      v-for="stop in stops"
      :key="stop.entry.areaId"
      type="button"
      class="lq-area-press-hit"
      :data-area-press="stop.entry.areaId"
      :class="{ 'lq-area-press-way': stop.entry.kind === 'exit' }"
      :data-way="stop.entry.kind === 'exit' ? stop.entry.direction : undefined"
      :aria-label="labelOf(stop.entry)"
      :aria-haspopup="stop.entry.kind === 'exit' ? undefined : 'menu'"
      tabindex="-1"
      :style="{
        left: `${stop.entry.rect.x}px`,
        top: `${stop.entry.rect.y}px`,
        width: `${stop.entry.rect.w}px`,
        height: `${stop.entry.rect.h}px`,
        zIndex: stop.layer /* local */,
      }"
      @click="stop.entry.kind === 'exit' || onClick(stop.entry, $event)"
    ></button>
  </div>
</template>

<style scoped>
.lq-area-press {
  position: absolute;
  inset: 0;
  /* Under the marks and names (which are above it), so a press on one is theirs. */
  z-index: 1; /* local */
  pointer-events: none;
}
.lq-area-press-hit {
  position: absolute;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}
/* A way out takes no pointer: the sighted press its marks, names and painted places. */
.lq-area-press-way {
  pointer-events: none;
}
/* Focus draws no box round the thing: the picture shows only the names asked for. */
.lq-area-press-hit:focus {
  outline: none;
}
</style>

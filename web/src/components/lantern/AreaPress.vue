<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { placeNames, type PlacedName } from '@/lantern/areaNames'
import type { AreaThing } from '@/lantern/areaThings'
import type { AreaBox } from '@/lantern/roomMotion'
import type { PictureSize } from '@/lantern/roomMotionScene'

/**
 * What can be pressed on the room's picture: one transparent button over each
 * placed person, thing and piece of scenery (not ways out, which are their
 * own piece of work), in the layer the marks and names are drawn in, so it
 * drifts with the picture. The buttons are always Tab stops, left to right,
 * and read their thing's name as a menu opener; where one thing lies on
 * another the smaller lies over, so a press goes to it. A press says which
 * thing, where (the screen's pixels) and whether a key made it; focus says
 * which thing has it, for the marks and names to show it. The words and
 * buttons over the picture cover it as they cover the picture.
 */
const props = defineProps<{
  things: AreaThing[]
  boxes: Record<string, AreaBox>
  pictureSize: PictureSize
}>()
const emit = defineEmits<{
  press: [thing: AreaThing, at: { x: number; y: number }]
  focused: [areaId: string | null]
}>()

const root = ref<HTMLElement | null>(null)
const view = ref<PictureSize>({ width: 0, height: 0 })
let observer: ResizeObserver | undefined

function measure(): void {
  if (!root.value) return
  view.value = {
    width: root.value.clientWidth,
    height: root.value.clientHeight,
  }
}
onMounted(() => {
  measure()
  if (root.value && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(measure)
    observer.observe(root.value)
  }
})
onUnmounted(() => observer?.disconnect())

/** The things that can be pressed and are in view, left to right, each with its stacking: smaller over larger. */
const stops = computed(() => {
  if (view.value.width < 1 || view.value.height < 1) return []
  const placed: PlacedName[] = placeNames(
    props.things.filter((thing) => thing.kind !== 'exit'),
    props.boxes,
    view.value,
    props.pictureSize,
  )
  const bySize = [...placed].sort(
    (a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h,
  )
  return [...placed]
    .sort((a, b) => a.rect.x - b.rect.x)
    .map((entry) => ({ entry, layer: bySize.indexOf(entry) + 1 }))
})

/**
 * A thing took focus: its mark and name show when a key put focus there, not
 * when a press did (the mark would then lie under the pointer and take the click).
 */
function onFocus(areaId: string, event: FocusEvent): void {
  const el =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  let byKey: boolean
  try {
    byKey = el?.matches(':focus-visible') ?? true
  } catch {
    byKey = true
  }
  if (byKey) emit('focused', areaId)
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
      :aria-label="stop.entry.label"
      aria-haspopup="menu"
      :style="{
        left: `${stop.entry.rect.x}px`,
        top: `${stop.entry.rect.y}px`,
        width: `${stop.entry.rect.w}px`,
        height: `${stop.entry.rect.h}px`,
        zIndex: stop.layer,
      }"
      @click="onClick(stop.entry, $event)"
      @focus="onFocus(stop.entry.areaId, $event)"
      @blur="emit('focused', null)"
    ></button>
  </div>
</template>

<style scoped>
.lq-area-press {
  position: absolute;
  inset: 0;
  /* Under the marks and names (which are above it), so a press on one is theirs. */
  z-index: 1;
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
.lq-area-press-hit:focus-visible {
  outline: 3px solid var(--lq-accent);
  outline-offset: 2px;
}
</style>

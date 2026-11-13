<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  clearOfPanels,
  clearOfWords,
  hangName,
  keepMarksApart,
  layoutNames,
  markInside,
  nameAt,
  placeNames,
  pressAt,
  visiblePart,
  type HungName,
  type NamedSpot,
  type PlacedName,
  type WayPress,
} from '@/lantern/areaNames'
import { obstacleElements, readObstacles } from '@/lantern/obstacles'
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
 * spot with a thin line back to its mark, and a thing under the words (the
 * narrator's cards and spoken lines where they are seen, not the empty rest of
 * their column) has its mark stepped just outside them, straight above or
 * below (on their nearest edge, half over them, where no free picture lies
 * near), and hiding the words puts it back on its thing. A mark whose spot lies under the room
 * plate, a button in the picture's corner, the story's Hide/Show tab or the
 * Show what's here button steps to the nearest spot just outside that panel
 * (out from under the words when it can; its name and line follow it, and a
 * press on it is a press on its thing), so no mark is ever hidden; the plate
 * growing or folding moves it at once. Otherwise the one thing under the `pointer` has its name just under
 * the pointer, above it near the foot of what can be seen, and has none while a ring is open (`ringOpen`): the ring
 * has the name. Marks and names stay on the part of the picture that can
 * be seen at every moment of its drift, above the `footCover` pixels the
 * action bar lies over; a thing wholly outside that part has neither. The
 * marks and names fade in and out (not under Reduce motion, which the
 * stylesheet's `--lq-motion` carries) and are hidden from assistive
 * technology (the room's corner names list what is here, and `AreaPress` has
 * the Tab stops). A mark or name of something that can be pressed takes a
 * press as a press on its thing (`press`); one of a way out goes the way out (below). The
 * thing with keyboard focus (`focused`) has its mark and name showing even
 * when not all are, and the pointer on that same thing adds no second name.
 * While the words are open a name keeps within about 150px of its dot with its
 * line off the words; one with no free spot there is left off (its dot stays
 * and is named like a pointed or focused thing).
 * `relayout` is any value that changes when something it keeps clear of
 * moves (the words coming or going); the story scrolling its words lays the
 * marks out again too, so a dot kept clear of a card stays clear as it scrolls.
 *
 * `spotAt` says which showing mark a screen point rests on, so a mark under a
 * card's faded edge (which takes the pointer) can still be pointed at and pressed.
 *
 * Ways out can be pressed. `wayAt` says which way a screen point presses (the
 * smallest named thing or open way under it; a closed way, one of
 * `closedWays` that the studio placed, only where nothing named is), and the
 * marks and names of open ways take the press themselves (`data-way`, the one
 * place this layer takes a click). `pointing` says the direction of the open
 * way under the `pointer`, or null, for the pointer's arrow; a closed way is
 * plain painting and never points. Nothing else here is pressable.
 */
const props = defineProps<{
  things: AreaThing[]
  boxes: Record<string, AreaBox>
  pictureSize: PictureSize
  showing: boolean
  /** The pointer over the picture, in the screen's pixels (client coordinates). */
  pointer: { x: number; y: number } | null
  /** Placed ways out that are closed right now: no mark, no name, they only answer a press. */
  closedWays?: AreaThing[]
  /** How many pixels at the stage's foot lie over the picture (the action bar). */
  footCover?: number
  /** The thing that has keyboard focus: its mark and name show whether or not all are. */
  focused?: string | null
  /** A ring is open, with the name of its thing in the middle: the pointer has no name of its own. */
  ringOpen?: boolean
  relayout?: unknown
}>()
const emit = defineEmits<{
  pointing: [direction: string | null]
  press: [thing: AreaThing, at: { x: number; y: number }, onMark: true]
}>()

/** What a name is made of beyond its words: the padding and the border, and about the width of one letter. */
const NAME_PADDING = 22
const LETTER = 7.4
const NAME_HEIGHT = 25
/** How long the words take to fade away (a little over), before what they covered is clear. */
const SETTLE_MS = 350
/** How near a dot the pointer must be to point at it. */
const DOT_HIT = 14
const root = ref<HTMLElement | null>(null)
const view = ref<PictureSize>({ width: 0, height: 0 })
const obstacles = ref<Rect[]>([])
const covers = ref<Rect[]>([])
/** The panels (plate, corner buttons, the story's Hide/Show tab and the Show what's here button) the marks keep clear of. */
const panels = ref<Rect[]>([])
/** The panel elements the observer is watching, so a plate that grows or folds moves the marks at once. */
let watched: HTMLElement[] = []
let observer: ResizeObserver | undefined
/** Where scrolling is listened for (the scope `measure` reads), once on the page. */
let scrolled: HTMLElement | null = null
/** The frame a scroll's measure waits for, so a scroll measures once a frame. */
let scrollFrame: number | undefined

/** The stage this is laid over, or null before it is on the page. */
function stage(): HTMLElement | null {
  return root.value?.closest<HTMLElement>('.lq-stage') ?? null
}

/**
 * Where the names' own pixels start: the corner of the layer they are drawn in
 * (which drifts and is a little larger than the stage at the drift's peak) and
 * how much larger a screen pixel is than one of theirs' (1 when not scaled).
 */
function frameOf(): { left: number; top: number; ratio: number } {
  const el = root.value
  if (!el) return { left: 0, top: 0, ratio: 1 }
  const box = el.getBoundingClientRect()
  const ratio =
    box.width > 0 && el.clientWidth > 0 ? box.width / el.clientWidth : 1
  return { left: box.left, top: box.top, ratio }
}

/** Measure the layer and what the names keep clear of. */
function measure(): void {
  const el = stage()
  if (!el || !root.value) return
  view.value = {
    width: root.value.clientWidth,
    height: root.value.clientHeight,
  }
  const scope = el.closest<HTMLElement>('.lq-main') ?? el
  // Whatever lies over the picture says so itself (`data-lq-obstacle`); the cards only where their story shows them.
  const read = readObstacles(scope, frameOf())
  covers.value = read.words
  obstacles.value = read.all
  panels.value = read.panels
  watchPanels(scope)
}

/**
 * The words (or anything else in the scope) scrolled: measure again at the next
 * frame. This holds while not showing too, since the focused thing's dot is
 * stepped clear of the words then as well.
 */
function onScroll(): void {
  if (scrollFrame !== undefined) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = undefined
    measure()
  })
}

/** Watch the size of every element marked as lying over the picture, which `ResizeObserver` on the stage does not see. */
function watchPanels(scope: HTMLElement): void {
  if (!observer) return
  const now = obstacleElements(scope)
  for (const el of watched) if (!now.includes(el)) observer.unobserve(el)
  for (const el of now) if (!watched.includes(el)) observer.observe(el)
  watched = now
}

onMounted(() => {
  measure()
  // Words folded away while the stage was gone (the picture coming back) are
  // still fading out now: once they have faded they no longer cover anything.
  settleTimer = setTimeout(measure, SETTLE_MS)
  const el = stage()
  // Scroll events do not bubble: listen in the capture phase for the story's own.
  scrolled = el?.closest<HTMLElement>('.lq-main') ?? el
  scrolled?.addEventListener('scroll', onScroll, {
    capture: true,
    passive: true,
  })
  if (el && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(measure)
    observer.observe(el)
    // The layer itself: it may have no size yet when it is put on the page.
    if (root.value) observer.observe(root.value)
  }
})
onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(settleTimer)
  scrolled?.removeEventListener('scroll', onScroll, { capture: true })
  if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame)
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

/** The placed things in view of the picture. */
const inView = computed<PlacedName[]>(() => {
  if (view.value.width < 1 || view.value.height < 1) return []
  return placeNames(props.things, props.boxes, view.value, props.pictureSize)
})

/** The part of the layer that can be seen: where every mark and name goes. */
const visible = computed<Rect>(() =>
  visiblePart(view.value, props.footCover ?? 0),
)

/**
 * The placed things with a part that can be seen, their marks stepped clear of
 * the panels and of the words (just outside them, or on their nearest edge
 * where no free picture lies near) and kept apart from each other.
 */
const placed = computed<PlacedName[]>(() =>
  keepMarksApart(
    clearOfWords(
      clearOfPanels(
        markInside(inView.value, visible.value),
        panels.value,
        visible.value,
        covers.value,
      ),
      covers.value,
      panels.value,
      visible.value,
    ),
    panels.value,
    visible.value,
    covers.value,
  ),
)

/** The closed ways that are placed and in view. */
const closedInView = computed<PlacedName[]>(() => {
  if (view.value.width < 1 || view.value.height < 1) return []
  return placeNames(
    props.closedWays ?? [],
    props.boxes,
    view.value,
    props.pictureSize,
  )
})

/** The way a press at the screen point (`clientX`, `clientY`) goes, or null. */
function wayAt(clientX: number, clientY: number): WayPress | null {
  const frame = frameOf()
  return pressAt(
    inView.value,
    closedInView.value,
    (clientX - frame.left) / frame.ratio,
    (clientY - frame.top) / frame.ratio,
  )
}

/**
 * The mark the screen point (`clientX`, `clientY`) rests on while every mark is
 * showing, or null. A mark stepped onto the edge of the words can lie under a
 * card's faded edge, where it shows through but the card takes the pointer:
 * the layout asks this to point at it and to take a press on it as a press on
 * its thing, the same area as any other mark.
 */
function spotAt(clientX: number, clientY: number): NamedSpot | null {
  if (!props.showing) return null
  const frame = frameOf()
  const x = (clientX - frame.left) / frame.ratio
  const y = (clientY - frame.top) / frame.ratio
  return (
    spots.value.find((s) => Math.hypot(s.x - x, s.y - y) <= DOT_HIT) ?? null
  )
}
defineExpose({ wayAt, spotAt })

/** The direction of the open way under the pointer, for its arrow. */
const pointing = computed<string | null>(() => {
  if (!props.pointer) return null
  const way = wayAt(props.pointer.x, props.pointer.y)
  return way?.open ? way.direction : null
})
watch(pointing, (direction) => emit('pointing', direction))

/** The size a name is laid out at (one line, never wider than what can be seen). */
function sizeOf(label: string): { w: number; h: number } {
  return {
    w: Math.min(visible.value.w, label.length * LETTER + NAME_PADDING),
    h: NAME_HEIGHT,
  }
}

/** The words in view while they are open (a name keeps near its dot and its line off them), else nothing. */
const wordsOpen = computed<Rect[] | undefined>(() =>
  covers.value.length > 0 ? covers.value : undefined,
)

/** Every placed mark with its name, or left off when the words are open and no free spot lies near it. */
const allSpots = computed<NamedSpot[]>(() =>
  layoutNames(
    placed.value,
    sizeOf,
    obstacles.value,
    visible.value,
    wordsOpen.value,
  ),
)

/** Every mark and name when they are all showing, else those of the thing with focus. */
const spots = computed<NamedSpot[]>(() => {
  if (!props.showing && !props.focused) return []
  const all = allSpots.value
  if (props.showing) return all
  return all.filter((spot) => spot.areaId === props.focused)
})

/** The spots that have a name drawn (those not left off). */
const named = computed<NamedSpot[]>(() =>
  spots.value.filter((spot) => !spot.leftOff),
)

/** A press on a mark or name is a press on its thing; a way out's press is the stage's (`wayAt`), so it is let through. */
function press(spot: NamedSpot, event: MouseEvent): void {
  if (spot.kind === 'exit') return
  emit(
    'press',
    {
      areaId: spot.areaId,
      name: spot.name,
      label: spot.label,
      kind: spot.kind,
    },
    { x: event.clientX, y: event.clientY },
    true,
  )
}

/**
 * A name hung at (`x`, `y`): under it, or above it near the foot of what can be seen, in the first spot clear of
 * the cards, panels and every name already showing (`hangName`); with none beside it, the nearest clear spot with a
 * line back to the dot; with none at all it hangs beside the dot, off the panels where it can, and the names it lies over fade back (`covers`).
 */
function hangAt(
  entry: { label: string; kind: string },
  x: number,
  y: number,
): Hung {
  const hung = hangName(
    sizeOf(entry.label),
    { x, y },
    obstacles.value,
    named.value.map((s) => ({
      areaId: s.areaId,
      rect: { x: s.left, y: s.top, w: s.width, h: s.height },
    })),
    visible.value,
    panels.value,
  )
  return { label: entry.label, kind: entry.kind, ...hung }
}

/** A revealed name with its place, the line back to its dot and the shown names it lies over. */
type Hung = { label: string; kind: string } & HungName

/**
 * The one name that hangs by the pointer: the thing it is over, when not
 * everything is shown (or, while everything is shown, when that thing's name is
 * left off for want of room near it), no ring is open and that thing is not
 * already named for having focus. A focused thing whose name is left off is
 * named the same way, under its dot, and while it is the focused thing's name
 * that is shown the pointer adds none (one name hangs at a time).
 */
const pointed = computed<Hung | null>(() => {
  const focus = props.focused
    ? spots.value.find((s) => s.areaId === props.focused && s.leftOff)
    : undefined
  if (focus && !props.ringOpen) return hangAt(focus, focus.x, focus.y)
  if (props.ringOpen || !props.pointer) return null
  const frame = frameOf()
  const x = (props.pointer.x - frame.left) / frame.ratio
  const y = (props.pointer.y - frame.top) / frame.ratio
  if (props.showing) {
    // Every name is up: only a left-off one is wanted, found by its dot (which may have stepped out of its thing's box).
    const dot = allSpots.value.find(
      (s) => s.leftOff && Math.hypot(s.x - x, s.y - y) <= DOT_HIT,
    )
    return dot && dot.areaId !== props.focused
      ? hangAt(dot, dot.x, dot.y)
      : null
  }
  const entry = nameAt(inView.value, x, y)
  if (!entry || entry.areaId === props.focused) return null
  return hangAt(entry, x, y)
})
</script>

<template>
  <div ref="root" class="lq-area-names" aria-hidden="true">
    <TransitionGroup name="lq-area">
      <template v-for="spot in spots" :key="spot.areaId">
        <i
          class="lq-area-mark"
          :data-area-mark="spot.areaId"
          :data-way="spot.direction"
          :class="{
            'lq-area-way': spot.direction,
            'lq-area-live': showing && !spot.direction,
          }"
          :style="{ left: `${spot.x}px`, top: `${spot.y}px` }"
          @click="press(spot, $event)"
        ></i>
      </template>
    </TransitionGroup>
    <svg
      v-if="spots.some((spot) => spot.leader) || pointed?.leader"
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
          :class="{ 'lq-area-faded': pointed?.covers.includes(spot.areaId) }"
        />
      </template>
      <line
        v-if="pointed?.leader"
        :x1="pointed.leader.x1"
        :y1="pointed.leader.y1"
        :x2="pointed.leader.x2"
        :y2="pointed.leader.y2"
        data-area-pointer-line
      />
    </svg>
    <TransitionGroup name="lq-area">
      <span
        v-for="spot in named"
        :key="spot.areaId"
        class="lq-area-name"
        :class="[
          `lq-area-${spot.kind}`,
          {
            'lq-area-way': spot.direction,
            'lq-area-live': showing && !spot.direction,
            'lq-area-faded': pointed?.covers.includes(spot.areaId),
          },
        ]"
        :data-area-name="spot.areaId"
        :data-way="spot.direction"
        :style="{
          left: `${spot.left}px`,
          top: `${spot.top}px`,
          maxWidth: `${visible.w}px`,
        }"
        @click="press(spot, $event)"
        >{{ spot.label }}</span
      >
    </TransitionGroup>
    <span
      v-if="pointed"
      class="lq-area-name lq-area-pointer"
      :class="`lq-area-${pointed.kind}`"
      data-area-pointer
      :style="{
        left: `${pointed.left}px`,
        top: `${pointed.top}px`,
        maxWidth: `${visible.w}px`,
      }"
      >{{ pointed.label }}</span
    >
  </div>
</template>

<style scoped>
.lq-area-names {
  position: absolute;
  inset: 0;
  z-index: 2;
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
.lq-area-way {
  pointer-events: auto;
}
.lq-area-live {
  pointer-events: auto;
  cursor: pointer;
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
.lq-area-faded {
  opacity: 0;
  pointer-events: none;
}
.lq-area-name,
.lq-area-lines line {
  transition: opacity calc(0.2s * var(--lq-motion)) ease;
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

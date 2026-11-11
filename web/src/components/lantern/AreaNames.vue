<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  clearOfPanels,
  clearOfWords,
  keepMarksApart,
  layoutNames,
  markInside,
  nameAt,
  placeNames,
  pressAt,
  visiblePart,
  type NamedSpot,
  type PlacedName,
  type WayPress,
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
 * moves (the words coming or going).
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
/** How far under the pointer its name hangs, and how near the foot of what can be seen it hangs above instead. */
const POINTER_GAP = 18
const FOOT = 60
/** The room a hung name keeps round it from a card or panel when it can. */
const HANG_ROOM = 3
/** How near a dot the pointer must be to point at it. */
const DOT_HIT = 14
/** The things in the stage that a name keeps clear of. */
const KEEP_CLEAR =
  '.lq-stage-plate, .lq-phone-plate, .lq-stage-buttons button, .lq-float-menu, .lq-words-hide, ' +
  '.lq-paper-tab, .lq-show-names, .lq-composer, .lq-arrival-card, .lq-ln'
/** The panels no mark may lie under: the room plate, the buttons in the picture's top-right corner, the story's Hide/Show tab and the Show what's here button. */
const PANELS =
  '.lq-stage-plate, .lq-phone-plate, .lq-stage-buttons button, .lq-words-hide, .lq-paper-tab, ' +
  '.lq-show-names'
/** The words over the picture beside the narrator's cards, under which a thing's mark and name wait. */
const WORDS = '.lq-arrival-card, .lq-ln, .lq-more-below, .lq-narration-hint'
/** The narrator's cards and the one column's spoken lines, each seen only where its scrolling story shows it. */
const CARDS = '.lq-story-wrap .lq-card, .lq-story-wrap .lq-line'

const root = ref<HTMLElement | null>(null)
const view = ref<PictureSize>({ width: 0, height: 0 })
const obstacles = ref<Rect[]>([])
const covers = ref<Rect[]>([])
/** The panels (plate, corner buttons, the story's Hide/Show tab and the Show what's here button) the marks keep clear of. */
const panels = ref<Rect[]>([])
/** The panel elements the observer is watching, so a plate that grows or folds moves the marks at once. */
let watched: HTMLElement[] = []
let observer: ResizeObserver | undefined

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

/**
 * The rectangles of the elements of `scope` matching `selector` that are on
 * show, in the names' pixels; with `clipTo`, each only where its nearest
 * ancestor matching `clipTo` shows it (a card scrolled partly out of its story).
 */
function rectsOf(
  scope: HTMLElement,
  selector: string,
  clipTo?: string,
): Rect[] {
  const frame = frameOf()
  const rects: Rect[] = []
  for (const el of scope.querySelectorAll<HTMLElement>(selector)) {
    let box: { left: number; top: number; right: number; bottom: number } =
      el.getBoundingClientRect()
    const clip = clipTo ? el.closest<HTMLElement>(clipTo) : null
    if (clip) {
      const by = clip.getBoundingClientRect()
      box = {
        left: Math.max(box.left, by.left),
        top: Math.max(box.top, by.top),
        right: Math.min(box.right, by.right),
        bottom: Math.min(box.bottom, by.bottom),
      }
    }
    const width = box.right - box.left
    const height = box.bottom - box.top
    if (width < 1 || height < 1) continue
    // Words folded away fade out first: they no longer cover anything.
    if (getComputedStyle(el).visibility === 'hidden') continue
    rects.push({
      x: (box.left - frame.left) / frame.ratio,
      y: (box.top - frame.top) / frame.ratio,
      w: width / frame.ratio,
      h: height / frame.ratio,
    })
  }
  return rects
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
  covers.value = [
    ...rectsOf(scope, CARDS, '.lq-story'),
    ...rectsOf(scope, WORDS),
  ]
  // The cards and spoken lines where they are seen, not the empty rest of their column.
  obstacles.value = [...rectsOf(scope, KEEP_CLEAR), ...covers.value]
  panels.value = rectsOf(scope, PANELS)
  watchPanels(scope)
}

/** Watch the panels' own size, which `ResizeObserver` on the stage does not see. */
function watchPanels(scope: HTMLElement): void {
  if (!observer) return
  const now = [...scope.querySelectorAll<HTMLElement>(PANELS)]
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
defineExpose({ wayAt })

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
 * A name hung at (`x`, `y`): under it, or above it near the foot of what can be seen. Where that spot lies on a
 * card or a panel (a dot boxed in between the room plate and the cards), the other side of the dot is tried, then
 * beside it (nudged up or down to fit a narrow gap), so the name is not hung behind the words. With no clear
 * spot it hangs where it lies least on cards and panels.
 */
function hangAt(
  entry: { label: string; kind: string },
  x: number,
  y: number,
): { label: string; kind: string; left: number; top: number } {
  const { w, h } = sizeOf(entry.label)
  const { x: left, y: top, w: across, h: down } = visible.value
  const above = y > top + down - FOOT
  const pin = (l: number, t: number): { left: number; top: number } => ({
    left: Math.max(left, Math.min(left + across - w, l)),
    top: Math.max(top, Math.min(top + down - h, t)),
  })
  const centred = x - w / 2
  const aboveTop = y - POINTER_GAP - h
  const belowTop = y + POINTER_GAP
  const beside = y - h / 2
  // Slid in steps of 2px so a gap only a little taller than the name is still found.
  const slides = [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12]
  const tries = [
    pin(centred, above ? aboveTop : belowTop),
    pin(centred, above ? belowTop : aboveTop),
    ...slides.map((d) => pin(x + POINTER_GAP, beside + d)),
    ...slides.map((d) => pin(x - POINTER_GAP - w, beside + d)),
  ]
  // How much of the name, grown by `pad` on every side, lies on a card or panel.
  const covered = (at: { left: number; top: number }, pad: number): number =>
    obstacles.value.reduce((sum, o) => {
      const across =
        Math.min(at.left + w + pad, o.x + o.w) - Math.max(at.left - pad, o.x)
      const down =
        Math.min(at.top + h + pad, o.y + o.h) - Math.max(at.top - pad, o.y)
      return across > 0 && down > 0 ? sum + across * down : sum
    }, 0)
  // The first spot clear with a little room round it; else the first clear edge to edge (a narrow gap must still
  // fit the name); else the one that lies least on cards and panels.
  const best =
    tries.find((t) => covered(t, HANG_ROOM) === 0) ??
    tries.find((t) => covered(t, 0) === 0) ??
    tries.reduce((a, b) => (covered(b, 0) < covered(a, 0) ? b : a))
  return { label: entry.label, kind: entry.kind, ...best }
}

/**
 * The one name that hangs by the pointer: the thing it is over, when not
 * everything is shown (or, while everything is shown, when that thing's name is
 * left off for want of room near it), no ring is open and that thing is not
 * already named for having focus. A focused thing whose name is left off is
 * named the same way, under its dot, and while it is the focused thing's name
 * that is shown the pointer adds none (one name hangs at a time).
 */
const pointed = computed<{
  label: string
  kind: string
  left: number
  top: number
} | null>(() => {
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
        v-for="spot in named"
        :key="spot.areaId"
        class="lq-area-name"
        :class="[
          `lq-area-${spot.kind}`,
          {
            'lq-area-way': spot.direction,
            'lq-area-live': showing && !spot.direction,
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
.lq-area-enter-active,
.lq-area-leave-active {
  transition: opacity calc(0.2s * var(--lq-motion)) ease;
}
.lq-area-enter-from,
.lq-area-leave-to {
  opacity: 0;
}
</style>

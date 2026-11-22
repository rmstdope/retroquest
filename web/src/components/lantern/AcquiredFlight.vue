<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import BeltFace from './BeltFace.vue'
import { displayName } from '@/lantern/displayName'
import {
  FLIGHT_FLY_MS,
  LEAVE_RISE_MS,
  LEAVE_SINK_MS,
  flightLabel,
  useFlightStore,
} from '@/stores/useFlightStore'

/**
 * A thing the player has just gained, flown from the picture to its button
 * (`useFlightStore` keeps the queue and the clock): only its picture, the very
 * face the Bag or Spells list then shows (its first letter until the picture
 * is made), comes up where the thing lay in the picture (its pressable box, `data-area-press`), else in the
 * middle of the picture, rests, then shrinks and flies into the Bag or Spells button
 * (or tab on a phone) that carries `data-flight-target` of its kind and is
 * shown. On the belt of pictures it lands on its own picture
 * (`data-belt-pic`) when it is already there (one more of a counted thing)
 * and in view along the belt, else on the tiny button of its kind; the list
 * takes the thing in as it lands (`useFlightStore.owe`). Where the flight starts and lands is measured when it starts and
 * when it flies. Under Reduce motion it does not move: it is shown, then
 * at its button. An item the turn lost goes the other way, in warm grey with a
 * minus sign: it rises out of the Bag button (or tab) to the middle of the
 * picture, rests, then sinks and fades; it starts at the Bag button, or on the
 * picture if no button is shown. A screen reader hears "Lost …", "Gained …" or
 * "Learned …" for every change as it is queued, whether or not it gets to fly.
 */
const flights = useFlightStore()

/** A point on the screen. */
interface Point {
  x: number
  y: number
}

const start = ref<Point>({ x: 0, y: 0 })
const end = ref<Point>({ x: 0, y: 0 })
/** The flight in hand has come up (its first frame is drawn small and clear). */
const entered = ref(false)
/** What the screen reader is told about the newest flight. */
const announcement = ref('')
let enterTimer: ReturnType<typeof setTimeout> | undefined
let tellTimer: ReturnType<typeof setTimeout> | undefined
/** How long the announcement stays empty before the next one, so a screen reader tells a repeat. */
const ANNOUNCE_GAP_MS = 50

/** The centre of an element that is shown, else null. */
function centre(element: Element | null): Point | null {
  if (!element) return null
  const box = element.getBoundingClientRect()
  if (box.width === 0 && box.height === 0) return null
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/** The first letter of the name, which stands in for the picture until it is made (as on the belt). */
const letter = computed(() =>
  flights.current
    ? displayName(flights.current.name).charAt(0).toUpperCase()
    : '',
)

/** The name as the story shows it, with how many when more than one. */
const label = computed(() =>
  flights.current ? flightLabel(flights.current) : '',
)

/** The most letters of both names that share one line on the change card. */
const ONE_LINE_LETTERS = 28
/** The window width (px) below which the change card always stacks its names. */
const NARROW_WINDOW_PX = 520

/** A change card's old name, as the story shows it; empty for any other flight. */
const was = computed(() =>
  flights.current?.from ? displayName(flights.current.from) : '',
)

/** Whether the change card stacks the old name above the new one: a narrow window, or names too long for one line. */
const stacked = computed(
  () =>
    window.innerWidth < NARROW_WINDOW_PX ||
    was.value.length + label.value.length > ONE_LINE_LETTERS,
)

// A new flight comes up in the middle of the picture.
watch(
  () => flights.current?.key,
  (key) => {
    clearTimeout(enterTimer)
    entered.value = false
    const flight = flights.current
    if (key === undefined || !flight) return
    start.value = centre(document.querySelector('.lq-stage-picture')) ?? {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    // A thing that lay in the picture comes up where it lay, if its spot is marked and shown.
    const lay = flight.areaId
      ? centre(document.querySelector(`[data-area-press="${flight.areaId}"]`))
      : null
    if (lay) start.value = lay
    end.value = start.value
    // A loss rises from its button; with none shown, it starts on the picture.
    if (flight.leaving) {
      start.value =
        Array.from(document.querySelectorAll('[data-flight-target="item"]'))
          .map(centre)
          .find((point): point is Point => point !== null) ?? end.value
    }
    enterTimer = setTimeout(() => {
      entered.value = true
    }, 20)
  },
  // Sync: it measures where the thing lay before the room picture lets the thing go (the same moment).
  { immediate: true, flush: 'sync' },
)

// Every gain is told as it is queued, whether or not it gets to fly; emptied
// first, so the same gain twice in a row is told twice. Drawn anew (the stage
// came back), it does not tell earlier gains again.
watch(
  () => flights.told,
  (told) => {
    announcement.value = ''
    clearTimeout(tellTimer)
    if (!told.length) return
    tellTimer = setTimeout(() => {
      announcement.value = told.join('. ')
    }, ANNOUNCE_GAP_MS)
  },
)

// It flies to the shown button of its kind (or stays where it is, if none is shown).
watch(
  () => [flights.current?.key, flights.phase] as const,
  ([key, phase]) => {
    const flight = flights.current
    if (key === undefined || !flight || phase !== 'fly') return
    // To its own picture on the belt (a changed thing's pocket keeps its old name until it lands) when that is in view, else to the tiny button of its kind.
    const own = Array.from(document.querySelectorAll('[data-belt-pic]')).find(
      (el) =>
        el instanceof HTMLElement &&
        el.dataset.beltPic === `${flight.kind}:${flight.from ?? flight.name}`,
    )
    const strip = own?.closest('.lq-belt-strip')?.getBoundingClientRect()
    const spot = centre(own ?? null)
    const inView =
      spot && strip ? spot.x >= strip.left && spot.x <= strip.right : false
    const targets = document.querySelectorAll(
      `[data-flight-target="${flight.kind}"]`,
    )
    end.value =
      (inView ? spot : null) ??
      Array.from(targets)
        .map(centre)
        .find((point): point is Point => point !== null) ??
      start.value
  },
  // Drawn again mid-flight (the stage came back): it measures its button at once.
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(enterTimer)
  clearTimeout(tellTimer)
})

/** A leaving item: at the button as it rises, on the picture as it rests, a little lower as it sinks. */
const leaveStyle = computed(() => {
  const phase = flights.phase
  const rising = phase === 'rise' && !entered.value
  const sinking = phase === 'sink'
  const at = rising
    ? start.value
    : { x: end.value.x, y: end.value.y + (sinking ? 30 : 0) }
  const ms = (time: number): string => `calc(${time}ms * var(--lq-motion, 1))`
  const rise = ms(LEAVE_RISE_MS)
  const move = `left ${rise} ease-out, top ${rise} ease-out, transform ${rise} ease-out, opacity ${rise} ease-out`
  const sink = ms(LEAVE_SINK_MS)
  return {
    left: `${at.x}px`,
    top: `${at.y}px`,
    opacity: rising ? 0.35 : sinking ? 0 : 1,
    transform: `translate(-50%, -50%) scale(${rising ? 0.22 : sinking ? 0.9 : 1})`,
    transition: rising
      ? 'none'
      : sinking
        ? `top ${sink} ease-in, transform ${sink} ease-in, opacity ${sink} ease-in`
        : move,
  }
})

const style = computed(() => {
  if (flights.current?.leaving) return leaveStyle.value
  const flying = flights.phase === 'fly'
  const at = flying ? end.value : start.value
  const curve = 'cubic-bezier(0.55, 0, 0.75, 0.35)'
  const scale = flying ? 0.22 : entered.value ? 1 : 0.8
  // Under Reduce motion (--lq-motion 0) it does not move: it is shown, then at its button.
  const ms = (time: number): string => `calc(${time}ms * var(--lq-motion, 1))`
  const fly = ms(FLIGHT_FLY_MS)
  const transition = flying
    ? `left ${fly} ${curve}, top ${fly} ${curve}, ` +
      `transform ${fly} ease-in, opacity ${fly} ease-in`
    : entered.value
      ? `opacity ${ms(300)} ease-out, ` +
        `transform ${ms(320)} cubic-bezier(0.2, 0.9, 0.3, 1.2)`
      : 'none'
  return {
    left: `${at.x}px`,
    top: `${at.y}px`,
    opacity: flying ? 0.35 : entered.value ? 1 : 0,
    transform: `translate(-50%, -50%) scale(${scale})`,
    transition,
  }
})
</script>

<template>
  <div
    v-if="flights.current"
    :key="flights.current.key"
    class="lq-flight"
    :class="[
      flights.current.leaving
        ? 'lq-flight-lost'
        : `lq-flight-${flights.current.kind}`,
      flights.current.from ? 'lq-flight-change' : '',
      flights.current.from && stacked ? 'lq-flight-stacked' : '',
    ]"
    :style="style"
    aria-hidden="true"
    data-testid="flight"
  >
    <span v-if="flights.current.from" class="lq-flight-was">{{
      `${was} →`
    }}</span>
    <span v-if="flights.current.leaving" class="lq-flight-minus">−</span>
    <!-- A thing obtained flies as its picture alone, the one the list then shows. -->
    <span
      v-if="!flights.current.leaving"
      class="lq-flight-pocket"
      aria-hidden="true"
    >
      <BeltFace
        :kind="flights.current.kind"
        :name="flights.current.name"
        picture-class="lq-flight-pic"
      >
        <span class="lq-flight-letter">{{ letter }}</span>
      </BeltFace>
    </span>
    <BeltFace
      v-else
      :kind="flights.current.kind"
      :name="flights.current.name"
      :picture-class="`lq-flight-face lq-flight-face-${flights.current.kind}`"
    >
      <svg
        class="lq-flight-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M8 7V6a4 4 0 0 1 8 0v1" />
        <path d="M5 7h14l-1.2 12.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8z" />
      </svg>
    </BeltFace>
    <span
      v-if="flights.current.leaving || flights.current.from"
      class="lq-flight-name"
      >{{ label }}</span
    >
  </div>
  <p class="lq-sr-only" aria-live="polite">{{ announcement }}</p>
</template>

<style scoped>
/* The flying name: above the picture and its words, never taking a press. */
.lq-flight {
  position: fixed;
  z-index: var(--lq-z-page-acquired-flight);
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  pointer-events: none;
}
/* A change: the old name, the picture and the new name on one card; stacked, the picture sits left of the two names. */
.lq-flight-change {
  display: grid;
  grid-template-areas: 'was pic name';
  align-items: center;
  column-gap: 12px;
  max-width: calc(100vw - 32px);
  padding: 10px 18px 10px 10px;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  font-weight: 600;
}
.lq-flight-change .lq-flight-was {
  grid-area: was;
  padding-left: 8px;
  color: var(--lq-muted);
  font-weight: 500;
}
.lq-flight-change .lq-flight-pocket {
  grid-area: pic;
}
.lq-flight-change .lq-flight-name {
  grid-area: name;
  font-size: calc(24px * var(--lq-text-scale, 1));
}
.lq-flight-stacked {
  grid-template-areas:
    'pic was'
    'pic name';
  grid-template-columns: auto auto;
  justify-items: start;
  row-gap: 2px;
  max-width: calc(100vw - 32px);
}
.lq-flight-stacked .lq-flight-was {
  padding-left: 0;
  font-size: calc(12px * var(--lq-text-scale, 1));
}
.lq-flight-stacked .lq-flight-name {
  white-space: normal;
  font-size: calc(18px * var(--lq-text-scale, 1));
}
.lq-flight-item {
  color: var(--lq-item);
}
.lq-flight-lost {
  padding: 14px 26px;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  border: 1px solid var(--lq-lost-line);
  background: var(--lq-lost-soft);
  color: var(--lq-lost);
}
.lq-flight-minus {
  font-family: var(--lq-font-display);
  font-weight: 600;
  font-size: calc(30px * var(--lq-text-scale, 1));
  margin-right: -4px;
}
.lq-flight-spell {
  color: var(--lq-spell);
}
/* The belt's round brass-rimmed pocket, so what flies is what then sits in the list. */
.lq-flight-pocket {
  box-sizing: border-box;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 3px solid #c8963d;
  box-shadow:
    0 0 0 1px #4a3110,
    inset 0 2px 6px rgb(0 0 0 / 0.5),
    0 3px 6px rgb(0 0 0 / 0.5);
  font: 600 24px var(--lq-font-display);
}
.lq-flight-item .lq-flight-pocket {
  background: #18261b;
  color: #8fcf7a;
}
.lq-flight-spell .lq-flight-pocket {
  background: #241a33;
  color: #c79bf0;
}
:deep(.lq-flight-pic) {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}
:deep(.lq-flight-face) {
  /* A small square of the picture, in the thin coloured edge of its kind (amber thing, blue spell), also on the grey card of a loss. */
  width: calc(44px * var(--lq-text-scale, 1));
  height: calc(44px * var(--lq-text-scale, 1));
  flex: none;
  box-sizing: border-box;
  border: 1px solid;
  border-radius: 8px;
  object-fit: cover;
}
:deep(.lq-flight-face-item) {
  border-color: var(--lq-item-line);
}
:deep(.lq-flight-face-spell) {
  border-color: var(--lq-spell-line);
}
.lq-flight-icon {
  width: calc(28px * var(--lq-text-scale, 1));
  height: calc(28px * var(--lq-text-scale, 1));
  flex: none;
}
.lq-flight-name {
  font-family: var(--lq-font-display);
  font-weight: 600;
  font-size: calc(30px * var(--lq-text-scale, 1));
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

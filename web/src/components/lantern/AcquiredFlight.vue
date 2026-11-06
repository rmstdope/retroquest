<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  FLIGHT_FLY_MS,
  LEAVE_RISE_MS,
  LEAVE_SINK_MS,
  flightLabel,
  useFlightStore,
} from '@/stores/useFlightStore'

/**
 * A thing the player has just gained, flown from the picture to its button
 * (`useFlightStore` keeps the queue and the clock): its name, in the item's
 * green or the spell's purple with a bag or a sparkle, comes up in the middle
 * of the picture, rests, then shrinks and flies into the Bag or Spells button
 * (or tab on a phone) that carries `data-flight-target` of its kind and is
 * shown. Where the flight starts and lands is measured when it starts and
 * when it flies. Under Reduce motion it does not move: it is shown, then
 * at its button. An item the turn lost goes the other way, in warm grey with a
 * minus sign: it rises out of the Bag button (or tab) to the middle of the
 * picture, rests, then sinks and fades; the first frame is the button's if
 * none is shown, the picture's. A screen reader hears "Lost …", "Gained …" or
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

/** The name as the story shows it, with how many when more than one. */
const label = computed(() =>
  flights.current ? flightLabel(flights.current) : '',
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
  { immediate: true },
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
    const targets = document.querySelectorAll(
      `[data-flight-target="${flight.kind}"]`,
    )
    end.value =
      Array.from(targets)
        .map(centre)
        .find((point): point is Point => point !== null) ?? start.value
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
    :class="
      flights.current.leaving
        ? 'lq-flight-lost'
        : `lq-flight-${flights.current.kind}`
    "
    :style="style"
    aria-hidden="true"
    data-testid="flight"
  >
    <span v-if="flights.current.leaving" class="lq-flight-minus">−</span>
    <svg
      v-if="flights.current.kind === 'item'"
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
    <svg
      v-else
      class="lq-flight-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </svg>
    <span class="lq-flight-name">{{ label }}</span>
  </div>
  <p class="lq-sr-only" aria-live="polite">{{ announcement }}</p>
</template>

<style scoped>
/* The flying name: above the picture and its words, never taking a press. */
.lq-flight {
  position: fixed;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 26px;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
  pointer-events: none;
}
.lq-flight-item {
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  color: var(--lq-item);
}
.lq-flight-lost {
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
  border: 1px solid var(--lq-spell-line);
  background: var(--lq-spell-soft);
  color: var(--lq-spell);
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

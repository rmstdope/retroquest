import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Chip, ChipKind } from '@/lantern/inventoryChanges'
import { displayName } from '@/lantern/displayName'

/** How long a gained thing takes to come up on the picture (ms). */
export const FLIGHT_SHOW_MS = 320
/** How long it rests there before it flies (ms). */
export const FLIGHT_HOLD_MS = 1000
/** How long it flies to its button (ms). */
export const FLIGHT_FLY_MS = 700
/** How long its button stays bumped after it lands (ms). */
export const FLIGHT_LAND_MS = 450

/** How long an item takes to rise out of the Bag button to the picture (ms). */
export const LEAVE_RISE_MS = 700
/** How long a leaving item rests on the picture (ms). */
export const LEAVE_REST_MS = 1000
/** How long it takes to sink and fade out (ms). */
export const LEAVE_SINK_MS = 450
/** How long the Bag button stays dipped as an item rises out of it (ms). */
export const LEAVE_DIP_MS = 300

/** One thing on its way to its button (an item to the Bag, a spell to Spells) or an item leaving the Bag. */
export interface Flight extends Chip {
  /** Unique within the session, so the view starts each flight afresh. */
  key: number
  /** An item leaving the bag (it rises out of the button), not a gain flying to it. */
  leaving: boolean
}

/** A gained or lost thing's name as the story shows it, with how many when more than one. */
export function flightLabel(chip: Chip): string {
  const count = chip.count > 1 ? ` ×${chip.count}` : ''
  return `${displayName(chip.name)}${count}`
}

/**
 * Where the flight in hand is: a gain comes up and rests (`show`) then flies
 * to its button (`fly`); a loss rises out of its button (`rise`), rests on the
 * picture (`rest`) and sinks away (`sink`).
 */
export type FlightPhase = 'show' | 'fly' | 'rise' | 'rest' | 'sink'

/**
 * The things a turn gained, flown one after another from the picture to
 * their button (`AcquiredFlight` draws them): each comes up, rests for
 * `FLIGHT_HOLD_MS`, then flies for `FLIGHT_FLY_MS`; its button is bumped
 * (`landed`) for `FLIGHT_LAND_MS` as it lands. The items a turn lost go first,
 * each rising out of the Bag button (dipped for `LEAVE_DIP_MS`), resting and
 * sinking away. `clear` stops at once. Nothing here is saved.
 */
export const useFlightStore = defineStore('flight', () => {
  const current = ref<Flight | null>(null)
  const phase = ref<FlightPhase>('show')
  /** The kind of the thing that has just landed, whose button is bumped; null otherwise. */
  const landed = ref<ChipKind | null>(null)
  /** The name of the thing that has just landed, whose picture on the belt is bumped; null otherwise. */
  const landedName = ref<string | null>(null)
  /** The kind of the button an item is rising out of, which is dipped; null otherwise. */
  const dipped = ref<ChipKind | null>(null)
  /** Whether motion is reduced: a leaving item does not rise and the button does not dip. */
  let still = false
  /** What a screen reader is told of the latest changes ("Lost …", "Gained …", "Learned …"), all of them as they are queued. */
  const told = ref<string[]>([])
  let queue: Flight[] = []
  let nextKey = 1
  let timers: ReturnType<typeof setTimeout>[] = []

  /** Run `step` after `ms`, unless cleared first. */
  function after(ms: number, step: () => void): void {
    timers.push(setTimeout(step, ms))
  }

  /** Bring up the next thing in the queue, if any. */
  function next(): void {
    const flight = queue.shift() ?? null
    current.value = flight
    if (!flight) return
    if (flight.leaving) return leave(flight)
    phase.value = 'show'
    after(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS, () => {
      phase.value = 'fly'
      after(FLIGHT_FLY_MS, () => land(flight.kind, flight.name))
    })
  }

  /** Bring up an item leaving the bag: rise (dipping its button), rest, sink, go on. */
  function leave(flight: Flight): void {
    const rest = (): void => {
      phase.value = 'rest'
      after(LEAVE_REST_MS, () => {
        phase.value = 'sink'
        after(LEAVE_SINK_MS, next)
      })
    }
    if (still) return rest()
    phase.value = 'rise'
    dipped.value = flight.kind
    after(LEAVE_DIP_MS, () => {
      dipped.value = null
    })
    after(LEAVE_RISE_MS, rest)
  }

  /** The thing in hand reached its picture or button: bump them, and go on. */
  function land(kind: ChipKind, name: string): void {
    landed.value = kind
    landedName.value = name
    after(FLIGHT_LAND_MS, () => {
      // Only this landing's own bump: a later one of the same kind has its own timer.
      if (landed.value !== kind || landedName.value !== name) return
      landed.value = null
      landedName.value = null
    })
    next()
  }

  /**
   * Fly the items a turn lost out of the Bag button, then these gained things
   * to their buttons, after any still flying; each is told at once. Only items
   * leave. With `reduced` they do not move.
   */
  function launch(chips: Chip[], lost: Chip[] = [], reduced = false): void {
    const leaving = lost.filter((chip) => chip.kind === 'item')
    still = reduced
    told.value = [
      ...leaving.map((chip) => `Lost ${flightLabel(chip)}`),
      ...chips.map(
        (chip) =>
          `${chip.kind === 'item' ? 'Gained' : 'Learned'} ${flightLabel(chip)}`,
      ),
    ]
    queue.push(
      ...leaving.map((chip) => ({ ...chip, key: nextKey++, leaving: true })),
      ...chips.map((chip) => ({ ...chip, key: nextKey++, leaving: false })),
    )
    if (!current.value) next()
  }

  /** Stop at once: nothing more flies, no button stays bumped, nothing is left to tell. */
  function clear(): void {
    timers.forEach(clearTimeout)
    timers = []
    queue = []
    current.value = null
    landed.value = null
    landedName.value = null
    dipped.value = null
    told.value = []
  }

  return { current, phase, landed, landedName, dipped, told, launch, clear }
})

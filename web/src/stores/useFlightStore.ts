import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Chip, ChipKind } from '@/lantern/inventoryChanges'

/** How long a gained thing takes to come up on the picture (ms). */
export const FLIGHT_SHOW_MS = 320
/** How long it rests there before it flies (ms). */
export const FLIGHT_HOLD_MS = 1000
/** How long it flies to its button (ms). */
export const FLIGHT_FLY_MS = 700
/** How long its button stays bumped after it lands (ms). */
export const FLIGHT_LAND_MS = 450

/** One thing on its way to its button: an item to the Bag, a spell to Spells. */
export interface Flight extends Chip {
  /** Unique within the session, so the view starts each flight afresh. */
  key: number
}

/** Where the flight in hand is: coming up and resting, or flying to its button. */
export type FlightPhase = 'show' | 'fly'

/**
 * The things a turn gained, flown one after another from the picture to
 * their button (`AcquiredFlight` draws them): each comes up, rests for
 * `FLIGHT_HOLD_MS`, then flies for `FLIGHT_FLY_MS`; its button is bumped
 * (`landed`) for `FLIGHT_LAND_MS` as it lands. `clear` stops at once. Nothing
 * here is saved.
 */
export const useFlightStore = defineStore('flight', () => {
  const current = ref<Flight | null>(null)
  const phase = ref<FlightPhase>('show')
  /** The kind of the thing that has just landed, whose button is bumped; null otherwise. */
  const landed = ref<ChipKind | null>(null)
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
    phase.value = 'show'
    after(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS, () => {
      phase.value = 'fly'
      after(FLIGHT_FLY_MS, () => land(flight.kind))
    })
  }

  /** The thing in hand reached its button: bump it, and go on. */
  function land(kind: ChipKind): void {
    landed.value = kind
    after(FLIGHT_LAND_MS, () => {
      if (landed.value === kind) landed.value = null
    })
    next()
  }

  /** Fly these gained things to their buttons, after any still flying. */
  function launch(chips: Chip[]): void {
    queue.push(...chips.map((chip) => ({ ...chip, key: nextKey++ })))
    if (!current.value) next()
  }

  /** Stop at once: nothing more flies, no button stays bumped. */
  function clear(): void {
    timers.forEach(clearTimeout)
    timers = []
    queue = []
    current.value = null
    landed.value = null
  }

  return { current, phase, landed, launch, clear }
})

import { defineStore } from 'pinia'
import { onScopeDispose, ref } from 'vue'
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
  /** What the turn gained and has not landed yet, by "kind:name": the lists do not show it before. */
  const owed = ref<Record<string, number>>({})
  let queue: Flight[] = []
  /** What waits for every flight to land (`whenIdle`). */
  let waiting: (() => void)[] = []
  /** Told when a gain's name comes up (`launch`). */
  let onShow: ((flight: Flight) => void) | undefined
  let nextKey = 1
  let timers: ReturnType<typeof setTimeout>[] = []

  /** Run `step` after `ms`, unless cleared first. */
  function after(ms: number, step: () => void): void {
    timers.push(setTimeout(step, ms))
  }

  /** The key a thing is owed under. */
  function owedKey(kind: ChipKind, name: string): string {
    return `${kind}:${name}`
  }

  /** Owe these gained things: their lists hold them back until each one lands (or `clear`). */
  function owe(chips: Chip[]): void {
    const now = { ...owed.value }
    for (const chip of chips) {
      const key = owedKey(chip.kind, chip.name)
      now[key] = (now[key] ?? 0) + chip.count
    }
    owed.value = now
  }

  /** Pay these back without a flight: they will not fly, so their lists show them now. */
  function forgive(chips: Chip[]): void {
    for (const chip of chips) pay(chip.kind, chip.name, chip.count)
  }

  /** Take `count` of a thing off what is owed. */
  function pay(kind: ChipKind, name: string, count: number): void {
    const now = { ...owed.value }
    const left = (now[owedKey(kind, name)] ?? 0) - count
    if (left > 0) now[owedKey(kind, name)] = left
    else delete now[owedKey(kind, name)]
    owed.value = now
  }

  /** How many of the thing or spell are owed: gained, and still on their way to the list. */
  function owing(kind: ChipKind, name: string): number {
    return owed.value[owedKey(kind, name)] ?? 0
  }

  /** Whether any thing of this kind is gained and still on its way: its button's new-thing dot waits until it lands. */
  function owes(kind: ChipKind): boolean {
    return Object.keys(owed.value).some((key) => key.startsWith(`${kind}:`))
  }

  /** Bring up the next thing in the queue, if any. */
  function next(): void {
    const flight = queue.shift() ?? null
    current.value = flight
    if (!flight) {
      const done = waiting
      waiting = []
      done.forEach((run) => run())
      return
    }
    if (flight.leaving) return leave(flight)
    phase.value = 'show'
    onShow?.(flight)
    after(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS, () => {
      phase.value = 'fly'
      after(FLIGHT_FLY_MS, () => land(flight.kind, flight.name, flight.count))
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

  /** The thing in hand reached its picture or button: it is in its list now; bump them, and go on. */
  function land(kind: ChipKind, name: string, count: number): void {
    pay(kind, name, count)
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
   * leave. With `reduced` they do not move. `shown` is told, as each gain's name
   * comes up, which flight it is (the room picture lets that thing go then).
   */
  function launch(
    chips: Chip[],
    lost: Chip[] = [],
    reduced = false,
    shown?: (flight: Flight) => void,
  ): void {
    onShow = shown
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

  /** Run `run` once every flight has landed: at once when none is in hand or queued. `clear` forgets it. */
  function whenIdle(run: () => void): void {
    if (!current.value && !queue.length) run()
    else waiting.push(run)
  }

  // The store's own timers end with its scope; no caller has to clear them.
  onScopeDispose(() => timers.forEach(clearTimeout))

  /** Stop at once: nothing more flies, no button stays bumped, nothing is left to tell. */
  function clear(): void {
    timers.forEach(clearTimeout)
    timers = []
    queue = []
    waiting = []
    owed.value = {}
    current.value = null
    landed.value = null
    landedName.value = null
    dipped.value = null
    told.value = []
  }

  return {
    current,
    phase,
    landed,
    landedName,
    dipped,
    told,
    owe,
    forgive,
    owing,
    owes,
    launch,
    whenIdle,
    clear,
  }
})

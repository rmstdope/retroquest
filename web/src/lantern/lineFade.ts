/**
 * How the lines on the picture fade away, as data. The navigator's rule is
 * that a line on the picture moves only when a new line arrives below it,
 * never because a line fades. Every column rests its lines at its foot, so a
 * line stays put as long as the room a fading line gives back is the room of
 * the lines above it: a line starts fading only once every line above it has
 * started (`advanceColumn`), and goes (takes its room away) only once every
 * line above it is gone. That rule is held here, once, as a pure function;
 * `useFadeOnceRead` applies it to the DOM, and the `FadeLedger` hands each
 * line's state to the columns (which line carries a run's name and portrait
 * is worked out from it, never read back from the DOM).
 */
import {
  computed,
  reactive,
  ref,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import { READING_TIME_MAX_MS } from './stageSpeech'

/**
 * Where a line is in its life on the picture: `live` while it is being read
 * or waiting to be, `away` while its fade runs, `spent` once the fade has run
 * (unseen, but keeping its room because a line above still shows), `gone` once
 * it has taken its room away too.
 */
export type FadeState = 'live' | 'away' | 'spent' | 'gone'

/** What a column knows about one of its lines when it is advanced. */
export interface ColumnLineInput {
  /** The line's state so far; none for a line not yet seen. */
  state?: FadeState
  /** Whether it, or a part of it, is being read aloud now. */
  reading: boolean
  /** Whether its time to read is over (heard, no time needed, or the wait has run). */
  eligible: boolean
  /** Whether a timer for its time to read is already running. */
  waiting: boolean
}

/** What advancing a line decided. */
export interface ColumnLineOutput {
  /** The line's state now. */
  state: FadeState
  /** Whether the line should start its time to read. */
  wait: boolean
}

/**
 * Advance the lines of one column, top first. A line being read is live; a
 * live line that has been read starts fading only when every line above it
 * has started; a spent line is gone only when every line above it is gone.
 * So room only ever leaves a column from the top, and the lines still showing
 * never move because one faded.
 */
export function advanceColumn(lines: ColumnLineInput[]): ColumnLineOutput[] {
  let fadingAbove = true
  let goneAbove = true
  return lines.map((line) => {
    const out: ColumnLineOutput = {
      state: line.state ?? 'live',
      wait: false,
    }
    if (line.reading) {
      out.state = 'live'
    } else if (out.state === 'spent' && goneAbove) {
      out.state = 'gone'
    } else if (out.state === 'live' && !line.waiting) {
      if (line.eligible) {
        if (fadingAbove) out.state = 'away'
      } else out.wait = true
    }
    fadingAbove = fadingAbove && out.state !== 'live'
    goneAbove = goneAbove && out.state === 'gone'
    return out
  })
}

/** A line's fade has run: `away` becomes `spent`; any other state stays. */
export function finishFade(state: FadeState): FadeState {
  return state === 'away' ? 'spent' : state
}

/** Whether a state is out of sight (its fade has run). */
function outOfSightState(state: FadeState | undefined): boolean {
  return state === 'spent' || state === 'gone'
}

/** The least time any line with words shows before it starts to fade, in ms. */
const MINIMUM_READ_BASE_MS = 4000

/** What each word of a line adds to its minimum reading time, in ms. */
const MINIMUM_READ_PER_WORD_MS = 200

/**
 * The least time a line stays fully visible before it starts to fade, by its
 * words: four seconds and a fifth of a second per word, at most six seconds
 * (`READING_TIME_MAX_MS`, the cap of a line's own time to read), however short
 * its narration. A line whose narration outlasts this fades as soon as it has
 * been heard; a line never read aloud whose own time to read is longer waits
 * that. A line with no words needs none.
 */
export function minimumReadMs(text: string): number {
  const words = text.split(/\s+/).filter((word) => word.length > 0).length
  if (words === 0) return 0
  return Math.min(
    READING_TIME_MAX_MS,
    MINIMUM_READ_BASE_MS + MINIMUM_READ_PER_WORD_MS * words,
  )
}

/** The fade state of every line on the picture, by line id, for the columns to read. */
export interface FadeLedger {
  /** Every line's state by id; reactive. */
  readonly states: Readonly<Record<string, FadeState>>
  /** Counts each time a line leaves sight, comes back, or takes its room away (reactive). */
  readonly version: ComputedRef<number>
  /** Whether the line with this id has faded out of sight; false for an unknown id. */
  outOfSight(id: string): boolean
  /** Record a line's state. */
  set(id: string, state: FadeState): void
  /** Drop a line that left the page. */
  forget(id: string): void
}

/** An empty ledger. */
export function createFadeLedger(): FadeLedger {
  const states = reactive<Record<string, FadeState>>({})
  const changes = ref(0)
  return {
    states,
    version: computed(() => changes.value),
    outOfSight: (id) => outOfSightState(states[id]),
    set(id, state) {
      const before = states[id]
      if (before === state) return
      states[id] = state
      if (outOfSightState(before) || outOfSightState(state)) changes.value++
    },
    forget(id) {
      if (!(id in states)) return
      if (outOfSightState(states[id])) changes.value++
      delete states[id]
    },
  }
}

/** Provided by the layout, injected by the columns: the ledger `useFadeOnceRead` keeps. */
export const FADE_LEDGER: InjectionKey<FadeLedger> = Symbol('fade-ledger')

/** The id of a line of the speech thread at the right of the laptop stage, by its key. */
export function speechLineId(key: number): string {
  return `speech-${key}`
}

/** The id of a spoken line in the one column, by its turn and its piece key. */
export function columnLineId(turnId: number, pieceKey: string): string {
  return `column-${turnId}-${pieceKey}`
}

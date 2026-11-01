import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useNarrationStore } from './useNarrationStore'
import {
  ARRIVAL_CLEAR_AFTER_MS,
  readingTimeMs,
  type ArrivalPart,
} from '@/lantern/stageArrival'

/**
 * The arrival told on the room's picture (the laptop stage): which part of it
 * is up and when it goes. Nothing here is saved.
 *
 * A part that is narrated follows the narrator: the description comes up as
 * its unit is revealed, and the arrival clears `ARRIVAL_CLEAR_AFTER_MS` after
 * the narrator has finished. A part nobody speaks (narration off, no
 * recording, events that are not voiced) is read for its reading time, which
 * `barMs` gives for the bar that empties. `next` (a click, Enter or Space)
 * goes on a part, and on the last one clears; `clear` ends it all at once and
 * stops the narrator.
 */
export const useArrivalStore = defineStore('arrival', () => {
  const narration = useNarrationStore()
  /** The arrival being told: its turn, parts and the part up. */
  const current = ref<{
    turnId: number
    parts: ArrivalPart[]
    narrated: boolean
    index: number
    /** The narrator has finished (the arrival is only waiting to clear). */
    ended: boolean
  } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Whether an arrival is on the picture. */
  const active = computed(() => current.value !== null)
  /** The turn whose arrival is up, or null. */
  const turnId = computed(() => current.value?.turnId ?? null)
  /** The part up now. */
  const part = computed(() =>
    current.value ? current.value.parts[current.value.index] : null,
  )
  /** The reading time of the part up when nobody speaks it (ms), else 0: the bar. */
  const barMs = computed(() =>
    part.value && !part.value.voiced
      ? readingTimeMs(part.value.lines.map((line) => line.markup).join(' '))
      : 0,
  )
  /** Changes with every part, so the bar starts over. */
  const barKey = computed(() =>
    current.value ? `${current.value.turnId}-${current.value.index}` : '',
  )

  /** Forget the pending move on. */
  function stopTimer(): void {
    clearTimeout(timer)
    timer = undefined
  }

  /** Move on after `ms`. */
  function later(ms: number, then: () => void): void {
    stopTimer()
    timer = setTimeout(then, ms)
  }

  /** Read the part up for its reading time, then go on. */
  function readPart(): void {
    if (barMs.value) later(barMs.value, advance)
    else stopTimer()
  }

  /** The next part, or, after the last, nothing. */
  function advance(): void {
    const now = current.value
    if (!now) return
    if (now.index < now.parts.length - 1) {
      now.index++
      if (!now.narrated || now.ended) readPart()
    } else clear()
  }

  /** Tell an arrival: its parts, and whether the narrator is telling them. */
  function show(id: number, parts: ArrivalPart[], narrated: boolean): void {
    clear()
    if (!parts.length) return
    // Nobody speaks the parts of an arrival that is not narrated.
    const told = narrated
      ? parts
      : parts.map((each) => ({ ...each, voiced: false }))
    current.value = {
      turnId: id,
      parts: told,
      narrated,
      index: 0,
      ended: false,
    }
    if (!narrated) readPart()
  }

  /** Go on to the next part (the narrator jumps with it); on the last one, clear. */
  function next(): void {
    const now = current.value
    if (!now) return
    const last = now.parts.length - 1
    if (now.index >= last) return clear()
    if (now.narrated && !now.ended) {
      now.index = last
      narration.skipTo(now.parts[last].lines[0].unit)
    } else advance()
  }

  /** End it at once; a narrator still telling it is stopped. */
  function clear(): void {
    stopTimer()
    const now = current.value
    current.value = null
    if (now?.narrated && narration.narrates(now.turnId)) narration.skipAll()
  }

  // The narrated description comes up when the narrator reaches it.
  watch(
    () => {
      const now = current.value
      if (!now?.narrated || now.index >= now.parts.length - 1) return false
      return narration.revealed(
        now.turnId,
        now.parts[now.parts.length - 1].lines[0].unit,
      )
    },
    (reached) => {
      if (reached && current.value)
        current.value.index = current.value.parts.length - 1
    },
  )

  // The narrator has finished: the last part goes 1½ s later, or, with no
  // voice of its own, is read for its reading time.
  watch(
    () => current.value?.narrated && !narration.narrates(current.value.turnId),
    (over) => {
      const now = current.value
      if (!over || !now || now.ended) return
      now.ended = true
      now.index = now.parts.length - 1
      if (part.value?.voiced) later(ARRIVAL_CLEAR_AFTER_MS, clear)
      else readPart()
    },
  )

  return { active, turnId, part, barMs, barKey, show, next, clear }
})

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useNarrationStore } from './useNarrationStore'
import { useStageSpeechStore } from './useStageSpeechStore'
import {
  ARRIVAL_CLEAR_AFTER_MS,
  readingTimeMs,
  type ArrivalPart,
} from '@/lantern/stageArrival'

/** Where a page of the part up starts (the narrator's unit and word), and its text. */
export interface PageStart {
  unit: number
  /** The index of its first word within the unit (the room's name counts). */
  word: number
  /** Its words as markup, for its reading time. */
  text: string
}

/**
 * The arrival told on the room's picture (the laptop stage): which part of it
 * is up and when it goes. Nothing here is saved.
 *
 * A part that is narrated follows the narrator: the description comes up as
 * its unit is revealed, and the arrival clears `ARRIVAL_CLEAR_AFTER_MS` after
 * the narrator has finished. A part nobody speaks (narration off, no
 * recording, events that are not voiced) is read for its reading time, which
 * `barMs` gives for the bar that empties. `next` (a click, Enter or Space)
 * goes on a page, then a part, and on the last one clears; `clear` ends it all
 * at once and stops the narrator.
 *
 * A part too tall for the picture is shown in pages. The view cuts them (it
 * needs layout) and reports where each starts (`setPages`); the store only
 * keeps which page is up. Pages go forward only: a narrator reaching the first
 * word of the next page turns it, `next` turns it (the narrator jumping to
 * it), and a part nobody speaks reads each page for its own reading time.
 *
 * Quest news follows the arrival's parts as `news` parts, one for each piece.
 * A turn that has only news waits (`active` false, nothing in the middle)
 * until the turn's words are told: the narrator reaching the first piece, or,
 * when nobody narrates, the conversation on the picture having shown every
 * line. `told` remembers the turns whose news went through the middle (the
 * story shows their slim lines once `newsPending` is false) and `newsUp`
 * says which piece is on screen, for its sound.
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
    /** Where the pages of the part up start; empty until the view has cut them (then it is one page). */
    pages: PageStart[]
    /** The page up. */
    page: number
    /** Whether the middle is up: false while a turn of news alone waits for the turn's words. */
    shown: boolean
  } | null>(null)
  /** Turns whose quest news was told in the middle, for the story's slim lines. */
  const newsTurns = ref<number[]>([])
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Whether an arrival is on the picture. */
  const active = computed(() => !!current.value?.shown)
  /** The turn whose arrival is up, or null. */
  const turnId = computed(() => current.value?.turnId ?? null)
  /** The part up now. */
  const part = computed(() =>
    current.value?.shown ? current.value.parts[current.value.index] : null,
  )
  /** The piece of quest news on screen: its turn and its number among the turn's news. */
  const newsUp = computed(() => {
    const now = current.value
    if (!now?.shown || part.value?.kind !== 'news') return null
    const first = now.parts.findIndex((each) => each.kind === 'news')
    return { turnId: now.turnId, index: now.index - first }
  })
  /** The page of the part up (0 for the first). */
  const page = computed(() => current.value?.page ?? 0)
  /** How many pages the part up has. */
  const pageCount = computed(() =>
    Math.max(1, current.value?.pages.length ?? 0),
  )
  /** The reading time of the page up when nobody speaks it (ms), else 0: the bar. */
  const barMs = computed(() => {
    const now = current.value
    if (!part.value || part.value.voiced || !now) return 0
    const text =
      now.pages[now.page]?.text ??
      part.value.lines.map((line) => line.markup).join(' ')
    return readingTimeMs(text)
  })
  /** Changes with every page, so the bar starts over. */
  const barKey = computed(() =>
    current.value
      ? `${current.value.turnId}-${current.value.index}-${current.value.page}`
      : '',
  )

  /** Whether turn `turnId` still has quest news to tell (waiting or up). */
  function newsPending(turnId: number): boolean {
    const now = current.value
    return (
      now?.turnId === turnId && now.parts.some((each) => each.kind === 'news')
    )
  }

  /** Forget everything told (a new game, a load). */
  function reset(): void {
    clear()
    newsTurns.value = []
  }

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

  /** Whether the part up has a page after the one up. */
  function morePages(): boolean {
    const now = current.value
    return !!now && now.page < now.pages.length - 1
  }

  /** The next page of the part up, or the next part, or, after the last, nothing. */
  function advance(): void {
    const now = current.value
    if (!now) return
    if (morePages()) {
      now.page++
      readPart()
    } else if (now.index < now.parts.length - 1) {
      now.index++
      now.page = 0
      now.pages = []
      if (!now.narrated || now.ended) readPart()
    } else clear()
  }

  /**
   * The view reports where the pages of the part up start. The page up stays
   * the one holding the paragraph being read when the cut changes; a part
   * nobody speaks is read afresh when its page changes or it was just cut.
   */
  function setPages(starts: PageStart[]): void {
    const now = current.value
    if (!now) return
    const before = now.pages[now.page]
    const fresh = now.pages.length === 0
    let page = 0
    if (before)
      starts.forEach((each, i) => {
        if (
          each.unit < before.unit ||
          (each.unit === before.unit && each.word <= before.word)
        )
          page = i
      })
    const changed = fresh || page !== now.page
    now.pages = starts
    now.page = page
    if (changed && (!now.narrated || now.ended)) readPart()
  }

  /** Turn to the next page of the part up; the narrator jumps to it. False when there is none. */
  function turnPage(): boolean {
    const now = current.value
    if (!now || !morePages()) return false
    now.page++
    const to = now.pages[now.page]
    if (part.value?.voiced && now.narrated && !now.ended)
      narration.seekToWord(to.unit, to.word)
    else readPart()
    return true
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
      pages: [],
      page: 0,
      shown: true,
    }
    if (newsTurns.value.length > 50) newsTurns.value.shift()
    if (newsTurns.value.includes(id))
      newsTurns.value.splice(newsTurns.value.indexOf(id), 1)
    if (parts.some((each) => each.kind === 'news')) newsTurns.value.push(id)
    // News alone waits until the turn's words are told.
    if (parts[0].kind === 'news' && !wordsTold(current.value)) {
      current.value.shown = false
      return
    }
    if (!narrated) readPart()
  }

  /** Whether the words of the turn before its news are told: the narrator is at the news, or the conversation is out. */
  function wordsTold(now: NonNullable<typeof current.value>): boolean {
    return now.narrated
      ? narration.revealed(now.turnId, now.parts[0].lines[0].unit)
      : useStageSpeechStore().told(now.turnId)
  }

  /** Go on to the next page, or part (the narrator jumps with it); on the last one, clear. */
  function next(): void {
    const now = current.value
    if (!now) return
    if (turnPage()) return
    if (now.index >= now.parts.length - 1) return clear()
    if (now.narrated && !now.ended) {
      now.index++
      now.page = 0
      now.pages = []
      narration.skipTo(now.parts[now.index].lines[0].unit)
    } else advance()
  }

  /** End it at once; a narrator still telling it is stopped. */
  function clear(): void {
    stopTimer()
    const now = current.value
    current.value = null
    if (now?.narrated && narration.narrates(now.turnId)) narration.skipAll()
  }

  // News alone comes up when the turn's words are told.
  watch(
    () => {
      const now = current.value
      return !!now && !now.shown && wordsTold(now)
    },
    (ready) => {
      const now = current.value
      if (!ready || !now) return
      now.shown = true
      if (!now.narrated) readPart()
    },
  )

  // Each narrated part comes up when the narrator reaches it.
  watch(
    () => {
      const now = current.value
      if (!now?.narrated || !now.shown) return -1
      let reached = now.index
      now.parts.forEach((each, i) => {
        if (i > reached && narration.revealed(now.turnId, each.lines[0].unit))
          reached = i
      })
      return reached
    },
    (reached) => {
      const now = current.value
      if (!now || reached <= now.index) return
      now.index = reached
      now.page = 0
      now.pages = []
    },
  )

  // The narrator reaches the first word of a later page: it is turned to
  // (forward only, so a narrator moved back leaves the page where it is).
  watch(
    () => {
      const now = current.value
      const at = now?.narrated ? narration.speaking(now.turnId) : null
      if (!now || !at || !part.value?.voiced) return 0
      const word = at.word < 0 ? 0 : at.offset + at.word
      let reached = 0
      now.pages.forEach((each, i) => {
        if (at.unit > each.unit || (at.unit === each.unit && word >= each.word))
          reached = i
      })
      return reached
    },
    (reached) => {
      const now = current.value
      if (now && reached > now.page) now.page = reached
    },
  )

  // The narrator has finished: the last part goes 1½ s later, or, with no
  // voice of its own, is read for its reading time.
  watch(
    () =>
      current.value?.shown &&
      current.value.narrated &&
      !narration.narrates(current.value.turnId),
    (over) => {
      const now = current.value
      if (!over || !now || now.ended) return
      now.ended = true
      if (now.index !== now.parts.length - 1) {
        now.index = now.parts.length - 1
        now.page = 0
        now.pages = []
      } else if (part.value?.voiced)
        now.page = Math.max(0, now.pages.length - 1)
      if (part.value?.voiced) later(ARRIVAL_CLEAR_AFTER_MS, clear)
      else readPart()
    },
  )

  return {
    active,
    turnId,
    part,
    page,
    pageCount,
    barMs,
    barKey,
    newsUp,
    told: newsTurns,
    newsPending,
    reset,
    show,
    next,
    setPages,
    clear,
  }
})

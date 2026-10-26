import {
  computed,
  nextTick,
  onScopeDispose,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import { useNarrationStore } from '@/stores/useNarrationStore'

/**
 * The story pane's scrolling while the narrator reads an answer.
 *
 * While a story turn is read (`useNarrationStore.storyReading`) the pane is
 * `held`: the player cannot scroll it (wheel, touch, scrolling keys, the
 * scrollbar), every attempt shows the narration hint, and the pane follows the
 * lit word, gliding up a line at a time to keep it two lines above the bottom
 * edge (the line just inside the bottom edge in a pane too short for that).
 * When the reading ends the pane is free: where it is if the reading was
 * skipped or cut in on, and at the end of the story if it was read to its end
 * (whatever showed last without a voice, such as a quest update, is then in
 * view and nothing is left below).
 *
 * All programmatic scrolling of the pane goes through `moveTo`, which keeps
 * track of where the pane is meant to be, so any other change while held is
 * known to be the player's and is put back.
 *
 * The read-along announces the word (or the unit) to follow with a bubbling,
 * cancelable `lq-follow` event on its element; this composable handles it,
 * only while held, and otherwise leaves it alone (the chapter page and
 * pop-ups are not held and do not follow).
 */

/** Event the read-along fires on the lit word, or on a unit that starts speaking. */
export const FOLLOW_EVENT = 'lq-follow'
/** Lines of room kept below the word. */
const ROOM_LINES = 2
/** A pane shorter than this many lines has no room to spare below the word. */
const SHORT_PANE_LINES = 5
/** How long the glide to a new position takes. */
const GLIDE_MS = 180
/** Keys that scroll a page. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
])
/** Elements that keep the scrolling keys for themselves. */
const EDITABLE = 'input, textarea, select, [contenteditable]'
/** A scroll position this close to the expected one is the same. */
const TOLERANCE = 1

/** What the story composable offers. */
export interface StoryFollow {
  /** Whether the pane is held still: a story turn is being read. */
  held: ComputedRef<boolean>
  /** Scroll the pane to `top` (clamped), gliding unless `animate` is false or motion is reduced. */
  moveTo(top: number, animate?: boolean): void
  /** Scroll just enough to keep `el` in view as the rule says; a `unit` counts by its first line. */
  follow(el: Element, unit?: boolean): void
  /** Bring the lit word (or the unit being spoken) back into view at once, after the pane changed size. */
  refollow(): void
}

/** The line height of an element in px. */
function lineHeightOf(el: Element): number {
  const style = getComputedStyle(el)
  const height = parseFloat(style.lineHeight)
  if (!Number.isNaN(height)) return height
  return (parseFloat(style.fontSize) || 16) * 1.5
}

/** Whether the game's "less motion" setting (or the system's) is on. */
function motionReduced(): boolean {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  )
}

/** Follow the reading in the story pane `story`; see the file comment. */
export function useStoryFollow(story: Ref<HTMLElement | null>): StoryFollow {
  const narration = useNarrationStore()
  const held = computed(() => narration.storyReading)
  /** Where the pane is meant to be right now. */
  let expectedTop = 0
  /** Where the running glide ends, if one is running. */
  let goal: number | null = null
  let frame: number | undefined

  /** The most the pane can scroll. */
  function maxTop(pane: HTMLElement): number {
    return Math.max(0, pane.scrollHeight - pane.clientHeight)
  }

  /** Stop the glide, leaving the pane where it is. */
  function stopGlide(): void {
    if (frame !== undefined && typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(frame)
    frame = undefined
    goal = null
  }

  /** Put the pane at `top` now. */
  function setTop(pane: HTMLElement, top: number): void {
    expectedTop = top
    pane.scrollTop = top
  }

  /** Scroll the pane to `top`; see `StoryFollow.moveTo`. */
  function moveTo(top: number, animate = true): void {
    const pane = story.value
    if (!pane) return
    stopGlide()
    const target = Math.max(0, Math.min(top, maxTop(pane)))
    if (
      !animate ||
      motionReduced() ||
      typeof requestAnimationFrame !== 'function'
    )
      return setTop(pane, target)
    const from = pane.scrollTop
    goal = target
    expectedTop = from
    let start: number | undefined
    const step = (time: number): void => {
      start ??= time
      const progress = Math.min(1, (time - start) / GLIDE_MS)
      const eased = 1 - Math.pow(1 - progress, 3)
      if (progress >= 1) {
        stopGlide()
        return setTop(pane, target)
      }
      setTop(pane, from + (target - from) * eased)
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  /** Keep `el` in view as the rule says; see `StoryFollow.follow`. */
  function follow(el: Element, unit = false): void {
    const pane = story.value
    if (!pane) return
    const paneRect = pane.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const line = lineHeightOf(el)
    const top = rect.top - paneRect.top + pane.scrollTop
    const bottom = unit
      ? Math.min(rect.bottom, rect.top + line) - paneRect.top + pane.scrollTop
      : rect.bottom - paneRect.top + pane.scrollTop
    const view = pane.clientHeight
    const room = view < SHORT_PANE_LINES * line ? 0 : ROOM_LINES * line
    const from = goal ?? pane.scrollTop
    if (bottom > from + view - room) moveTo(bottom - view + room)
    else if (top < from) moveTo(top)
  }

  /** Bring the lit word back into view at once; see `StoryFollow.refollow`. */
  function refollow(): void {
    const pane = story.value
    if (!pane || !held.value) return
    const el =
      pane.querySelector('.lq-w-now') ?? pane.querySelector('.lq-speaking')
    if (!el) return
    const unit = !el.classList.contains('lq-w-now')
    stopGlide()
    follow(el, unit)
    // A change of size is answered at once, not with a glide.
    if (goal !== null) {
      const target = goal
      stopGlide()
      setTop(pane, target)
    }
  }

  /** The player tried to scroll the held pane. */
  function attempt(event?: Event): void {
    if (event?.cancelable) event.preventDefault()
    narration.nudgeHint()
  }

  /** The mouse wheel or trackpad over the held pane (a zoom gesture is left alone). */
  function onWheel(event: Event): void {
    if (event instanceof WheelEvent && event.ctrlKey) return
    if (held.value) attempt(event)
  }
  /** A touch drag on the held pane. */
  function onTouchMove(event: Event): void {
    if (held.value) attempt(event)
  }
  /** A scrolling key pressed on the page or in the held pane (not in a field). */
  function onKey(event: KeyboardEvent): void {
    const pane = story.value
    if (!held.value || !pane || !SCROLL_KEYS.has(event.key) || event.altKey)
      return
    const target = event.target instanceof Element ? event.target : null
    const onPage =
      target === document.body || target === document.documentElement
    if (!onPage && !(target && pane.contains(target))) return
    if (target?.closest(EDITABLE)) return
    attempt(event)
  }
  /** The pane scrolled: put it back if the player moved it while held. */
  function onScroll(): void {
    const pane = story.value
    if (!pane) return
    if (!held.value) {
      expectedTop = pane.scrollTop
      return
    }
    const expected = Math.min(expectedTop, maxTop(pane))
    if (Math.abs(pane.scrollTop - expected) <= TOLERANCE) return
    pane.scrollTop = expected
    narration.nudgeHint()
  }
  /** The read-along announced a word or unit to follow. */
  function onFollow(event: Event): void {
    if (!held.value || !(event.target instanceof Element)) return
    event.preventDefault()
    const unit = event instanceof CustomEvent && event.detail?.unit === true
    follow(event.target, unit)
  }

  // The pane's own listeners follow the element, which can be replaced.
  watch(
    story,
    (pane, old) => {
      for (const [type, listener] of [
        ['wheel', onWheel],
        ['touchmove', onTouchMove],
        ['scroll', onScroll],
        [FOLLOW_EVENT, onFollow],
      ] as const) {
        old?.removeEventListener(type, listener)
        pane?.addEventListener(type, listener, { passive: false })
      }
    },
    { immediate: true, flush: 'post' },
  )
  document.addEventListener('keydown', onKey)

  /** Show the end of the story once what the reading ended with is drawn. */
  async function showEnd(): Promise<void> {
    await nextTick()
    const pane = story.value
    if (pane && !held.value) moveTo(maxTop(pane), false)
  }

  // A reading starts from where the pane is; its end leaves the pane free,
  // at the end of the story when it was read to its end.
  watch(
    held,
    (now) => {
      if (now) expectedTop = story.value?.scrollTop ?? 0
      else {
        stopGlide()
        if (narration.readToEnd) void showEnd()
      }
    },
    { flush: 'sync' },
  )

  onScopeDispose(() => {
    stopGlide()
    document.removeEventListener('keydown', onKey)
    const pane = story.value
    pane?.removeEventListener('wheel', onWheel)
    pane?.removeEventListener('touchmove', onTouchMove)
    pane?.removeEventListener('scroll', onScroll)
    pane?.removeEventListener(FOLLOW_EVENT, onFollow)
  })

  return { held, moveTo, follow, refollow }
}

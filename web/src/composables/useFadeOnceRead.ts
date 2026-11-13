import { onScopeDispose, readonly, ref, watch, type Ref } from 'vue'

/** How long a line on the picture takes to fade away once it has been read, in ms (`lantern.css`). */
export const FADE_AWAY_MS = 5000

/**
 * The lines on the picture that fade away once read: the narrator's bubbles
 * (not one still waiting to be shown, such as the chips while the narrator
 * reads), the one column's spoken lines between them, and the rows of speech
 * at the right of the laptop stage.
 */
export const FADING_LINES =
  '.lq-paper-content :is(.lq-bubble:not(.lq-pending), .lq-cl), .lq-speech .lq-ln'

/** What marks a line (or a part of it) as being read aloud now. */
const READING = '.lq-speaking, [data-reading]'

/** The animations that fade a line away (`lantern.css`): moving, or still under Reduce motion. */
const FADES = ['lq-fade-away', 'lq-fade-still']

/** What the layout learns from the fading lines. */
export interface FadeOnceRead {
  /** How many lines are on the picture and not yet gone. */
  live: Readonly<Ref<number>>
}

/**
 * Fade every line on the picture away once it has been read: each element in
 * `container` matching `selector` is marked `data-fade="live"` when it shows,
 * `"away"` once it has been read, which runs its fade (`lantern.css`: clear
 * for 2 s, gone by `FADE_AWAY_MS`, held while the pointer rests on it), and
 * `"gone"` when the fade has run, which takes it and its room away. A line is
 * read once neither it nor a part of it is being read aloud (`.lq-speaking`,
 * `[data-reading]`); a line never read aloud (its turn not narrated, a skip
 * showed it, or it has no recording yet) waits its `data-read-ms` first, the
 * time to read it. It fades whether or not more lines come after it. The marks follow the DOM as lines come and go
 * and as their reading starts and stops; Story so far keeps every line.
 */
export function useFadeOnceRead(
  container: Ref<HTMLElement | null>,
  selector: string,
): FadeOnceRead {
  const live = ref(0)
  let observer: MutationObserver | null = null
  /** The lines waiting their time to read before they fade. */
  const waiting = new Map<Element, ReturnType<typeof setTimeout>>()
  /** The lines seen being read aloud: they fade at once when it ends. */
  const heard = new WeakSet<Element>()

  /** Whether `el`, or a part of it, is being read aloud. */
  function reading(el: Element): boolean {
    return el.matches(READING) || el.querySelector(READING) !== null
  }

  /** Mark every line, start the fade of those read, and count the rest. */
  function mark(root: HTMLElement): void {
    const lines = Array.from(root.querySelectorAll<HTMLElement>(selector))
    for (const [el, timer] of waiting)
      if (!el.isConnected) {
        clearTimeout(timer)
        waiting.delete(el)
      }
    for (const el of lines) {
      if (reading(el)) {
        heard.add(el)
        // Read aloud now: its time to read (if it was waiting) is the voice's.
        clearTimeout(waiting.get(el))
        waiting.delete(el)
        // A row Vue reused for a line being read starts over.
        el.dataset.fade = 'live'
        continue
      }
      if (!el.dataset.fade) el.dataset.fade = 'live'
      if (el.dataset.fade !== 'live' || waiting.has(el)) continue
      const ms = heard.has(el) ? 0 : Number(el.dataset.readMs) || 0
      if (ms <= 0) {
        el.dataset.fade = 'away'
        continue
      }
      waiting.set(
        el,
        setTimeout(() => {
          waiting.delete(el)
          if (el.dataset.fade === 'live') el.dataset.fade = 'away'
        }, ms),
      )
    }
    live.value = lines.filter((el) => el.dataset.fade !== 'gone').length
  }

  /** A line's fade has run: it is gone. */
  function onAnimationEnd(event: Event): void {
    const el = event.target
    if (!(el instanceof HTMLElement) || el.dataset.fade !== 'away') return
    if (!FADES.includes((event as AnimationEvent).animationName)) return
    el.dataset.fade = 'gone'
    if (container.value) mark(container.value)
  }

  /** Stop watching `root`: its observer, its listener and the lines' timers. */
  function stop(root: HTMLElement | null): void {
    observer?.disconnect()
    observer = null
    root?.removeEventListener('animationend', onAnimationEnd)
    for (const timer of waiting.values()) clearTimeout(timer)
    waiting.clear()
  }

  watch(
    container,
    (root, before) => {
      stop(before ?? null)
      if (!root) return
      mark(root)
      root.addEventListener('animationend', onAnimationEnd)
      observer = new MutationObserver(() => mark(root))
      // The tree's shape, classes and reading marks only: the fade marks are `data-fade`, so they never set it off again.
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-reading'],
      })
    },
    { immediate: true, flush: 'post' },
  )
  onScopeDispose(() => stop(container.value))

  return { live: readonly(live) }
}

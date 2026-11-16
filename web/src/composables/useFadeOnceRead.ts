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

/**
 * The columns the fading lines stand in: the speech at the right of the
 * laptop stage, and the narrator's cards (or a phone's one column). Each
 * column's lines fade in their own order, top first.
 */
export const FADING_COLUMNS = '.lq-thread, .lq-paper-content'

/**
 * Event fired (bubbling) on a line the moment it leaves sight: its fade has
 * run (`spent`) or it has gone and taken its room away (`gone`). A column
 * steps a run's name and portrait down to the next line still in sight.
 */
export const LINE_LEFT_EVENT = 'lq-line-left'

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
 * `"gone"` when the fade has run, which takes it and its room away (each
 * leaving fires `LINE_LEFT_EVENT`). A line is
 * read once neither it nor a part of it is being read aloud (`.lq-speaking`,
 * `[data-reading]`); a line never read aloud (its turn not narrated, a skip
 * showed it, or it has no recording yet) waits its `data-read-ms` first, the
 * time to read it. It fades whether or not more lines come after it, but
 * never ahead of the lines above it in its column (the nearest ancestor
 * matching `columns`, else `container`): a line read while one above it still
 * shows starts fading once that one has, and a line whose fade has run while
 * one above it is still there is `"spent"`: it keeps its room, unseen, until
 * that one is gone.
 * So a line going never moves the lines still showing in a column resting at
 * its foot. The marks follow the DOM as lines come and go and as their reading
 * starts and stops; Story so far keeps every line.
 *
 * While `held` says so (the words are hidden), no line fades: a fading one is
 * live again (a spent one stays out of sight) and nothing waits its time to
 * read. Let go, every line still on
 * the picture waits its time to read once more, as if never read aloud, then
 * fades, so words brought back are there to be read.
 */
export function useFadeOnceRead(
  container: Ref<HTMLElement | null>,
  selector: string,
  held: () => boolean = () => false,
  columns: string = '',
): FadeOnceRead {
  const live = ref(0)
  let observer: MutationObserver | null = null
  /** The lines waiting their time to read before they fade. */
  const waiting = new Map<Element, ReturnType<typeof setTimeout>>()
  /** The lines seen being read aloud: they fade at once when it ends. */
  let heard = new WeakSet<Element>()
  /** The lines read, waiting only for a line above them to start fading. */
  let ready = new WeakSet<Element>()

  /** The column `el` stands in, whose lines fade top first. */
  function columnOf(el: Element, root: HTMLElement): Element {
    return (columns && el.closest(columns)) || root
  }

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
    if (held()) {
      for (const timer of waiting.values()) clearTimeout(timer)
      waiting.clear()
      ready = new WeakSet<Element>()
      // A spent line was seen to fade away already, so it stays out of sight.
      for (const el of lines)
        if (el.dataset.fade !== 'gone' && el.dataset.fade !== 'spent')
          el.dataset.fade = 'live'
      live.value = lines.filter((el) => el.dataset.fade !== 'gone').length
      return
    }
    /** Per column: whether every line so far has started fading, and whether every one is gone. */
    const above = new Map<Element, { fading: boolean; gone: boolean }>()
    for (const el of lines) {
      const col = columnOf(el, root)
      const before = above.get(col) ?? { fading: true, gone: true }
      step(el, root, before.fading, before.gone)
      above.set(col, {
        fading: before.fading && el.dataset.fade !== 'live',
        gone: before.gone && el.dataset.fade === 'gone',
      })
    }
    live.value = lines.filter((el) => el.dataset.fade !== 'gone').length
  }

  /**
   * Move one line on: `fadingAbove` says every line above it in its column
   * has started fading, `goneAbove` that every one is gone.
   */
  function step(
    el: HTMLElement,
    root: HTMLElement,
    fadingAbove: boolean,
    goneAbove: boolean,
  ): void {
    if (reading(el)) {
      heard.add(el)
      ready.delete(el)
      // Read aloud now: its time to read (if it was waiting) is the voice's.
      clearTimeout(waiting.get(el))
      waiting.delete(el)
      // A row Vue reused for a line being read starts over.
      el.dataset.fade = 'live'
      return
    }
    if (!el.dataset.fade) el.dataset.fade = 'live'
    if (el.dataset.fade === 'spent' && goneAbove) {
      leave(el, 'gone')
      return
    }
    if (el.dataset.fade !== 'live' || waiting.has(el)) return
    const ms = heard.has(el) ? 0 : Number(el.dataset.readMs) || 0
    if (ready.has(el) || ms <= 0) {
      if (fadingAbove) {
        ready.delete(el)
        el.dataset.fade = 'away'
      } else ready.add(el)
      return
    }
    waiting.set(
      el,
      setTimeout(() => {
        waiting.delete(el)
        if (el.dataset.fade !== 'live') return
        ready.add(el)
        mark(root)
      }, ms),
    )
  }

  /** Mark `el` spent or gone, and say it has left sight. */
  function leave(el: HTMLElement, how: 'spent' | 'gone'): void {
    el.dataset.fade = how
    el.dispatchEvent(new Event(LINE_LEFT_EVENT, { bubbles: true }))
  }

  /** A line's fade has run: it is spent, and gone once every line above it in its column is. */
  function onAnimationEnd(event: Event): void {
    const el = event.target
    if (!(el instanceof HTMLElement) || el.dataset.fade !== 'away') return
    if (!FADES.includes((event as AnimationEvent).animationName)) return
    leave(el, 'spent')
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
  // Let go, the lines brought back are read anew.
  watch(held, (now) => {
    if (!now) heard = new WeakSet<Element>()
    if (container.value) mark(container.value)
  })
  onScopeDispose(() => stop(container.value))

  return { live: readonly(live) }
}

import { computed, nextTick, watch, type Ref } from 'vue'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { wrapWords } from '@/lantern/wrapWords'
import { renderMarkup } from '@/utils/theme'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'

/** How a surface's read-along is limited (see `useReadAlong`). */
export interface ReadAlongOptions {
  /** A selector: only words inside elements matching it are lit, and no unit is announced. */
  within?: string
}

/**
 * The read-along of one narrated surface (a story turn, a chapter page or a
 * quest-complete pop-up), shared so they cannot drift apart. The surface is
 * identified by the id it is narrated under (`useNarrationStore.begin`); its
 * units are numbered as the units given to `begin`.
 *
 * - `shown(unit)`: whether the unit has been revealed yet.
 * - `isSpeaking(unit)`: whether its voice is playing now.
 * - `html(markup, unit, from, to, wordStart)`: the rendered markup of the
 *   unit's parts `from` up to `to` (all of them by default); while the unit is
 *   spoken each word is wrapped and numbered from the start of part `from`
 *   (only when the words match those parts' recordings). With `wordStart` the
 *   markup is only a piece of those parts, starting that many words into them
 *   (a page of an arrival), and its words are numbered from there. A unit shown in several places, such
 *   as a room's name and its description, marks each place with its parts.
 * - `mark(rendered, unit, from, to, wordStart)`: the same for HTML the
 *   surface rendered itself (a quest card's checklist, `questTextHtml`).
 *
 * The composable also lights the spoken word (`.lq-w-now`, found by
 * `[data-w]` inside `root`) and keeps the unit being spoken (`[data-unit]`)
 * in view. Both are announced with a bubbling, cancelable `lq-follow` event
 * (`detail.unit` is true for a unit) so the story pane, which is held still
 * and follows the word (`useStoryFollow`), can scroll itself; a surface where
 * nobody handles it (the chapter page, a pop-up) has the unit scrolled into
 * view as before, and the word is not followed. When another unit starts
 * speaking (the last one was read, hurried, or the reading goes on to a line
 * spoken elsewhere) the unit left is announced again with `detail.end`, so the
 * pane can bring the rest of it into view; nobody else scrolls for that.
 *
 * A surface that holds another surface's words (the phone column, whose cards
 * are story turns with a read-along of their own) passes `options.within`: it
 * then lights only the words inside elements matching that selector, and
 * announces no unit (the spoken lines' surfaces follow their lines whole).
 */
export function useReadAlong(
  id: () => number,
  root: Ref<HTMLElement | null>,
  options: ReadAlongOptions = {},
): {
  shown: (unit: number) => boolean
  isSpeaking: (unit: number) => boolean
  html: (
    markup: string,
    unit: number,
    from?: number,
    to?: number,
    wordStart?: number,
  ) => string
  mark: (
    rendered: string,
    unit: number,
    from?: number,
    to?: number,
    wordStart?: number,
  ) => string
} {
  const narration = useNarrationStore()
  const speaking = computed(() => narration.speaking(id()))

  /** Whether unit `unit` is shown yet. */
  function shown(unit: number): boolean {
    return narration.revealed(id(), unit)
  }

  /** Whether unit `unit` is being spoken now. */
  function isSpeaking(unit: number): boolean {
    return speaking.value?.unit === unit
  }

  /** Which unit has its words marked, and its parts' word counts: unchanged while the word moves, so nothing re-renders per word. */
  const wordMarking = computed((): string => {
    const now = speaking.value
    return now?.aligned ? `${now.unit}:${now.lengths.join(',')}` : ''
  })

  /** The HTML of `markup` (parts `from` to `to` of unit `unit`), with each word marked while the unit is spoken. */
  function html(
    markup: string,
    unit: number,
    from = 0,
    to = Number.POSITIVE_INFINITY,
    wordStart?: number,
  ): string {
    return mark(renderMarkup(markup), unit, from, to, wordStart)
  }

  /** `plain`, HTML already rendered (parts `from` to `to` of unit `unit`), with each word marked while the unit is spoken. */
  function mark(
    plain: string,
    unit: number,
    from = 0,
    to = Number.POSITIVE_INFINITY,
    wordStart?: number,
  ): string {
    const [markedUnit, counts] = wordMarking.value.split(':')
    if (!counts || Number(markedUnit) !== unit) return plain
    const lengths = counts.split(',').map(Number)
    const sum = (list: number[]): number => list.reduce((a, n) => a + n, 0)
    const wrapped = wrapWords(
      plain,
      sum(lengths.slice(0, from)) + (wordStart ?? 0),
    )
    const room = sum(lengths.slice(from, to)) - (wordStart ?? 0)
    // A slice of the parts (a page's piece) may hold fewer words than they do.
    const fits =
      wordStart === undefined ? wrapped.count === room : wrapped.count <= room
    return fits ? wrapped.html : plain
  }

  const scope = options.within ? `${options.within} ` : ''
  /** The unit last spoken, or null before any. */
  let lastUnit: number | null = null

  /** Announce that the reading has left unit `unit`, so its end can be shown. */
  function announceLeft(unit: number): void {
    root.value?.querySelector(`[data-unit="${unit}"]`)?.dispatchEvent(
      new CustomEvent(FOLLOW_EVENT, {
        bubbles: true,
        cancelable: true,
        detail: { unit: true, end: true },
      }),
    )
  }

  // Light the spoken word, and keep the unit being spoken in view.
  watch(
    () => {
      const now = speaking.value
      return now
        ? `${now.unit}:${now.word < 0 ? -1 : now.offset + now.word}`
        : ''
    },
    async (key) => {
      await nextTick()
      root.value?.querySelectorAll(`${scope}.lq-w-now`).forEach((el) => {
        el.classList.remove('lq-w-now')
      })
      const now = speaking.value
      // Left only once another unit speaks: a pause between parts is not leaving.
      if (!now) return
      if (lastUnit !== null && lastUnit !== now.unit && !options.within)
        announceLeft(lastUnit)
      lastUnit = now.unit
      if (now.word >= 0) {
        const lit = root.value?.querySelectorAll(
          `${scope}[data-w="${now.offset + now.word}"]`,
        )
        lit?.forEach((el) => el.classList.add('lq-w-now'))
        lit?.[0]?.dispatchEvent(
          new CustomEvent(FOLLOW_EVENT, { bubbles: true, cancelable: true }),
        )
      }
      if (key.endsWith(':-1') && !options.within) {
        const unit = root.value?.querySelector(`[data-unit="${now.unit}"]`)
        const unhandled = unit?.dispatchEvent(
          new CustomEvent(FOLLOW_EVENT, {
            bubbles: true,
            cancelable: true,
            detail: { unit: true },
          }),
        )
        if (unhandled) unit?.scrollIntoView?.({ block: 'nearest' })
      }
    },
    { flush: 'post' },
  )

  return { shown, isSpeaking, html, mark }
}

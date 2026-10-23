import { computed, nextTick, watch, type Ref } from 'vue'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { wrapWords } from '@/lantern/wrapWords'
import { renderMarkup } from '@/utils/theme'

/**
 * The read-along of one narrated surface (a story turn, a chapter page or a
 * quest-complete pop-up), shared so they cannot drift apart. The surface is
 * identified by the id it is narrated under (`useNarrationStore.begin`); its
 * units are numbered as the units given to `begin`.
 *
 * - `shown(unit)`: whether the unit has been revealed yet.
 * - `isSpeaking(unit)`: whether its voice is playing now.
 * - `html(markup, unit)`: the unit's rendered markup; while it is spoken each
 *   word is wrapped (only when the words match the recording's timings).
 *
 * The composable also lights the spoken word (`.lq-w-now`, found by
 * `[data-w]` inside `root`) and keeps the unit being spoken (`[data-unit]`)
 * in view.
 */
export function useReadAlong(
  id: () => number,
  root: Ref<HTMLElement | null>,
): {
  shown: (unit: number) => boolean
  isSpeaking: (unit: number) => boolean
  html: (markup: string, unit: number) => string
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

  /** Which unit has its words marked, and how many it has: unchanged while the word moves, so nothing re-renders per word. */
  const wordMarking = computed((): string => {
    const now = speaking.value
    return now?.aligned ? `${now.unit}:${now.total}` : ''
  })

  /** The HTML of `markup`, with each word marked while unit `unit` is spoken. */
  function html(markup: string, unit: number): string {
    const plain = renderMarkup(markup)
    const [markedUnit, total] = wordMarking.value.split(':').map(Number)
    if (markedUnit !== unit) return plain
    const wrapped = wrapWords(plain)
    return wrapped.count === total ? wrapped.html : plain
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
      root.value?.querySelectorAll('.lq-w-now').forEach((el) => {
        el.classList.remove('lq-w-now')
      })
      const now = speaking.value
      if (!now) return
      if (now.word >= 0)
        root.value
          ?.querySelectorAll(`[data-w="${now.offset + now.word}"]`)
          .forEach((el) => el.classList.add('lq-w-now'))
      if (key.endsWith(':-1'))
        root.value
          ?.querySelector(`[data-unit="${now.unit}"]`)
          ?.scrollIntoView?.({ block: 'nearest' })
    },
    { flush: 'post' },
  )

  return { shown, isSpeaking, html }
}

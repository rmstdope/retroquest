import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { CompletionState } from '@/stores/useGameStore'

/** The word list of the command box, as the component renders it. */
export interface CommandCompletion {
  /** Whether the list (words or the no-match line) is shown. */
  open: ComputedRef<boolean>
  /** The words offered, in the game's order; empty on no match. */
  suggestions: ComputedRef<string[]>
  /** The highlighted row, or -1 when nothing is highlighted. */
  activeIndex: ComputedRef<number>
  /** True when the list is open only to say that nothing matches. */
  noMatch: ComputedRef<boolean>
  /** The last word being typed (the matching start of each row). */
  word: ComputedRef<string>
  onTab(event: KeyboardEvent): void
  onArrowDown(): void
  onArrowUp(): void
  apply(candidate: string): void
  applyActive(): boolean
  close(): void
}

/**
 * Live completion for a typed command (the Lantern command box). The list
 * follows the text: it shows the words that could come next, pre-picks the
 * first unless the text can already be sent, and says so when nothing
 * matches. Tab and Enter insert a word, the arrow keys move the highlight,
 * `close` hides the list until the text changes again. `completionState`
 * reads the engine's completion tree (game store) and `expand` completes an
 * input further (the store's `tabComplete`).
 */
export function useCommandCompletion(
  text: Ref<string>,
  completionState: (input: string) => CompletionState,
  expand: (input: string) => string,
  enabled: () => boolean,
): CommandCompletion {
  const hidden = ref(false)
  const picked = ref(-1)

  watch(
    text,
    () => {
      hidden.value = false
      picked.value = -1
    },
    { flush: 'sync' },
  )

  const state = computed(() => completionState(text.value))
  const open = computed(
    () =>
      enabled() &&
      text.value.trim() !== '' &&
      !hidden.value &&
      state.value.kind !== 'complete',
  )
  const suggestions = computed(() => (open.value ? state.value.candidates : []))
  const activeIndex = computed(() => {
    const count = suggestions.value.length
    if (count === 0) return -1
    if (picked.value >= 0) return picked.value
    return state.value.sendable ? -1 : 0
  })
  const noMatch = computed(() => open.value && state.value.kind === 'none')
  const word = computed(() => state.value.word)

  function close(): void {
    hidden.value = true
    picked.value = -1
  }

  /** Replace the word being typed with `candidate` and complete further. */
  function apply(candidate: string): void {
    const tokens = text.value.split(' ')
    tokens[tokens.length - 1] = candidate
    text.value = expand(`${tokens.join(' ')} `)
  }

  /** Tab: insert the highlighted word, else the first match. */
  function onTab(event: KeyboardEvent): void {
    if (!enabled()) return
    event.preventDefault()
    const { candidates } = state.value
    if (candidates.length === 0) return
    apply(candidates[activeIndex.value >= 0 ? activeIndex.value : 0])
  }

  function onArrowDown(): void {
    const count = suggestions.value.length
    if (count === 0) return
    picked.value = (activeIndex.value + 1) % count
  }

  function onArrowUp(): void {
    const count = suggestions.value.length
    if (count === 0) return
    picked.value =
      activeIndex.value < 0
        ? count - 1
        : (activeIndex.value - 1 + count) % count
  }

  /**
   * Enter: insert the highlighted word (returns true, nothing to send yet);
   * otherwise return false so the command is sent.
   */
  function applyActive(): boolean {
    if (activeIndex.value < 0) return false
    apply(suggestions.value[activeIndex.value])
    return true
  }

  return {
    open,
    suggestions,
    activeIndex,
    noMatch,
    word,
    onTab,
    onArrowDown,
    onArrowUp,
    apply,
    applyActive,
    close,
  }
}

import { ref, type Ref } from 'vue'

type TabComplete = (input: string) => { newInput: string; candidates: string[] }

/**
 * Keyboard completion for a typed command (the Lantern command box): Tab
 * completes a single match or lists the choices, the arrow
 * keys move through them, Enter applies the highlighted one and Escape closes
 * the list. `tabComplete` walks the engine's completion tree (game store).
 */
export function useCommandCompletion(
  text: Ref<string>,
  tabComplete: TabComplete,
  enabled: () => boolean,
) {
  const suggestions = ref<string[]>([])
  const activeIndex = ref(-1)

  function close(): void {
    suggestions.value = []
    activeIndex.value = -1
  }

  function onTab(event: KeyboardEvent): void {
    if (!enabled()) return
    event.preventDefault()
    const { newInput, candidates } = tabComplete(text.value)
    if (candidates.length === 0) {
      close()
      return
    }
    text.value = newInput
    if (candidates.length === 1) {
      close()
      return
    }
    suggestions.value = candidates
    activeIndex.value = -1
  }

  function onArrowDown(): void {
    if (suggestions.value.length === 0) return
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
  }

  function onArrowUp(): void {
    if (suggestions.value.length === 0) return
    activeIndex.value =
      (activeIndex.value - 1 + suggestions.value.length) %
      suggestions.value.length
  }

  /** Replace the word being typed with `candidate` and complete further. */
  function apply(candidate: string): void {
    const tokens = text.value.trimEnd().split(' ')
    tokens[tokens.length - 1] = candidate
    text.value = tabComplete(tokens.join(' ') + ' ').newInput
    close()
  }

  /**
   * Enter: apply the highlighted choice (returns true, nothing to send yet);
   * otherwise close the list and return false so the command is sent.
   */
  function applyActive(): boolean {
    if (activeIndex.value >= 0 && suggestions.value.length > 0) {
      apply(suggestions.value[activeIndex.value])
      return true
    }
    close()
    return false
  }

  return {
    suggestions,
    activeIndex,
    onTab,
    onArrowDown,
    onArrowUp,
    apply,
    applyActive,
    close,
  }
}

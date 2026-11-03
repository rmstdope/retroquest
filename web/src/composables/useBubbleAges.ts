import { onScopeDispose, watch, type Ref } from 'vue'

/**
 * The stage's bubbles and lines: the narrator's bubbles (not one still
 * waiting to be shown, such as the chips while the narrator reads) and the
 * one column's spoken lines between them.
 */
export const STAGE_BUBBLES = '.lq-bubble:not(.lq-pending), .lq-cl'

/** How far back a bubble was told: the newest, the one before it, or older. */
export type BubbleAge = 'new' | 'prev' | 'old'

/**
 * Dim older bubbles as the speech on the picture dims older lines: every
 * element in `container` matching `selector` gets a `data-age` of `new` (the
 * last one), `prev` (the one before) or `old`, in document order, across the
 * turns it is nested in. The marks follow the DOM as bubbles come and go,
 * and as one starts or stops matching by a change of class.
 */
export function useBubbleAges(
  container: Ref<HTMLElement | null>,
  selector: string,
): void {
  let observer: MutationObserver | null = null

  /** Mark every bubble with its age. */
  function mark(root: HTMLElement): void {
    const bubbles = Array.from(root.querySelectorAll(selector))
    // A bubble that stopped matching (shown no longer) loses its old mark.
    root.querySelectorAll('[data-age]').forEach((marked) => {
      if (!bubbles.includes(marked)) marked.removeAttribute('data-age')
    })
    bubbles.forEach((bubble, index) => {
      const back = bubbles.length - 1 - index
      const age: BubbleAge = back === 0 ? 'new' : back === 1 ? 'prev' : 'old'
      if (bubble.getAttribute('data-age') !== age)
        bubble.setAttribute('data-age', age)
    })
  }

  watch(
    container,
    (root) => {
      observer?.disconnect()
      observer = null
      if (!root) return
      mark(root)
      observer = new MutationObserver(() => mark(root))
      // The tree's shape and classes only: the marks are `data-age`, so they never set it off again.
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      })
    },
    { immediate: true, flush: 'post' },
  )
  onScopeDispose(() => observer?.disconnect())
}

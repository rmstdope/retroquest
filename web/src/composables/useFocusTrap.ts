import type { Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Elements inside `root` that Tab can reach, in order. */
function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
}

/**
 * Keep keyboard focus inside a dialog: bind `onKeydown` to its container so
 * Tab from the last element goes to the first (Shift+Tab the other way),
 * and call `focusFirst` when it opens (an element marked `data-autofocus`
 * wins over the first focusable one).
 */
export function useFocusTrap(root: Ref<HTMLElement | null>) {
  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !root.value) return
    const items = focusables(root.value)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !root.value.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      (active === last || !root.value.contains(active))
    ) {
      event.preventDefault()
      first.focus()
    }
  }

  function focusFirst(): void {
    if (!root.value) return
    const marked = root.value.querySelector<HTMLElement>('[data-autofocus]')
    ;(marked ?? focusables(root.value)[0])?.focus({ preventScroll: true })
  }

  return { onKeydown, focusFirst }
}

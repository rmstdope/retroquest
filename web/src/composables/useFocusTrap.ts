import type { Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]'

/**
 * Elements inside `root` that Tab can reach, in order: rendered ones
 * (`checkVisibility`, where the browser has it) without a negative tabindex.
 */
function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.tabIndex >= 0 && el.checkVisibility?.() !== false,
  )
}

/**
 * Keep keyboard focus inside a dialog: bind `onKeydown` to its container so
 * Tab from the last element goes to the first (Shift+Tab the other way, also
 * from the container itself), and call `focusFirst` when it opens (an element
 * marked `data-autofocus` wins over the first focusable one; with neither,
 * the container gets focus, so give it `tabindex="-1"`).
 */
export function useFocusTrap(root: Ref<HTMLElement | null>) {
  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !root.value) return
    const items = focusables(root.value)
    if (!items.length) {
      event.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    const outside = active === root.value || !root.value.contains(active)
    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault()
      first.focus()
    }
  }

  function focusFirst(): void {
    if (!root.value) return
    const marked = root.value.querySelector<HTMLElement>('[data-autofocus]')
    const target = marked ?? focusables(root.value)[0] ?? root.value
    target.focus({ preventScroll: true })
  }

  return { onKeydown, focusFirst }
}

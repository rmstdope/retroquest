import { useUiSounds } from './useUiSounds'

/**
 * The ring of a keyboard-driven screen (Save, Load, Settings, Quit): the
 * cream outline is focus on a "stop", an element that matches `stopSelector`.
 * Bind `onFocusIn` to the dialog (focus events bubble): the ring arriving on a
 * different stop from somewhere else in the dialog sounds the soft ting (the
 * dialog opening, or focus coming back from outside it, is silent). `ringTo`
 * puts the ring on an element and keeps it in view; `onHover` is a pointer
 * entering a stop, which takes the ring unless it is already inside it.
 * `choose` is the latch of a choice made.
 */
export function useMenuRing(stopSelector: string): {
  onFocusIn(event: FocusEvent): void
  ringTo(element: HTMLElement | null | undefined): void
  onHover(event: MouseEvent): void
  choose(): void
  moved(): void
} {
  const sounds = useUiSounds()

  /** The stop an element is, or is inside. */
  function stopOf(node: EventTarget | null): Element | null {
    return node instanceof Element ? node.closest(stopSelector) : null
  }

  function ringTo(element: HTMLElement | null | undefined): void {
    if (!element) return
    element.focus({ preventScroll: true })
    element.scrollIntoView?.({ block: 'nearest' })
  }

  return {
    onFocusIn(event: FocusEvent): void {
      const root = event.currentTarget
      const from = event.relatedTarget
      const to = stopOf(event.target)
      if (!to || !(root instanceof Node) || !(from instanceof Node)) return
      if (root.contains(from) && stopOf(from) !== to) sounds.playMove()
    },
    ringTo,
    onHover(event: MouseEvent): void {
      const stop = event.currentTarget
      if (!(stop instanceof HTMLElement)) return
      if (!stop.contains(document.activeElement)) ringTo(stop)
    },
    choose: (): void => sounds.playChoose(),
    moved: (): void => sounds.playMove(),
  }
}

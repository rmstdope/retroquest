import { useUiSounds } from './useUiSounds'

/** How long (in milliseconds) a choice keeps the ting quiet. */
const HUSH_MS = 250

/**
 * The ring of a keyboard-driven screen (Save, Load, Settings, Quit): the
 * ring is focus on a "stop", an element that matches `stopSelector`. How it
 * looks is the `[data-ring]` rule in `lantern.css`: mark the ringed element
 * with it.
 * Bind `onFocusIn` to the dialog (focus events bubble): the ring arriving on a
 * different stop from somewhere else in the dialog sounds the soft ting (the
 * dialog opening, or focus coming back from outside it, is silent). `ringTo`
 * puts the ring on an element and keeps it in view; `onMove` is the pointer
 * moving anywhere in the dialog (bind it once, to `mousemove` on the dialog):
 * over a stop it takes the ring, unless the ring is already inside that stop
 * or `canHover` (optional, given the stop) says the stop takes no pointer
 * now. A move event at the same screen position as the last one is the
 * browser re-sending the pointer after a scroll, not the player moving it, so
 * it never takes the ring.
 * `choose` is the latch of a choice made.
 * `afterTab` (bound to a Tab key press) brings the whole stop the ring has
 * reached into view, since the browser scrolls only the focused control, not
 * the row around it.
 */
export function useMenuRing(
  stopSelector: string,
  canHover?: (stop: Element) => boolean,
): {
  onFocusIn(event: FocusEvent): void
  ringTo(element: HTMLElement | null | undefined): void
  onMove(event: MouseEvent): void
  choose(): void
  afterTab(): void
  moved(): void
} {
  const sounds = useUiSounds()
  /** Until when (a time) the ting stays quiet, after a choice. */
  let hushedUntil = 0
  /** Where the pointer was at its last move anywhere in the dialog, if it has moved. */
  let lastPointer: { x: number; y: number } | null = null

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
      if (Date.now() < hushedUntil) return
      if (root.contains(from) && stopOf(from) !== to) sounds.playMove()
    },
    ringTo,
    onMove(event: MouseEvent): void {
      const stop = stopOf(event.target)
      const moved =
        lastPointer !== null &&
        (lastPointer.x !== event.screenX || lastPointer.y !== event.screenY)
      lastPointer = { x: event.screenX, y: event.screenY }
      if (!moved || !(stop instanceof HTMLElement)) return
      if (canHover && !canHover(stop)) return
      if (!stop.contains(document.activeElement))
        stop.focus({ preventScroll: true })
    },
    choose: (): void => {
      hushedUntil = Date.now() + HUSH_MS
      sounds.playChoose()
    },
    afterTab: (): void => {
      setTimeout(() => {
        stopOf(document.activeElement)?.scrollIntoView?.({ block: 'nearest' })
      }, 0)
    },
    moved: (): void => sounds.playMove(),
  }
}

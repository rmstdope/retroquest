import { useUiSounds } from './useUiSounds'

/** How long (in milliseconds) a choice keeps the ting quiet. */
const HUSH_MS = 250

/**
 * The ring of a keyboard-driven screen (Save, Load, Settings, Quit): the
 * cream outline is focus on a "stop", an element that matches `stopSelector`.
 * Bind `onFocusIn` to the dialog (focus events bubble): the ring arriving on a
 * different stop from somewhere else in the dialog sounds the soft ting (the
 * dialog opening, or focus coming back from outside it, is silent). `ringTo`
 * puts the ring on an element and keeps it in view; `onHover` is a pointer
 * moving over a stop (bind it to `mousemove` on each stop), which takes the
 * ring unless it is already inside it. `track` records every pointer move in
 * the dialog (bind it to `mousemove` on the dialog, so it runs after the stop's
 * `onHover`). A move event at the same screen position as the last one is the
 * browser re-sending the pointer after a scroll, not the player moving it, so
 * it never takes the ring.
 * `choose` is the latch of a choice made.
 */
export function useMenuRing(stopSelector: string): {
  onFocusIn(event: FocusEvent): void
  ringTo(element: HTMLElement | null | undefined): void
  onHover(event: MouseEvent): void
  track(event: MouseEvent): void
  choose(): void
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
    onHover(event: MouseEvent): void {
      const stop = event.currentTarget
      if (!(stop instanceof HTMLElement)) return
      const moved =
        lastPointer !== null &&
        (lastPointer.x !== event.screenX || lastPointer.y !== event.screenY)
      if (!moved) return
      if (!stop.contains(document.activeElement))
        stop.focus({ preventScroll: true })
    },
    track(event: MouseEvent): void {
      lastPointer = { x: event.screenX, y: event.screenY }
    },
    choose: (): void => {
      hushedUntil = Date.now() + HUSH_MS
      sounds.playChoose()
    },
    moved: (): void => sounds.playMove(),
  }
}

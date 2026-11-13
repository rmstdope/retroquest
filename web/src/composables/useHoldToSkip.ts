import { onMounted, onUnmounted, readonly, ref, type Ref } from 'vue'

/** How long a press (or Enter, or Space) is held to skip the whole telling, in ms. */
export const HOLD_TO_SKIP_MS = 700

/** How long a press is held before its ring shows, in ms: a plain click never flashes it. */
export const HOLD_RING_MS = 200

/** How far a held press may move (in px) before it is taken as a scroll or a drag and given up. */
export const HOLD_SLOP_PX = 12

/** Where the ring is drawn, in window coordinates. */
export interface HoldRingSpot {
  /** From the window's left edge, in px. */
  x: number
  /** From the window's top edge, in px. */
  y: number
}

/** What the layout needs from a hold to skip. */
export interface HoldToSkipOptions {
  /** The element whose presses may be held (the game, without its dialogs). */
  root: () => HTMLElement | null
  /** Whether the story is being told now: only then does a hold skip. */
  telling: () => boolean
  /** Skip the whole telling: everything left is shown and the player can act. */
  skip: () => void
}

/** A hold to skip as the layout uses it. */
export interface HoldToSkip {
  /** Where the ring is drawn while a hold shows it; null when none does. */
  ring: Readonly<Ref<HoldRingSpot | null>>
  /** Enter or Space went down on the story (its step is taken): hold it to skip; the ring is drawn at `at`. */
  keyDown(key: string, at: HoldRingSpot | null): void
  /** Whether `key` is held down for a hold: its repeats are the hold's and take no step. */
  keyHeld(key: string): boolean
  /** `key` is let go: a hold not yet full is given up. */
  keyUp(key: string): void
}

/** What a press is aimed at that keeps its own presses (and its own long press). */
const OWN_PRESSES =
  'button, a, input, textarea, select, summary, [contenteditable], [role="button"], [role="dialog"]'

/**
 * Press and hold to skip: while the story is told, a tap takes one step (the
 * ordinary click, on its release) and a press held for `HOLD_TO_SKIP_MS`
 * skips the whole telling. The ring shows after `HOLD_RING_MS`; let go
 * before it is full and nothing happens, not even the step, since the player
 * saw they were holding. A press that moves more than `HOLD_SLOP_PX` is a
 * scroll or a drag and is given up. Enter and Space held down do the same
 * (their step is taken on the key-down, by the layout). The click that ends a
 * hold is swallowed, so it never presses the picture the skip has freed, and
 * the phone's own long-press menu is kept away while a hold runs.
 */
export function useHoldToSkip(options: HoldToSkipOptions): HoldToSkip {
  const ring = ref<HoldRingSpot | null>(null)
  /** The press or key being held, while one is. */
  let held: {
    pointer: number | null
    key: string | null
    at: HoldRingSpot | null
  } | null = null
  /** A key the hold has finished with but which is still down (its repeats are swallowed). */
  let spentKey: string | null = null
  let ringTimer: ReturnType<typeof setTimeout> | undefined
  let skipTimer: ReturnType<typeof setTimeout> | undefined
  /** The next click ends a hold and is swallowed. */
  let swallowClick = false

  /** Forget the hold and its ring. */
  function drop(): void {
    clearTimeout(ringTimer)
    clearTimeout(skipTimer)
    held = null
    ring.value = null
  }

  /** Start holding: the ring after a moment, the skip once full. */
  function start(
    pointer: number | null,
    key: string | null,
    at: HoldRingSpot | null,
  ): void {
    drop()
    held = { pointer, key, at }
    ringTimer = setTimeout(() => {
      ring.value = at
    }, HOLD_RING_MS)
    skipTimer = setTimeout(() => {
      const keyDown = held?.key ?? null
      drop()
      spentKey = keyDown
      // The release that follows a pointer hold clicks: it is the hold's.
      swallowClick = keyDown === null
      options.skip()
    }, HOLD_TO_SKIP_MS)
  }

  function onPointerDown(event: PointerEvent): void {
    swallowClick = false
    if (event.button !== 0 || !event.isPrimary) return
    const target = event.target instanceof Element ? event.target : null
    const root = options.root()
    if (!target || !root?.contains(target) || target.closest(OWN_PRESSES))
      return
    if (!options.telling()) return
    start(event.pointerId, null, { x: event.clientX, y: event.clientY })
  }

  function onPointerMove(event: PointerEvent): void {
    if (!held || held.pointer !== event.pointerId || !held.at) return
    const moved = Math.hypot(
      event.clientX - held.at.x,
      event.clientY - held.at.y,
    )
    if (moved <= HOLD_SLOP_PX) return
    // Once the ring showed, the player knew they were holding: the release is no step either.
    swallowClick = ring.value !== null
    drop()
  }

  function onPointerUp(event: PointerEvent): void {
    if (!held || held.pointer !== event.pointerId) return
    // Let go after the ring showed and before it was full: given up, no step.
    swallowClick = ring.value !== null
    drop()
  }

  function onPointerCancel(event: PointerEvent): void {
    if (held && held.pointer === event.pointerId) drop()
  }

  function onClick(event: MouseEvent): void {
    if (!swallowClick) return
    swallowClick = false
    event.preventDefault()
    event.stopPropagation()
  }

  function onContextMenu(event: MouseEvent): void {
    if (held && held.pointer !== null) event.preventDefault()
  }

  function keyDown(key: string, at: HoldRingSpot | null): void {
    spentKey = null
    start(null, key, at)
  }

  function keyHeld(key: string): boolean {
    return held?.key === key || spentKey === key
  }

  function keyUp(key: string): void {
    if (spentKey === key) spentKey = null
    if (held?.key === key) drop()
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointermove', onPointerMove, true)
    document.addEventListener('pointerup', onPointerUp, true)
    document.addEventListener('pointercancel', onPointerCancel, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('contextmenu', onContextMenu, true)
  })
  onUnmounted(() => {
    drop()
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('pointermove', onPointerMove, true)
    document.removeEventListener('pointerup', onPointerUp, true)
    document.removeEventListener('pointercancel', onPointerCancel, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('contextmenu', onContextMenu, true)
  })

  return { ring: readonly(ring), keyDown, keyHeld, keyUp }
}

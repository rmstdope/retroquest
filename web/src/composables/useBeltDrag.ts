import { onScopeDispose, ref, type Ref } from 'vue'
import type { BeltPicture, Hand } from '@/lantern/belt'
import { dragCommand, dragHand, type DragOver } from '@/lantern/beltDrag'

/** A belt picture lifted off its pocket and following the pointer. */
export interface Drag {
  hand: Hand
  /** The key of the pocket it was lifted from. */
  pocketKey: string
  pointerType: string
  /** The pointer, in window pixels. */
  x: number
  y: number
  /** What letting go here would use it with (null: nothing, and so a miss). */
  over: DragOver | null
}

/** How a drag ended: the command to send, or null for a miss (the picture glides back). */
export interface DragEnd {
  hand: Hand
  command: string | null
  pocketKey: string
  /** Where the pointer was when it ended, in window pixels. */
  at: { x: number; y: number }
  pointerType: string
}

/**
 * Dragging a picture of the belt: `lift` starts it, the document's pointer
 * moves carry it and ask `hitTest` what lies under the pointer, and letting go
 * ends it with the command for that target (or none). Escape, a cancelled
 * pointer and a window losing the pointer end it as a miss. It keeps no state
 * but the drag itself, nothing persisted, and its listeners are on the
 * document only while a picture is lifted.
 */
export function useBeltDrag(options: {
  /** What the pointer is over, in window pixels. */
  hitTest: (x: number, y: number) => DragOver | null
  /** The drag is over, by a drop or a miss. */
  onEnd: (end: DragEnd) => void
}): {
  drag: Ref<Drag | null>
  lift: (
    picture: BeltPicture,
    at: { x: number; y: number; pointerType: string },
  ) => void
  cancel: () => void
} {
  const drag = ref<Drag | null>(null)

  function track(event: Event): void {
    const move = event as PointerEvent
    if (!drag.value) return
    drag.value = {
      ...drag.value,
      x: move.clientX,
      y: move.clientY,
      over: options.hitTest(move.clientX, move.clientY),
    }
  }
  function release(event: Event): void {
    track(event)
    finish(true)
  }
  /** Escape ends the drag and is the drag's alone: nothing else (a dialog, the hand) answers it too. */
  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopImmediatePropagation()
    finish(false)
  }
  function miss(): void {
    finish(false)
  }
  function unlisten(): void {
    document.removeEventListener('pointermove', track)
    document.removeEventListener('pointerup', release)
    document.removeEventListener('pointercancel', miss)
    document.removeEventListener('keydown', onKey, true)
    window.removeEventListener('blur', miss)
  }
  /** End the drag; `dropped` says the pointer was let go (a drop on a target sends its command). */
  function finish(dropped: boolean): void {
    const current = drag.value
    unlisten()
    drag.value = null
    if (!current) return
    options.onEnd({
      hand: current.hand,
      pocketKey: current.pocketKey,
      at: { x: current.x, y: current.y },
      pointerType: current.pointerType,
      command: dropped ? dragCommand(current.hand, current.over) : null,
    })
  }
  function lift(
    picture: BeltPicture,
    at: { x: number; y: number; pointerType: string },
  ): void {
    if (drag.value) return
    drag.value = {
      hand: dragHand(picture),
      pocketKey: picture.key,
      pointerType: at.pointerType,
      x: at.x,
      y: at.y,
      over: options.hitTest(at.x, at.y),
    }
    document.addEventListener('pointermove', track)
    document.addEventListener('pointerup', release)
    document.addEventListener('pointercancel', miss)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('blur', miss)
  }
  onScopeDispose(() => {
    unlisten()
    drag.value = null
  })
  return { drag, lift, cancel: () => finish(false) }
}

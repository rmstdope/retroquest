/**
 * Dragging a picture of the belt onto what to use it with, as pure logic: the
 * hand a lifted picture stands for, what the pill under it says, and the
 * command a drop sends. A drop sends exactly what the hand route sends
 * (`handCommand`, `pressedOnBelt`); nothing here is a new command. Knows
 * nothing of Vue, the pointer or the game.
 */
import {
  handCommand,
  handStrip,
  pressedOnBelt,
  type BeltPicture,
  type Hand,
} from './belt'

/** How far (px) a mouse moves with the button down before a press becomes a lift. */
export const DRAG_SLOP = 4

/** What the pointer is over while a picture is lifted: a thing of the room, or a pocket of the belt. */
export type DragOver =
  | { from: 'room'; name: string; label: string; areaId?: string }
  | {
      from: 'belt'
      /** The pocket's key on the belt, for lighting it. */
      key?: string
      name: string
      label: string
      kind: 'item' | 'spell'
    }

/** The hand a lifted belt picture stands for: a thing is used with, a spell cast on. */
export function dragHand(picture: BeltPicture): Hand {
  return {
    kind: picture.kind,
    name: picture.name,
    label: picture.label,
    verb: picture.kind === 'spell' ? 'caston' : 'usewith',
  }
}

/** The command letting go over `over` sends; null where nothing is sent (nothing, a spell over the bag, the picture's own pocket). */
export function dragCommand(hand: Hand, over: DragOver | null): string | null {
  if (!over) return null
  if (over.from === 'room') return handCommand(hand, over)
  // A spell is cast on things of the picture, never on the bag.
  if (hand.kind === 'spell') return null
  return pressedOnBelt(hand, {
    key: `${over.kind}:${over.name}`,
    kind: over.kind,
    name: over.name,
    label: over.label,
    count: 1,
    note: '',
    letter: '',
  })
}

/** What the pill under the lifted picture says: "Use Bread with…" over nothing, "Use Bread with Grandmother" over a target. */
export function dragPill(hand: Hand, over: DragOver | null): string {
  if (!dragCommand(hand, over) || !over) return handStrip(hand)
  const joiner = hand.verb === 'usewith' ? 'with' : 'on'
  return `${hand.verb === 'usewith' ? 'Use' : 'Cast'} ${hand.label} ${joiner} ${over.label}`
}

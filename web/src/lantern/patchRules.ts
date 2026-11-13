/**
 * Helpers for the rules patches carry (`ImagePatch.when`): reading a flag a
 * content class may have, and the description a room now carries.
 */
import type { PatchContext } from './roomPatches'

/** Reads a boolean field a content class may carry, without naming the class. */
export function flagOf(thing: unknown, field: string): boolean {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    field in thing &&
    (thing as Record<string, unknown>)[field] === true
  )
}

/** Whether the room `roomKey` now carries one of the `texts` as its description (a text the story sets and a save keeps). */
export function roomSays(
  c: PatchContext,
  roomKey: string,
  texts: readonly string[],
): boolean {
  return texts.includes(c.state.allRooms[roomKey]?.description ?? '')
}

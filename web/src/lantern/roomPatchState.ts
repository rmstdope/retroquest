/**
 * Which of a room picture's patches apply to the story as it stands.
 *
 * Each patch carries its own `when` (see `roomPatches.ts`): `'present'` applies
 * while the patch's named area (see `roomAreas.ts`) is in the room (a way is
 * "in the room" while the room's exits include it), `'absent'` while it is not,
 * and a rule of its own reads the thing's own state or a story flag. Nothing
 * is saved: the answer is read from the game every time, so a loaded game
 * answers as the played one did.
 */
import type { Act, Character, GameState, Item } from '@/engine'
import { exitAreaId, thingAreaId } from './roomAreas'
import {
  declaredPatches,
  type ImagePatch,
  type PatchContext,
} from './roomPatches'

/** Whether `patch` applies in `context`, given the area ids `present` in the room. */
function applies(
  patch: ImagePatch,
  context: PatchContext,
  present: ReadonlySet<string>,
): boolean {
  if (typeof patch.when === 'function') return patch.when(context)
  if (patch.area === undefined) return false
  return patch.when === 'present'
    ? present.has(patch.area)
    : !present.has(patch.area)
}

/**
 * The ids of the patches of room `roomKey` of `act` that apply now, lowest
 * layer first and equal layers by id (declaration order means nothing); none
 * for a room that is unknown or has none. With a `variant` (the room's other
 * picture), those of that picture.
 */
export function appliedPatchIds(
  act: Act,
  roomKey: string,
  state: GameState,
  variant = '',
): string[] {
  // The state's own rooms: after a load they are not the act's first instances.
  const room = state.allRooms[roomKey]
  const patches = declaredPatches(act.name, roomKey, variant)
  if (!room || patches.length === 0) return []
  const things = new Map<string, Item | Character>()
  for (const thing of [...room.items, ...room.characters])
    things.set(thingAreaId(act, thing), thing)
  const present = new Set(things.keys())
  for (const direction of Object.keys(room.getExits(state)))
    present.add(exitAreaId(direction))
  const context: PatchContext = { things, state }
  return layeredIds(patches.filter((patch) => applies(patch, context, present)))
}

/** The ids of `patches` lowest layer first and equal layers by id, so the order they were declared in changes nothing. */
export function layeredIds(patches: readonly ImagePatch[]): string[] {
  return [...patches]
    .sort(
      (a, b) =>
        (a.layer ?? 0) - (b.layer ?? 0) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    .map((patch) => patch.id)
}

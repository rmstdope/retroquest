/**
 * The patches of a room's picture: the small changes the picture needs as the
 * story moves on (a thing taken, a character gone, a way opened), each with an
 * id, a title and the words for the edit. A patch about one thing links to that
 * thing's named area (`roomAreas.ts`), so the navigator need not mark the spot
 * twice. A change that alters the whole view is another picture, not a patch.
 * The declared lists live in `roomPatches/act<N>RoomPatches.ts`; a patch not
 * made yet is not a defect. The base picture shows the room as the game
 * starts: a thing there at the start has a taken or gone patch, a thing or a
 * way that only turns up later an appears or open patch. A thing that changes
 * state (a candle lit, a well purified) has a patch of its own; `roomStateChanges.test.ts`
 * holds the golden-path changes against the patches, or the reason one needs none. Sir Cedric, who follows the player through a
 * whole act, has none.
 */
import { ACT1_ROOM_PATCHES } from './roomPatches/act1RoomPatches'
import { ACT2_ROOM_PATCHES } from './roomPatches/act2RoomPatches'
import { ACT3_ROOM_PATCHES } from './roomPatches/act3RoomPatches'
import { ACT4_ROOM_PATCHES } from './roomPatches/act4RoomPatches'

/** One patch of a room image, in Content Studio's list format. */
export interface ImagePatch {
  /** Stable slug, unique within the image: `<thing>-<change>`. */
  id: string
  /** Shown in the studio: the change as a short fact ("Bread taken"). */
  title: string
  /** The words for the edit, as the image's own `text` is called. */
  text: string
  /** The id of the named area of the same image this patch is about; absent for a patch about no one thing. */
  area?: string
}

/** The declared patches of each room of each act, by act name then room key. */
const ROOM_PATCHES: Readonly<
  Record<string, Readonly<Record<string, readonly ImagePatch[]>>>
> = {
  Act1: ACT1_ROOM_PATCHES,
  Act2: ACT2_ROOM_PATCHES,
  Act3: ACT3_ROOM_PATCHES,
  Act4: ACT4_ROOM_PATCHES,
}

/** The patches declared for room `roomKey` of act `actName`; none for a room without a declaration. */
export function declaredPatches(
  actName: string,
  roomKey: string,
): readonly ImagePatch[] {
  return ROOM_PATCHES[actName]?.[roomKey] ?? []
}

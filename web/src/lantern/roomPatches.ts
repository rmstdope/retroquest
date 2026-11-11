/**
 * The patches of a room's picture: the small changes the picture needs as the
 * story moves on (a thing taken, a character gone, a way opened), each with an
 * id, a title and the words for the edit. A patch about one thing links to that
 * thing's named area (`roomAreas.ts`), so the navigator need not mark the spot
 * twice. A change that alters the whole view is another picture, not a patch;
 * the Village Chapel's candle-lit, whose light covers almost the whole picture,
 * is the agreed exception. Patches that are on together are laid in their
 * declared order, a later one over an earlier one. The declared lists live
 * in `roomPatches/act<N>RoomPatches.ts`; a patch not made yet is not a defect. The base picture shows the room as the game
 * starts: a thing there at the start has a taken or gone patch, a thing or a
 * way that only turns up later an appears or open patch, unless the change
 * needs no patch of its own (`unpatchedAreas`). A thing that changes
 * state (a candle lit, a well purified) has a patch of its own;
 * `roomStateChanges.test.ts` holds the golden-path changes against the
 * patches, or the reason one needs none. Sir Cedric, who follows the player
 * through a whole act, has none.
 */
import {
  ACT1_ROOM_PATCHES,
  ACT1_VARIANT_PATCHES,
  ACT1_UNPATCHED_AREAS,
} from './roomPatches/act1RoomPatches'
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

/**
 * The patches of each other picture a room has (`Room.pictureVariants`), by act
 * name, room key, then variant. Each picture has its own patches, as it has
 * its own areas.
 */
const VARIANT_PATCHES: Readonly<
  Record<
    string,
    Readonly<Record<string, Readonly<Record<string, readonly ImagePatch[]>>>>
  >
> = { Act1: ACT1_VARIANT_PATCHES }

/**
 * The patches declared for room `roomKey` of act `actName`; none for a room
 * without a declaration. With a `variant` (a room's other picture), the
 * patches of that picture instead.
 */
export function declaredPatches(
  actName: string,
  roomKey: string,
  variant = '',
): readonly ImagePatch[] {
  if (variant) return VARIANT_PATCHES[actName]?.[roomKey]?.[variant] ?? []
  return ROOM_PATCHES[actName]?.[roomKey] ?? []
}

/** The areas whose arrival needs no patch of its own, by act name, room key, then area id, with the reason. */
const UNPATCHED_AREAS: Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>
> = { Act1: ACT1_UNPATCHED_AREAS }

/**
 * The area ids of room `roomKey` of act `actName` whose arrival needs
 * no patch of its own (a way painted open from the start, a thing another
 * patch shows); none for most rooms.
 */
export function unpatchedAreas(
  actName: string,
  roomKey: string,
): readonly string[] {
  return Object.keys(UNPATCHED_AREAS[actName]?.[roomKey] ?? {})
}

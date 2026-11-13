/**
 * The patches of a room's picture: the small changes the picture needs as the
 * story moves on (a thing taken, a character gone, a way opened), each with an
 * id, a title and the words for the edit. A patch about one thing links to that
 * thing's named area (`roomAreas.ts`), so the navigator need not mark the spot
 * twice. A change that alters the whole view is another picture, not a patch;
 * the Village Chapel's candle-lit, whose light covers almost the whole picture,
 * is the agreed exception. Patches that are on together are laid by their
 * `layer`, a higher one over a lower; declaration order means nothing. The
 * declared lists live in `roomPatches/act<N>RoomPatches.ts`; a patch not made
 * yet is not a defect. The base picture shows the room as the game starts: a
 * thing there at the start has a taken or gone patch, a thing or a way that
 * only turns up later an appears or open patch, unless the change needs no
 * patch of its own (the area's `unpatched` reason). A thing that changes state
 * (a candle lit, a well purified) has a patch of its own;
 * `roomStateChanges.test.ts` holds the golden-path changes against the
 * patches, or the reason one needs none. Sir Cedric, who follows the player
 * through a whole act, has none.
 */
import type { Character, GameState, Item } from '@/engine'
import {
  ACT1_ROOM_PATCHES,
  ACT1_VARIANT_PATCHES,
} from './roomPatches/act1RoomPatches'
import { ACT2_ROOM_PATCHES } from './roomPatches/act2RoomPatches'
import { ACT3_ROOM_PATCHES } from './roomPatches/act3RoomPatches'
import { ACT4_ROOM_PATCHES } from './roomPatches/act4RoomPatches'

/** What a patch rule reads: the room's things by area id, and the game state. */
export interface PatchContext {
  /** The room's items and characters, by their area id. */
  things: ReadonlyMap<string, Item | Character>
  /** The game state, whose own rooms a loaded game keeps. */
  state: GameState
}

/**
 * When a patch applies: `'present'` while the thing (or way) of its `area` is
 * in the room, `'absent'` while it is not, or a rule of its own, read from the
 * thing's state or a story flag.
 */
export type PatchWhen = 'present' | 'absent' | ((c: PatchContext) => boolean)

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
  /** When the patch applies; every patch says, so none exists without its rule. */
  when: PatchWhen
  /** Where the patch lies when several apply: a higher layer over a lower, equal layers in no order. Default 0. */
  layer?: number
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

/** A patch as Content Studio's list holds it: its id, title, words and area, without the rule. */
export type ListedPatch = Omit<ImagePatch, 'when' | 'layer'>

/** The Content Studio list form of `patch`. */
export function listedPatch(patch: ImagePatch): ListedPatch {
  return {
    id: patch.id,
    title: patch.title,
    text: patch.text,
    ...(patch.area !== undefined ? { area: patch.area } : {}),
  }
}

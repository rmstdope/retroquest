/**
 * The shape of a room picture's patches, which each act declares for its own
 * rooms (`Act.roomPatches`) and the lantern reads to decide what a picture
 * shows (`lantern/roomPatchState.ts`).
 */
import type { Character } from './Character'
import type { GameState } from './GameState'
import type { Item } from './Item'

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

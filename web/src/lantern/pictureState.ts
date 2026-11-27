/**
 * The shape of the room's picture: what it holds as the game says it is now,
 * its one empty value, and the part of it a save keeps. A new fact about the
 * picture is a field of `EMPTY` here and a line where the bridge reads it from
 * the game; it is saved unless `SavePicture` names it as read again.
 */
import type { AreaThing } from './areaThings'

/** The picture's fields at their empty values; it declares `PictureState`. */
const EMPTY = {
  /** The room the picture is of; '' while no room is known. */
  roomKey: '',
  /** The room's other picture the story has changed to; '' for its plain one. */
  variant: '',
  /** The ids of the room's patches that apply, in the order they are laid. */
  patchIds: [] as string[],
  /** The area each of the room's patches is about, by patch id (a patch of the whole picture has none). */
  patchAreas: {} as Record<string, string>,
  /** What is in the room that the picture's areas can mark. */
  things: [] as AreaThing[],
}

/** The room the picture is of, the ids of its patches that apply, and what is in the room that its areas can mark. */
export type PictureState = typeof EMPTY

/** The picture while no room is known: a fresh copy of the empty value. */
export function emptyPicture(): PictureState {
  return structuredClone(EMPTY)
}

/**
 * The picture a save was made looking at, filed with the act's name as
 * pictures are filed under it (`Act1`): every field of the picture except the
 * ones a loaded game reads from the room again.
 */
export type SavePicture = Omit<PictureState, 'patchAreas' | 'things'> & {
  actName: string
}

/** The part of `picture` a save keeps. */
export function savedPictureOf(
  actName: string,
  picture: PictureState,
): SavePicture {
  const { patchAreas: _patchAreas, things: _things, ...kept } = picture
  return { actName, ...kept }
}

/** A stored picture as it is read: a field the save was made before is empty. */
export function readSavedPicture(stored: SavePicture): SavePicture {
  return savedPictureOf(stored.actName, { ...emptyPicture(), ...stored })
}

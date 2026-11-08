/**
 * Where a room's picture is served from: the image Content Studio made for the
 * room, named by the same id as the room's entry in the act's image list.
 */
import { roomTrackId } from './musicLists'
import { ELIOR_PORTRAIT_ID, portraitId } from './imageLists'

/**
 * The URL of the picture of a room, or '' while no room is known. The file may
 * not exist yet (pictures are made by hand after the room is listed); the
 * stage then shows its paper backdrop.
 */
export function roomPictureUrl(actName: string, roomKey: string): string {
  if (!actName || !roomKey) return ''
  return `${import.meta.env.BASE_URL}images/generated/${roomTrackId(actName, roomKey)}.png`
}

/**
 * The URL of a character's portrait: the image Content Studio made for the
 * character class `classKey` of the act, named as the act's image list names
 * it (one file for a character who appears in several acts). The file may
 * not exist yet; the speech then shows an initial card.
 */
export function portraitUrl(actName: string, classKey: string): string {
  if (!actName || !classKey) return ''
  return `${import.meta.env.BASE_URL}images/generated/${portraitId(actName, classKey)}.png`
}

/**
 * The URL of Elior's portrait, one file for every act. The file may not exist
 * yet; his lines then show the initial card.
 */
export function eliorPortraitUrl(): string {
  return `${import.meta.env.BASE_URL}images/generated/${ELIOR_PORTRAIT_ID}.png`
}

/**
 * The URL of a patch of a room's picture: the transparent picture Content
 * Studio makes for it, named `<image id>.<patch id>.png` beside the room's
 * picture. The file may not exist (a patch is made by hand when the story
 * calls for it); `madePatches` says which the images manifest lists.
 */
export function roomPatchUrl(
  actName: string,
  roomKey: string,
  patchId: string,
): string {
  if (!actName || !roomKey) return ''
  return `${import.meta.env.BASE_URL}images/generated/${roomTrackId(actName, roomKey)}.${patchId}.png`
}

/**
 * The ids of the patches the images manifest lists under image `imageId`.
 * Tolerant of anything: a manifest that is not an object, an image with no
 * `patches` key (a game that has none made) or an entry that is not an
 * object all give none.
 */
export function madePatches(manifest: unknown, imageId: string): string[] {
  if (typeof manifest !== 'object' || manifest === null) return []
  const image: unknown = (manifest as Record<string, unknown>)[imageId]
  if (typeof image !== 'object' || image === null) return []
  const patches: unknown = (image as Record<string, unknown>).patches
  if (typeof patches !== 'object' || patches === null) return []
  return Object.keys(patches)
}

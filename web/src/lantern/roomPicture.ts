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

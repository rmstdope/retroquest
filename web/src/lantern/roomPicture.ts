/**
 * Where a room's picture is served from: the image Content Studio made for the
 * room, named by the same id as the room's entry in the act's image list.
 */
import { roomTrackId } from './musicLists'

/**
 * The URL of the picture of a room, or '' while no room is known. The file may
 * not exist yet (pictures are made by hand after the room is listed); the
 * stage then shows its paper backdrop.
 */
export function roomPictureUrl(actName: string, roomKey: string): string {
  if (!actName || !roomKey) return ''
  return `${import.meta.env.BASE_URL}images/generated/${roomTrackId(actName, roomKey)}.png`
}

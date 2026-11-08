/**
 * Where a room's picture is served from: the image Content Studio made for the
 * room, named by the same id as the room's entry in the act's image list.
 */
import { roomTrackId } from './musicLists'
import { ELIOR_PORTRAIT_ID, portraitId } from './imageLists'

/**
 * The URL of the picture of a room, or '' while no room is known. `variant`
 * names another picture the room has (`Room.pictureVariant`), whose id adds
 * `-<variant>`; '' is the room's one picture. The file may not exist yet
 * (pictures are made by hand after the room is listed); the stage then shows
 * its paper backdrop, or the room's own picture where a variant is not made.
 */
export function roomPictureUrl(
  actName: string,
  roomKey: string,
  variant = '',
): string {
  if (!actName || !roomKey) return ''
  const id = roomTrackId(actName, roomKey)
  return `${import.meta.env.BASE_URL}images/generated/${variant ? `${id}-${variant}` : id}.png`
}

/** Whether the file at a URL is a picture that loads. */
type PictureProbe = (url: string) => Promise<boolean>

/** The browser's check: the file loads as an image. */
const loadsAsImage: PictureProbe = (url) =>
  new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve(false)
    const image = new Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })

let probe: PictureProbe = loadsAsImage
const answers: Record<string, Promise<boolean>> = {}

/** Replace the picture check (tests); null restores the browser's and forgets the answers. */
export function setPictureProbe(replacement: PictureProbe | null): void {
  probe = replacement ?? loadsAsImage
  for (const url of Object.keys(answers)) delete answers[url]
}

/**
 * Whether the picture at `url` exists and loads, asked once per file. A room's
 * other picture is shown only once this says yes, so a picture not made yet
 * never blanks the stage. A "no" is kept for the page's lifetime: pictures
 * are painted outside the game, and a reload asks again.
 */
export function pictureExists(url: string): Promise<boolean> {
  answers[url] ??= probe(url)
  return answers[url]
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

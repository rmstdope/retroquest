/**
 * The list of images Content Studio's images workspace reads from the game
 * (`tts/act<N>/images.json`): one image per room of each act, then one portrait
 * per character the act registers. The description is the room's base
 * description, or the character's own, with the markup removed, the studio's
 * starting prompt; the shared style is in `images/style.json`. The tts script
 * `extract-act.ts` writes the lists.
 */
import { Character, type Act } from '@/engine'
import { displayName } from './displayName'
import { narrationText } from './narrationKey'
import { roomTrackId } from './musicLists'

/** Width in pixels of every image. */
export const IMAGE_WIDTH = 640
/** Height in pixels of every image. */
export const IMAGE_HEIGHT = 360

/** Width in pixels of every portrait. */
export const PORTRAIT_WIDTH = 480
/** Height in pixels of every portrait (upright, 3:4). */
export const PORTRAIT_HEIGHT = 640

/** One image in Content Studio's format. */
export interface GameImage {
  /** Slug naming the image's files in the studio; unique across the game, same as the room's music track. */
  id: string
  /** Shown in the studio: the room's or the character's name. */
  title: string
  /** Width in pixels. */
  width: number
  /** Height in pixels. */
  height: number
  /** The room's or character's description, markup removed, which the studio starts its prompt from. */
  description: string
}

/** One image for each room of the act, described by the room's own description. */
export function roomImages(act: Act): GameImage[] {
  return Object.entries(act.rooms).map(([key, room]) => ({
    id: roomTrackId(act.name, key),
    title: room.name,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    description: narrationText(room.description),
  }))
}

/**
 * One portrait for each character the act registers (`act.classes`, so those
 * who arrive mid-story are found too), described by the character's own
 * description. A name two classes share is listed once, the first class
 * winning. Ids are `act<N>-portrait-<class key>`, apart from every room id.
 */
export function characterImages(act: Act): GameImage[] {
  const seen = new Set<string>()
  const images: GameImage[] = []
  for (const [key, C] of Object.entries(act.classes)) {
    if (!(C.prototype instanceof Character)) continue
    const character = new (C as unknown as new () => Character)()
    const name = character.name.toLowerCase()
    if (seen.has(name)) continue
    seen.add(name)
    images.push({
      id: roomTrackId(act.name, `Portrait ${key}`),
      title: displayName(character.name),
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
      description: narrationText(character.description),
    })
  }
  return images
}

/** Everything the act's list holds: its room images, then its portraits. */
export function allImages(act: Act): GameImage[] {
  return [...roomImages(act), ...characterImages(act)]
}

/**
 * The list of images Content Studio's images workspace reads from the game: one
 * image per room of each act (`tts/act<N>/images.json`). The description is
 * the room's base description with the markup removed, the studio's starting
 * prompt; the shared style is in `images/style.json`. The tts script
 * `extract-act.ts` writes the lists.
 */
import type { Act } from '@/engine'
import { narrationText } from './narrationKey'
import { roomTrackId } from './musicLists'

/** Width in pixels of every image. */
export const IMAGE_WIDTH = 640
/** Height in pixels of every image. */
export const IMAGE_HEIGHT = 360

/** One image in Content Studio's format. */
export interface GameImage {
  /** Slug naming the image's files in the studio; unique across the game, same as the room's music track. */
  id: string
  /** Shown in the studio: the room's name. */
  title: string
  /** Width in pixels. */
  width: number
  /** Height in pixels. */
  height: number
  /** The room's base description, markup removed, which the studio starts its prompt from. */
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

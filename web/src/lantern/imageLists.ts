/**
 * The list of images Content Studio's images workspace reads from the game
 * (`tts/act<N>/images.json`): one image per room of each act, then one portrait
 * per character the act registers (one portrait, in every act, for a character
 * who appears in several). The description is the room's base
 * description with the markup removed, or the character's hand-written face
 * portrait prompt, the studio's starting prompt; the shared style is in `images/style.json`. The tts script
 * `extract-act.ts` writes the lists.
 */
import { Character, type Act } from '@/engine'
import { displayName } from './displayName'
import { narrationText } from './narrationKey'
import { ELIOR_PORTRAIT_PROMPT, PORTRAIT_PROMPTS } from './portraitPrompts'
import { roomTrackId } from './musicLists'

/** Width in pixels of every image. */
export const IMAGE_WIDTH = 640
/** Height in pixels of every image. */
export const IMAGE_HEIGHT = 360

/** Width in pixels of every portrait. */
export const PORTRAIT_WIDTH = 480
/** Height in pixels of every portrait (upright, 3:4). */
export const PORTRAIT_HEIGHT = 640

/**
 * The class keys of the characters who appear in more than one act. Each has a
 * single portrait, `portrait-<class>`, listed in every act it appears in. A
 * test keeps this list equal to the characters the acts register.
 */
export const SHARED_PORTRAITS: readonly string[] = [
  'Grandmother',
  'Mira',
  'Nyx',
  'SirCedric',
]

/** The id of Elior's portrait, the one face his lines wear in every act. */
export const ELIOR_PORTRAIT_ID = 'portrait-elior'

/**
 * The id of the portrait of character class `classKey` in act `actName`: the
 * act-free `portrait-<class>` for a character of several acts, else
 * `act<N>-portrait-<class>`.
 */
export function portraitId(actName: string, classKey: string): string {
  return SHARED_PORTRAITS.includes(classKey)
    ? roomTrackId('Portrait', classKey)
    : roomTrackId(actName, `Portrait ${classKey}`)
}

/** One image in Content Studio's format. */
export interface GameImage {
  /** Slug naming the image's files in the studio; unique across the game apart from a shared portrait, which every act that has the character lists; a room's is its music track id, a portrait's `act<N>-portrait-<class>`, or `portrait-<class>` when the character is in several acts. */
  id: string
  /** Shown in the studio: the room's or the character's name. */
  title: string
  /** Width in pixels. */
  width: number
  /** Height in pixels. */
  height: number
  /** The room's description, markup removed, or the character's face portrait prompt, which the studio starts its prompt from. */
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

/** The hand-written portrait prompt of character class `classKey`; a character without one is a mistake. */
function portraitPrompt(classKey: string): string {
  const prompt = PORTRAIT_PROMPTS[classKey]
  if (prompt === undefined) {
    throw new Error(`No portrait prompt for character ${classKey}`)
  }
  return prompt
}

/**
 * One portrait for each character the act registers (`act.classes`, so those
 * who arrive mid-story are found too), described by its hand-written face
 * portrait prompt in `PORTRAIT_PROMPTS` (the character itself supplies only the
 * name for the title). A name two classes share is listed
 * once, the first class winning. Ids come from `portraitId`. A shared portrait
 * is listed in every act it appears in with the title and description of the
 * first of `acts` (the whole game, in order) that registers it, so the studio
 * sees one entry. Elior, who is no class, is listed last, the same in every act.
 */
export function characterImages(act: Act, acts: Act[] = [act]): GameImage[] {
  const seen = new Set<string>()
  const images: GameImage[] = []
  for (const [key, C] of Object.entries(act.classes)) {
    if (!(C.prototype instanceof Character)) continue
    const name = new (C as unknown as new () => Character)().name.toLowerCase()
    if (seen.has(name)) continue
    seen.add(name)
    const owner = SHARED_PORTRAITS.includes(key)
      ? (acts.find((a) => key in a.classes) ?? act)
      : act
    const character = new (owner.classes[
      key
    ] as unknown as new () => Character)()
    images.push({
      id: portraitId(act.name, key),
      title: displayName(character.name),
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
      description: portraitPrompt(key),
    })
  }
  images.push({
    id: ELIOR_PORTRAIT_ID,
    title: 'Elior',
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
    description: ELIOR_PORTRAIT_PROMPT,
  })
  return images
}

/** Everything the act's list holds: its room images, then its portraits (`acts` is the whole game, in order). */
export function allImages(act: Act, acts: Act[] = [act]): GameImage[] {
  return [...roomImages(act), ...characterImages(act, acts)]
}

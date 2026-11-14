/**
 * The list of images Content Studio's images workspace reads from the game
 * (`tts/act<N>/images.json`): one image per room of each act, then one portrait
 * per character the act registers (one portrait, in every act, for a character
 * who appears in several). An image's words (`text`) are the room's base
 * description with the markup removed, or the character's hand-written face
 * portrait prompt, the studio's starting prompt; the shared style is the
 * studio's, in `content-studio/images/edits.json`. A room image also lists its
 * named areas (`roomAreas.ts`) and its patches (`roomPatches.ts`). The tts script
 * `extract-act.ts` writes the lists.
 */
import { Character, Item, Spell, type Act, type ImagePatch } from '@/engine'
import { displayName } from './displayName'
import { narrationText } from './narrationKey'
import { BELT_STYLE, SPELL_PROMPTS, THING_PROMPTS } from './beltPrompts'
import { ELIOR_PORTRAIT_PROMPT, PORTRAIT_PROMPTS } from './portraitPrompts'
import { roomTrackId } from './musicLists'
import { declaredAreas, type ImageArea } from './roomAreas'
import { spotAreas } from './roomMotion'
import { listedPatch, type ListedPatch } from './roomPatches'

/** Width in pixels of every room image. */
export const IMAGE_WIDTH = 1920
/** Height in pixels of every room image. */
export const IMAGE_HEIGHT = 1080

/** Width in pixels of every portrait. */
export const PORTRAIT_WIDTH = 480
/** Height in pixels of every portrait (upright, 3:4). */
export const PORTRAIT_HEIGHT = 640

/** Width and height in pixels of every thing's and spell's picture (square). */
export const BELT_SIZE = 256

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
  text: string
  /** A room image's named areas: one for each item, character, scenery piece and exit that can ever be in the room, which the navigator places on the image in the studio. Absent for a portrait. */
  areas?: ImageArea[]
  /** A room image's patches: the small changes the picture needs, each linked to the area of the thing it is about. Absent for a portrait and for a room with no small change. */
  patches?: ListedPatch[]
}

/**
 * One image for each room of the act, described by the room's own
 * description, then one for each other picture a room has
 * (`Room.pictureVariants`): the id adds `-<variant>`, the title is
 * "<room>, <variant>", the words are the room's description to start from and
 * the areas those declared for that picture.
 */
export function roomImages(act: Act): GameImage[] {
  const rooms = Object.entries(act.rooms)
  /** One room image: the room's own picture, or another of its pictures. */
  const image = (
    id: string,
    title: string,
    text: string,
    areas: readonly ImageArea[],
    patches: readonly ImagePatch[],
  ): GameImage => ({
    id,
    title,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    text,
    areas: areas.map(({ id, title }) => ({ id, title })),
    ...(patches.length > 0 ? { patches: patches.map(listedPatch) } : {}),
  })
  const own = rooms.map(([key, room]) =>
    image(
      roomTrackId(act.name, key),
      room.name,
      narrationText(room.description),
      [...declaredAreas(act.name, key), ...spotAreas(act.name, key)],
      act.roomPatches(key),
    ),
  )
  const others = rooms.flatMap(([key, room]) =>
    room
      .pictureVariants()
      .map((variant) =>
        image(
          `${roomTrackId(act.name, key)}-${variant}`,
          `${room.name}, ${variant}`,
          narrationText(room.description),
          [
            ...declaredAreas(act.name, key, variant),
            ...spotAreas(act.name, key),
          ],
          act.roomPatches(key, variant),
        ),
      ),
  )
  return [...own, ...others]
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
 * is listed in every act it appears in with the title and words of the
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
      text: portraitPrompt(key),
    })
  }
  images.push({
    id: ELIOR_PORTRAIT_ID,
    title: 'Elior',
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
    text: ELIOR_PORTRAIT_PROMPT,
  })
  return images
}

/**
 * The id of the picture of a thing (`item`) or a spell (`spell`) on the belt:
 * `<kind>-<name>`, the name lower case, a state in brackets at its end ("lantern
 * (lit)", "bucket (full)") left off, apostrophes dropped and every other run of
 * non-alphanumerics a hyphen. It has no act: a name has one picture wherever it
 * appears.
 */
export function beltImageId(kind: 'item' | 'spell', name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${kind}-${slug}`
}

/**
 * The classes (by class key) of things that are not carriable when built but are
 * handed over or picked up in play, so they reach the belt; a test plays each
 * act's golden path to check it, but only what the path carries; a new
 * handed-over thing (the shop's wares are bought by Elior) is added here by hand.
 */
const CARRIED_LATER: readonly string[] = [
  'AncientAmulet',
  'Apple',
  'Armor',
  'ExtendedMagneticFishingRod',
  'ForestHeartCrystal',
  'MagneticFishingRod',
  'Matches',
  'NaturesCharm',
  'NyxToken',
  'PhoenixFeather',
  'RoomKey',
  'Rope',
  'SecretDocuments',
  'Sword',
]

/** The other names a thing takes in play that show with a picture of their own, by class key (a revived carrot, a strengthened stone). */
const RENAMED: Readonly<Record<string, readonly string[]>> = {
  EchoStone: ['enhanced echo stone'],
  WitheredCarrot: ['fresh carrot'],
}

/** A fresh instance of a content class that builds without arguments, else null (scenery that needs its room). */
function bareInstance(C: unknown): unknown {
  try {
    return new (C as new () => unknown)()
  } catch {
    return null
  }
}

/**
 * One picture for every thing that can be carried and every spell the act
 * registers (`act.classes`), named by the name the belt shows (`beltImageId`),
 * so a name that returns in a later act is the same entry there. The words are
 * the hand-written line of `beltPrompts.ts` followed by `BELT_STYLE`; the
 * picture is square. A carriable thing or a spell without a line is a mistake.
 */
export function beltImages(act: Act): GameImage[] {
  const images = new Map<string, GameImage>()
  /** Lists one thing or spell by the name the belt shows it under. */
  const list = (kind: 'item' | 'spell', name: string): void => {
    const id = beltImageId(kind, name)
    if (images.has(id)) return
    const prompt = (kind === 'item' ? THING_PROMPTS : SPELL_PROMPTS)[id]
    if (prompt === undefined) {
      throw new Error(`No picture line for ${kind} ${name} (${id})`)
    }
    images.set(id, {
      id,
      title: displayName(name),
      width: BELT_SIZE,
      height: BELT_SIZE,
      text: `${prompt} ${BELT_STYLE}`,
    })
  }
  for (const [key, C] of Object.entries(act.classes)) {
    const prototype = (C as { prototype: unknown }).prototype
    if (!(prototype instanceof Item || prototype instanceof Spell)) continue
    const thing = bareInstance(C)
    if (thing instanceof Spell) list('spell', thing.name)
    else if (
      thing instanceof Item &&
      (thing.canBeCarried || CARRIED_LATER.includes(key))
    ) {
      list('item', thing.name)
      for (const name of RENAMED[key] ?? []) list('item', name)
    }
  }
  return [...images.values()]
}

/** The id of the title screen's picture, listed once for the whole game (in the first act's list). */
export const TITLE_IMAGE_ID = 'title-screen'

/**
 * The title screen's picture, which the navigator makes in the studio: open
 * sky at the top for the game's name and a calm middle for the buttons. Until
 * it is made the title shows the opening dream's picture.
 */
export function titleImage(): GameImage {
  return {
    id: TITLE_IMAGE_ID,
    title: 'Title screen',
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    text:
      'The world of RetroQuest at the start of the story: a quiet village ' +
      'under a lantern-lit dusk, drawn with open sky across the top third ' +
      "for the game's name and a calm, uncluttered middle for the buttons.",
  }
}

/** Everything the act's list holds: its room images, its portraits, then its belt pictures (`acts` is the whole game, in order). */
export function allImages(act: Act, acts: Act[] = [act]): GameImage[] {
  return [...roomImages(act), ...characterImages(act, acts), ...beltImages(act)]
}

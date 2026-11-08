/**
 * The named areas of a room's picture: one for every item, character, scenery
 * piece and exit that can ever be in the room, each with a stable id and a
 * title. The game never holds coordinates; the navigator places the areas on
 * the image in Content Studio, and an area not placed yet is not a defect.
 *
 * An id comes from the game object and never from its displayed name, which
 * changes ("bucket" becomes "bucket (full)"): a scenery piece is
 * `scenery-<key>`, any other thing the kebab-case of the key its class has in
 * the act's registry (so a bundler renaming classes changes nothing; a thing
 * that comes in sides, the three ward stones, adds its side), an exit
 * `exit-<direction>`. The declared lists live in `roomAreas/act<N>RoomAreas.ts`
 * and cover what turns up later in the story too, so they cannot be read from a
 * room's starting contents; the golden-path tests check them against play.
 * A thing a carried item puts in whatever room the player stands in (an item
 * dropped, a candle's locket) is not counted as the room's own.
 */
import type { Act, Character, Item } from '@/engine'
import { ACT1_ROOM_AREAS, ACT1_VARIANT_AREAS } from './roomAreas/act1RoomAreas'
import { ACT2_ROOM_AREAS } from './roomAreas/act2RoomAreas'
import { ACT3_ROOM_AREAS } from './roomAreas/act3RoomAreas'
import { ACT4_ROOM_AREAS } from './roomAreas/act4RoomAreas'

/** One named area of a room image, in Content Studio's list format. */
export interface ImageArea {
  /** Stable slug, unique within the image; never derived from a displayed name. */
  id: string
  /** Shown in the studio: the thing's name as the story first meets it. */
  title: string
}

/** The declared areas of each room of each act, by act name then room key. */
const ROOM_AREAS: Readonly<
  Record<string, Readonly<Record<string, readonly ImageArea[]>>>
> = {
  Act1: ACT1_ROOM_AREAS,
  Act2: ACT2_ROOM_AREAS,
  Act3: ACT3_ROOM_AREAS,
  Act4: ACT4_ROOM_AREAS,
}

/**
 * The declared areas of each other picture a room has (`Room.pictureVariants`),
 * by act name, room key, then variant: the things that can be found on that
 * picture. The room's own list is `ROOM_AREAS`, for the picture without a variant.
 */
const VARIANT_AREAS: Readonly<
  Record<
    string,
    Readonly<Record<string, Readonly<Record<string, readonly ImageArea[]>>>>
  >
> = { Act1: ACT1_VARIANT_AREAS }

/** "MysteriousBox" as "mysterious-box", "abandoned-shed.boards" as "abandoned-shed-boards". */
function kebab(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .toLowerCase()
}

/** The stable area id of an item or character of `act`; throws for a class the act does not register. */
export function thingAreaId(act: Act, thing: Item | Character): string {
  const key = Object.keys(act.classes).find(
    (k) => act.classes[k] === thing.constructor,
  )
  if (key === undefined) {
    throw new Error(`${act.name} does not register ${thing.constructor.name}`)
  }
  const sceneryKey = (thing as { key?: unknown }).key
  if (key === 'Scenery' && typeof sceneryKey === 'string') {
    return `scenery-${kebab(sceneryKey)}`
  }
  const side = (thing as { side?: unknown }).side
  return typeof side === 'string' ? `${kebab(key)}-${kebab(side)}` : kebab(key)
}

/** The stable area id of the exit in `direction`: `exit-secret_passage` is `exit-secret-passage`. */
export function exitAreaId(direction: string): string {
  return `exit-${kebab(direction)}`
}

/**
 * The areas declared for room `roomKey` of act `actName`; none for a room
 * without a declaration. With a `variant` (a room's other picture), the areas
 * of that picture instead.
 */
export function declaredAreas(
  actName: string,
  roomKey: string,
  variant = '',
): readonly ImageArea[] {
  if (variant) return VARIANT_AREAS[actName]?.[roomKey]?.[variant] ?? []
  return ROOM_AREAS[actName]?.[roomKey] ?? []
}

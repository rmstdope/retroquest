/**
 * What is in a room right now that a named area of its picture can mark: each
 * person, thing, piece of scenery and way out, with the id of its area (see
 * `roomAreas.ts`), the name the picture shows for it and its kind (which
 * decides its colour). Read from the game every time, so a loaded game
 * answers as the played one did; nothing is saved.
 */
import type { Act, Character, GameState, Item } from '@/engine'
import { displayName } from './displayName'
import { exitArrow } from './exitArrow'
import { declaredAreas, exitAreaId, thingAreaId } from './roomAreas'

/** One thing in the room that its picture may mark. */
export interface AreaThing {
  /** The id of the thing's area in the room's picture. */
  areaId: string
  /** The name the picture shows: as the room's corner names it, a piece of scenery by its area's title, a way out by its arrow and the place it leads to. */
  label: string
  /** Decides the colour: people blue, things that can be picked up green, ways out amber, scenery plain. */
  kind: 'character' | 'item' | 'scenery' | 'exit'
}

/** The area id of a thing, or null for one its act does not register (it has no area to mark). */
function areaIdOrNull(act: Act, thing: Item | Character): string | null {
  try {
    return thingAreaId(act, thing)
  } catch {
    return null
  }
}

/** The things and ways out in room `roomKey` now, for the picture of the room; none for a room the state does not hold. */
export function areaThingsOf(
  act: Act,
  roomKey: string,
  state: GameState,
): AreaThing[] {
  const room = state.allRooms[roomKey]
  if (!room) return []
  const titles = new Map(
    declaredAreas(act.name, roomKey).map((area) => [area.id, area.title]),
  )
  const things: AreaThing[] = []
  for (const character of room.characters) {
    const areaId = areaIdOrNull(act, character)
    if (areaId === null) continue
    things.push({
      areaId,
      label: displayName(character.name),
      kind: 'character',
    })
  }
  for (const item of room.items) {
    const areaId = areaIdOrNull(act, item)
    if (areaId === null) continue
    const scenery = areaId.startsWith('scenery-')
    things.push({
      areaId,
      label: scenery
        ? (titles.get(areaId) ?? displayName(item.name))
        : displayName(item.name),
      kind: scenery ? 'scenery' : 'item',
    })
  }
  for (const [direction, key] of Object.entries(room.getExits(state))) {
    const place =
      room.exitLabel(state, direction) ?? state.allRooms[key]?.name ?? key
    things.push({
      areaId: exitAreaId(direction),
      label: `${exitArrow(direction)} ${place}`,
      kind: 'exit',
    })
  }
  return things
}

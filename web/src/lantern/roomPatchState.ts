/**
 * Which of a room picture's patches apply to the story as it stands.
 *
 * A patch about one thing is judged by that thing's named area (see
 * `roomAreas.ts`) and the ending of the patch's id: `-appears` applies while
 * the thing is in the room, `-taken`, `-gone`, `-cut` and `-closed` while it is
 * not (a way is "in the room" while the room's exits include it), and `-open`
 * while the way exists. The few patches that name another kind of change (a
 * lantern lit, a carrot revived, a ward purified) have a rule of their own in
 * `STATE_RULES`, written from the thing's own state or a story flag. Nothing
 * is saved: the answer is read from the game every time, so a loaded game
 * answers as the played one did.
 */
import type { Act, Character, GameState, Item } from '@/engine'
import { FLAG_ACT4_SERVANTS_FREED } from '@/act4/Act4StoryFlags'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_SHADOW_REVEAL_HEARD,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from '@/act4/Act4StoryFlags'
import { exitAreaId, thingAreaId } from './roomAreas'
import { declaredPatches, type ImagePatch } from './roomPatches'

/** What a rule reads: the room's things by area id, and the game state. */
interface PatchContext {
  things: ReadonlyMap<string, Item | Character>
  state: GameState
}

/** Reads a boolean field a content class may carry, without naming the class. */
function flagOf(thing: unknown, field: string): boolean {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    field in thing &&
    (thing as Record<string, unknown>)[field] === true
  )
}

/** The rules of the patches whose change is not a thing coming or going, by `<Act>.<patch id>`. */
const STATE_RULES: Readonly<Record<string, (c: PatchContext) => boolean>> = {
  'Act1.lantern-lit': (c) => {
    const lantern = c.things.get('lantern')
    return (
      !!lantern &&
      'isLit' in lantern &&
      typeof lantern.isLit === 'function' &&
      lantern.isLit() === true
    )
  },
  'Act1.withered-carrot-fresh': (c) =>
    c.things.get('withered-carrot')?.name === 'fresh carrot',
  'Act3.warding-pillars-purified': (c) =>
    flagOf(c.things.get('warding-pillars'), 'purified'),
  'Act3.lantern-bracket-mounted': (c) =>
    flagOf(c.things.get('lantern-bracket'), 'hasLantern'),
  'Act4.trapped-servants-freed': (c) =>
    c.state.getStoryFlag(FLAG_ACT4_SERVANTS_FREED),
  'Act4.knight-of-despair-redeemed': (c) =>
    c.state.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED),
  'Act4.sorceress-of-lies-unmasked': (c) =>
    c.state.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED),
  'Act4.shadow-of-the-past-revealed': (c) =>
    c.state.getStoryFlag(FLAG_ACT4_SHADOW_REVEAL_HEARD),
}

/** The endings of ids whose patch applies while its thing is present. */
const PRESENT = /-(appears|open)$/
/** The endings of ids whose patch applies while its thing is absent. */
const ABSENT = /-(taken|gone|cut|closed)$/

/** The rule key of a patch of an act. */
function ruleKey(actName: string, patch: ImagePatch): string {
  return `${actName}.${patch.id}`
}

/** Whether the game can judge `patch` of room `roomKey`: by its ending and area, or by a rule of its own. */
export function patchIsKnown(
  actName: string,
  _roomKey: string,
  patch: ImagePatch,
): boolean {
  if (ruleKey(actName, patch) in STATE_RULES) return true
  return (
    patch.area !== undefined &&
    (PRESENT.test(patch.id) || ABSENT.test(patch.id))
  )
}

/**
 * The ids of the patches of room `roomKey` of `act` that apply now, in the
 * order they are declared; none for a room that is unknown or has none.
 */
export function appliedPatchIds(
  act: Act,
  roomKey: string,
  state: GameState,
): string[] {
  // The state's own rooms: after a load they are not the act's first instances.
  const room = state.allRooms[roomKey]
  const patches = declaredPatches(act.name, roomKey)
  if (!room || patches.length === 0) return []
  const things = new Map<string, Item | Character>()
  for (const thing of [...room.items, ...room.characters])
    things.set(thingAreaId(act, thing), thing)
  const present = new Set(things.keys())
  for (const direction of Object.keys(room.getExits(state)))
    present.add(exitAreaId(direction))
  const context: PatchContext = { things, state }
  return patches
    .filter((patch) => {
      const rule = STATE_RULES[ruleKey(act.name, patch)]
      if (rule) return rule(context)
      if (patch.area === undefined) return false
      if (PRESENT.test(patch.id)) return present.has(patch.area)
      if (ABSENT.test(patch.id)) return !present.has(patch.area)
      return false
    })
    .map((patch) => patch.id)
}

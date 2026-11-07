import { Room, characterName, speech } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestHermit } from '../characters/ForestHermit'
import { StandingStones } from '../items/StandingStones'
import { greendaleWorkDone } from '../greendaleWork'

const HERMIT_BEFORE_CAMP =
  'A robed figure sits among the stones, watching the trees.'
const HERMIT_AFTER_CAMP =
  `The ${characterName('forest hermit')} sits by the cold ashes of your camp ` +
  'in the lee of the oldest stone.'

/**
 * The room text before the hermit's sentence. Kept here, not read back from
 * the saved `description` field, so a save made under the older wording (which
 * already ends with the hermit sentence) never shows two of them.
 */
const BASE_DESCRIPTION =
  'The mountain path ends at a ring of standing stones, grey and mossed, ' +
  'with runes cut deep in them. Past the stones the trees begin all at ' +
  'once, close and dark.'

/** The hermit's word at the way east while Greendale still has work for the player. */
const GREENDALE_FIRST =
  `The ${characterName('forest hermit')} steps between you and the trees. ` +
  speech(
    "Not yet. You've left things half done in Greendale, and she'll know " +
      "it. Go back and finish them. She'll keep.",
  )

/**
 * Forest Transition room: flag-gated boundary into the enchanted interior.
 *
 * `getExits()` hides `east` until Greendale preparation and the hermit's
 * warning are complete; while Greendale's quests remain, `blockedExit()` has
 * the hermit send the player back to the city.
 */
export class ForestTransition extends Room {
  constructor() {
    super({
      name: 'Forest Transition',
      description: BASE_DESCRIPTION,
      items: [new StandingStones()],
      characters: [new ForestHermit()],
      exits: { west: 'MountainPath', east: 'ForestEntrance' },
    })
  }

  /** The description, ending with the hermit among the stones or by the camp's ashes. */
  override descriptionFor(gameState: GameState): string {
    const hermit = gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)
      ? HERMIT_AFTER_CAMP
      : HERMIT_BEFORE_CAMP
    return `${BASE_DESCRIPTION} ${hermit}`
  }

  /** Return exits; hide east until Greendale preparation and the hermit's warning are complete. */
  override getExits(gameState: GameState): Exits {
    const exits: Exits = { ...super.getExits(gameState) }
    if (
      !greendaleWorkDone(gameState) ||
      !gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)
    ) {
      delete exits.east
    }
    return exits
  }

  /** At the shut way east, the hermit sends the player back to Greendale while its quests remain. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction === 'east' && !greendaleWorkDone(gameState)) {
      return GREENDALE_FIRST
    }
    return null
  }
}

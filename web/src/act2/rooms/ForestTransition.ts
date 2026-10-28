import { Room, characterName } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestHermit } from '../characters/ForestHermit'
import { StandingStones } from '../items/StandingStones'

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
  'The boundary between the civilized mountain paths and the wild Enchanted Forest. ' +
  'Ancient standing stones mark the threshold, carved with protective runes that ' +
  'pulse with faint magic. The air grows thicker and you sense ancient power ' +
  'awakening. Beyond lies a realm where normal rules may not apply.'

const PRE_FOREST_QUESTS = [
  "The Knight's Test",
  'Supplies for the Journey',
  'Echoes of the Past',
  "The Healer's Apprentice",
  'The Ancient Library',
]

/**
 * Forest Transition room: flag-gated boundary into the enchanted interior.
 *
 * `getExits()` hides `east` until Greendale preparation and the hermit's
 * warning are complete.
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
    const greendaleQuestsComplete = PRE_FOREST_QUESTS.every((questName) =>
      gameState.isQuestCompleted(questName),
    )
    if (
      !greendaleQuestsComplete ||
      !gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)
    ) {
      delete exits.east
    }
    return exits
  }
}

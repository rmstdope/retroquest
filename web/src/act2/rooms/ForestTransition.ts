import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestHermit } from '../characters/ForestHermit'
import { StandingStones } from '../items/StandingStones'

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
      description:
        'The boundary between the civilized mountain paths and the wild Enchanted Forest. ' +
        'Ancient standing stones mark the threshold, carved with protective runes that ' +
        'pulse with faint magic. The air grows thicker and you sense ancient power ' +
        'awakening. Beyond lies a realm where normal rules may not apply. ' +
        'A robed figure sits peacefully among the stones.',
      items: [new StandingStones()],
      characters: [new ForestHermit()],
      exits: { west: 'MountainPath', east: 'ForestEntrance' },
    })
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

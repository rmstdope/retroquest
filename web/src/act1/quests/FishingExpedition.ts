import { characterName, Quest, type GameState } from '@/engine'
import { FLAG_TALKED_TO_FISHERMAN } from '../Act1StoryFlags'

/** Side quest: help the troubled fisherman. */
export class FishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Fishing expedition',
      description:
        `The ${characterName('fisherman')} at the bend can't fish with his stiff arm, ` +
        'and he would give a good deal for a fresh fish.',
      completion:
        `You brought the ${characterName('fisherman')} a fish, ` +
        "and he gave you back something of your mother's: " +
        'the spell she taught him at the bend.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_TALKED_TO_FISHERMAN)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.hasSpell('purify')
  }
}

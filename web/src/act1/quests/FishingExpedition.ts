import { Quest, type GameState } from '@/engine'
import { FLAG_TALKED_TO_FISHERMAN } from '../Act1StoryFlags'

/** Side quest: help the troubled fisherman. */
export class FishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Fishing expedition',
      description:
        "You can't help but feel sorry for the fisherman—he seems troubled and in need of help. Perhaps if you assist him, you'll uncover something important.",
      completion:
        'You have helped the fisherman and learned something new about the world around you. Your kindness is rewarded.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_TALKED_TO_FISHERMAN)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.hasSpell('purify')
  }
}

import { Room, type GameState, event } from '@/engine'
import { TrappedServants } from '../characters/TrappedServants'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { ServantsPendant } from '../items/ServantsPendant'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
} from '../Act4StoryFlags'

/**
 * A once-beautiful courtyard now tainted by shadow magic and trapped souls.
 *
 * Introduces themes of compassion through freeing enslaved servants: the
 * Guardian's essence and blessing magic are required to break their chains.
 */
export class OuterCourtyard extends Room {
  constructor() {
    super({
      name: 'Outer Courtyard',
      description:
        'What was once a magnificent courtyard now writhes under a shroud of despair. ' +
        'Withered fountains weep black tears, and twisted statues reach toward a sky ' +
        'that seems perpetually stormy. Ethereal figures wander in endless circles, ' +
        'their faces etched with torment as dark chains bind their spirits to this ' +
        'cursed ground. The very stones beneath your feet pulse with anguish, and ' +
        'the air tastes of lost hope and forgotten dreams.',
      items: [],
      characters: [new TrappedServants()],
      exits: { west: 'FortressGates', north: 'MirrorLabyrinth' },
    })
  }

  /** Handle examining specific targets in the room. */
  examine(gameState: GameState, target: string): string {
    const targetLower = target.toLowerCase()
    if (targetLower.includes('servant')) {
      const servants = this.getCharacterByName('Trapped Servants')
      if (servants) {
        return servants.examine(gameState)
      }
      return event(
        'The servants have been freed and are no longer trapped here.',
      )
    }
    return event(
      `You examine the ${target} but find nothing particularly ` +
        'noteworthy about it.',
    )
  }

  /** Handle casting bless spell on servants. */
  castBless(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return (
        '[failure]The servants do not trust you enough to accept your blessing. ' +
        'You must prove your worthiness first.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      gameState.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
      // Add the loyalty token and pendant to the room
      this.addItem(new LoyaltyToken())
      this.addItem(new ServantsPendant())
      // Remove the trapped servants and replace with freed servants
      this.characters.splice(0)
      return event(
        'Your blessing magic flows out like golden light, shattering ' +
          'the dark chains that bind the servants. They cry out in joy as their ' +
          "spirits are freed from Malakar's curse. In gratitude, they offer you " +
          'a loyalty token and a pendant that will help guide you through the ' +
          'trials ahead.',
      )
    }
    return '[dim]The servants have already been freed from their cursed bonds.[/dim]'
  }
}

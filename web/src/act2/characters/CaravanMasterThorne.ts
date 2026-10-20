import { Character, type GameState } from '@/engine'
import {
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_LOST_CARAVAN_COMPLETED,
} from '../Act2StoryFlags'
import { SecretDocuments } from '../items/SecretDocuments'

/** Merchant NPC who triggers and rewards the lost caravan side quest. */
export class CaravanMasterThorne extends Character {
  hasGivenDocuments = false

  constructor() {
    super({
      name: 'caravan master thorne',
      description:
        'A weather-beaten man with worried eyes who oversees merchant caravans. ' +
        'He paces anxiously, clearly distressed about some urgent matter.',
    })
  }

  /** Offer the lost caravan quest, nag about it, or hand over the reward. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)) {
      if (!this.hasGivenDocuments) {
        // Give Secret Documents as reward
        const secretDocs = new SecretDocuments()
        gameState.inventory.push(secretDocs)
        this.hasGivenDocuments = true
        // Set the flag indicating the lost caravan quest is completed
        gameState.setStoryFlag(FLAG_LOST_CARAVAN_COMPLETED, true)
        const prefix = `[character_name]${this.name}[/character_name]: [dialogue]You've found them! `
        const middle =
          'I cannot express my gratitude enough for bringing my people back safely. ' +
          'As promised, here is your reward - but this is more than just payment. ' +
          'These documents came into my possession years ago, and I believe they ' +
          "contain evidence that could clear a good man's name. Perhaps you'll " +
          'know what to do with them.\n\n'
        return (
          prefix +
          middle +
          `Thorne hands you a stack of [item_name]${secretDocs.name}[/item_name].[/dialogue]`
        )
      } else {
        return (
          `[character_name]${this.name}[/character_name]: [dialogue]I'm still processing ` +
          'the relief of having my caravan safely returned. Those documents I ' +
          'gave you - I hope they prove useful. Sometimes the right evidence ' +
          'can restore honor where it was unjustly lost.[/dialogue]'
        )
      }
    } else if (!gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)) {
      gameState.setStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER, true)
      return (
        `[character_name]${this.name}[/character_name]: [dialogue]Thank the gods, someone ` +
        'who looks capable! I desperately need help - one of my most valuable ' +
        'caravans has gone missing in the Enchanted Forest. It was carrying rare ' +
        'goods and several merchants. I fear the worst, but I must know their fate. ' +
        'Would you be willing to search for them? I would be forever in your debt.[/dialogue]'
      )
    } else {
      return (
        `[character_name]${this.name}[/character_name]: [dialogue]Any word on my missing ` +
        'caravan? Every day that passes makes me fear the worst for those poor ' +
        'souls.[/dialogue]'
      )
    }
  }
}

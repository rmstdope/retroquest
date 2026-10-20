import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_LOYALTY_TOKEN_ACQUIRED } from '../Act4StoryFlags'

/** A token that proves the bonds of trust with freed allies. */
export class LoyaltyToken extends Item {
  private protectionActive = false

  constructor() {
    super({
      name: 'Loyalty Token',
      description:
        'A small silver medallion bearing the emblem of intertwined hands. ' +
        'The surface is warm to the touch and emanates a sense of trust and ' +
        'loyalty. This token represents the bonds formed with those you have ' +
        'helped, and serves as proof against deception and lies.',
      canBeCarried: true,
    })
  }

  /** Set flag when the token is picked up. */
  override pickedUp(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_ACQUIRED, true)
    return ''
  }

  /** Use the loyalty token to resist deception. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name === 'Tower of Shadows') {
      if (!this.protectionActive) {
        this.protectionActive = true
        return (
          '[event]You hold the Loyalty Token close to your heart, feeling the ' +
          "warmth of true friendship and trust. The token's power forms a " +
          'protective barrier against the lies and deceptions that whisper ' +
          'through the shadowy tower.[/event]'
        )
      }
      return '[dim]The Loyalty Token is already protecting you from deception.[/dim]'
    }
    return (
      '[event]The Loyalty Token glows softly, ready to prove the strength ' +
      'of your bonds when facing deception.[/event]'
    )
  }
}

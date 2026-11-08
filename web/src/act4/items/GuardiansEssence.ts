import { Item, type Character, type GameState } from '@/engine'
import {
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
} from '../Act4StoryFlags'
import { TrappedServants } from '../characters/TrappedServants'
import { HallOfEchoes } from '../rooms/HallOfEchoes'
import { OuterCourtyard } from '../rooms/OuterCourtyard'

/** The distilled essence of a guardian's courage, enabling acts of selflessness. */
export class GuardiansEssence extends Item {
  constructor() {
    super({
      name: "Guardian's Essence",
      description:
        'A small, steady light the colour of a candle flame, left where the ' +
        'last guardian stood. Whoever the guardians were made from was brave ' +
        'once. The light remembers it.',
      canBeCarried: true,
    })
  }

  /** Also answers to "essence", what the story calls it. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'essence'
  }

  /** Use Guardian's Essence on servants to prove worthiness. */
  override useOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (
      targetCharacter instanceof TrappedServants &&
      gameState.currentRoom instanceof OuterCourtyard
    ) {
      return this.showToServants(gameState)
    }
    return super.useOnCharacter(gameState, targetCharacter)
  }

  /**
   * Held up in the courtyard it is shown to the servants, the only ones there
   * who will look; elsewhere the light only answers the place.
   */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof OuterCourtyard) {
      return this.showToServants(gameState)
    }
    if (gameState.currentRoom instanceof HallOfEchoes) {
      return 'The light steadies in the old hall, as if it has been here before.'
    }
    return 'The light sits warm in your hand, waiting for someone to show it to.'
  }

  /** Showing the essence earns the servants' trust, once; freed, they need no proof. */
  private showToServants(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return '[dim]The servants look at the light, and then at their ankles, where the chains were.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      gameState.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
      return (
        'The servants stop their circling and gather to look at the ' +
        "[item_name]guardian's essence[/item_name]. One reaches " +
        'out, but does not touch. They know what it is, and what it cost. ' +
        'For the first time, they look at you instead of through you.'
      )
    }
    return '[dim]The servants already know you. They watch you, and wait.[/dim]'
  }
}

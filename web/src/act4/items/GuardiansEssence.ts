import { Item, type Character, type GameState } from '@/engine'
import { FLAG_ACT4_SERVANTS_TRUST_EARNED } from '../Act4StoryFlags'
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

  /** Use Guardian's Essence on servants to prove worthiness. */
  override useOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (
      targetCharacter instanceof TrappedServants &&
      gameState.currentRoom instanceof OuterCourtyard
    ) {
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
    return super.useOnCharacter(gameState, targetCharacter)
  }

  /** Use Guardian's Essence to prove worthiness. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof OuterCourtyard) {
      return (
        'The light warms your hands. Across the courtyard, one of the ' +
        'servants stops walking and turns towards it.'
      )
    }
    if (gameState.currentRoom instanceof HallOfEchoes) {
      return 'The light steadies in the old hall, as if it has been here before.'
    }
    return 'The light sits warm in your hand, waiting for someone to show it to.'
  }
}

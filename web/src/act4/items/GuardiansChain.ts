import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
import { HallOfEchoes } from '../rooms/HallOfEchoes'

/** How the chain looks: silver, with the crystals the hall and the captain see. */
const CHAIN_DESCRIPTION =
  'A silver chain set with small crystals, each link inscribed with runes. ' +
  'It bound the guardians to the stones; now it binds nothing.'

/** A mystical chain that provides protection against dark magic. */
export class GuardiansChain extends Item {
  constructor() {
    super({
      name: "Guardian's Chain",
      description: CHAIN_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** The chain's look, from the constant, so an old save shows its crystals too. */
  override examine(_gameState: GameState): string {
    return CHAIN_DESCRIPTION
  }

  /** The chain's welcome when it is picked up. */
  override pickedUp(_gameState: GameState): string {
    return 'The chain is warm, and its crystals brighten a little in your hands.'
  }

  /** Activate the chain's protective properties. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof HallOfEchoes) {
      if (!gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED, true)
        return (
          'You hold the chain up between you and the knight. The crystals ' +
          'catch what little light there is and keep it. ' +
          'His sorrow is still there, but it no longer reaches you.'
        )
      }
      return '[dim]The chain is already lit. His sorrow does not reach you.[/dim]'
    }
    return (
      'The crystals stay quiet. Whatever the chain was made to stand ' +
      'against, it is not here.'
    )
  }
}

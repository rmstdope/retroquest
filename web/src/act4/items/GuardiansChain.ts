import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
import { HallOfEchoes } from '../rooms/HallOfEchoes'

/** A mystical chain that provides protection against dark magic. */
export class GuardiansChain extends Item {
  constructor() {
    super({
      name: "Guardian's Chain",
      description:
        'A silver chain, each link inscribed with runes. It bound the ' +
        'guardians to the stones; now it binds nothing.',
      canBeCarried: true,
    })
  }

  /** The chain's welcome when it is picked up. */
  override pickedUp(_gameState: GameState): string {
    return (
      'A surge of protective energy courses through your body. ' +
      "The chain's light grows brighter, recognizing you as its new bearer."
    )
  }

  /** Activate the chain's protective properties. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof HallOfEchoes) {
      if (!gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED, true)
        return (
          "The chain's crystals catch what little light there is and keep it. " +
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

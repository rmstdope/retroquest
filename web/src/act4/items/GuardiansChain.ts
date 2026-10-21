import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
import { HallOfEchoes } from '../rooms/HallOfEchoes'

/** A mystical chain that provides protection against dark magic. */
export class GuardiansChain extends Item {
  constructor() {
    super({
      name: "Guardian's Chain",
      description:
        'A silver chain hung with small crystals, lying by the gates as if ' +
        'someone set it down to rest and never came back for it. It is warmer ' +
        'than it should be.',
      canBeCarried: true,
    })
  }

  /** The chain's welcome when it is picked up. */
  override pickedUp(_gameState: GameState): string {
    return event(
      "You lift the [item_name]Guardian's Chain[/item_name]. The crystals " +
        'brighten a little, the way a face does when it knows you.',
    )
  }

  /** Activate the chain's protective properties. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof HallOfEchoes) {
      if (!gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED, true)
        return event(
          'You hold the chain up between you and the knight. The crystals ' +
            'catch what little light there is and keep it. His sorrow is still ' +
            'there, but it no longer reaches you.',
        )
      }
      return '[dim]The chain is already lit. His sorrow does not reach you.[/dim]'
    }
    return event(
      'The crystals stay quiet. Whatever the chain was made to stand ' +
        'against, it is not here.',
    )
  }
}

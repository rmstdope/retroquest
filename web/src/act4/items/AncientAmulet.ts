import { Item, type Character, type GameState, event } from '@/engine'
import { Malakar } from '../characters/Malakar'
import { VaultDoor } from './VaultDoor'
import { Wound } from './Wound'

/**
 * Elior's heirloom, carried from the first turn of Act IV. It is the key to
 * the sealed door in the Memory Vault (see VaultDoor); alone it only shows the picture Act III left in it.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description:
        'A family heirloom whose runes glint like dew at dawn. In its depths ' +
        'Aren and Lysa stand hand in hand. The third figure keeps his back ' +
        'turned.',
      canBeCarried: true,
    })
  }

  /** The amulet's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** Used with the Memory Vault's sealed door, it opens it (once the Shadow is answered). */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof VaultDoor) return other.openWith(gameState)
    if (other instanceof Wound) {
      return (
        '[failure]Not yet. The wound is not yours to close while Malakar ' +
        'still waits for you.[/failure]'
      )
    }
    return super.useWith(gameState, other)
  }

  /** Used alone in the Throne Chamber, it plays the third step of the scene. */
  override use(gameState: GameState): string {
    const malakar = gameState.currentRoom.characters.find(
      (character) => character instanceof Malakar,
    )
    if (malakar instanceof Malakar) return malakar.openAmulet(gameState)
    return super.use(gameState)
  }

  /** Used on Malakar, the same as using it alone in his chamber. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof Malakar) return target.openAmulet(gameState)
    return super.useOnCharacter(gameState, target)
  }
}

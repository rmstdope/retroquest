import { Item, type GameState, characterName, speech } from '@/engine'
import { Mechanism } from './Mechanism'

/** Early shop item used for mechanical or traversal interactions. */
export class Rope extends Item {
  constructor() {
    super({
      name: 'rope',
      description:
        'A long, sturdy coil of rope. Useful for climbing, tying, or ' +
        'hauling things.',
    })
  }

  /** Shopkeeper prevents taking the rope unless it has been purchased. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      const nameHtml = `[item_name]${this.name}[/item_name]`
      return (
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          "'Hold on there, friend! That " +
            nameHtml +
            ' is merchandise, not a free sample. If you want it, ' +
            "you'll need to buy it proper-like.'",
        )
      )
    }
    return ''
  }

  /** Delegate to Mechanism's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Mechanism) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}

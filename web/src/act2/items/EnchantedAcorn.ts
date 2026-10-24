import { Item, type GameState } from '@/engine'
import { ForestEntrance } from '../rooms/ForestEntrance'

/** A forest-blessed acorn intended as an offering to sacred spirits. */
export class EnchantedAcorn extends Item {
  constructor() {
    super({
      name: 'enchanted acorn',
      shortName: 'acorn',
      description:
        'A perfectly shaped acorn that glows with soft, natural magic. The shell ' +
        'appears to be made of polished wood with intricate spiral patterns that ' +
        'seem to move when observed closely. It radiates a sense of ancient wisdom ' +
        'and connection to the deepest mysteries of the forest. This is clearly a ' +
        'gift meant for the most sacred forest spirits.',
      canBeCarried: true,
    })
  }

  /** The acorn responds to the grove, the forest, or lies dormant elsewhere. */
  override use(gameState: GameState): string {
    const currentRoom = gameState.currentRoom.name
    if (currentRoom.toLowerCase().includes('ancient grove')) {
      // This should be handled by the room or character interaction
      return (
        `The [item_name]${this.name}[/item_name] pulses with magical energy in ` +
        'response to the sacred grove, warm as a held hand, and turns in your ' +
        'palm toward the silver-barked tree.'
      )
    } else if (currentRoom.toLowerCase().includes('forest')) {
      return (
        `The [item_name]${this.name}[/item_name] glows softly in the forest, ` +
        'but it seems to be calling you toward something more ancient and sacred.'
      )
    }
    return (
      `The [item_name]${this.name}[/item_name] feels dormant here. It likely ` +
      'has special significance in a more magical location.'
    )
  }

  /** Called when the item is picked up by the player. */
  override pickedUp(gameState: GameState): string {
    if (gameState.currentRoom instanceof ForestEntrance) {
      return (
        'The moment you touch it, you feel a surge of natural magic - this is no ' +
        "ordinary acorn, but a sacred offering imbued with the forest's blessing. " +
        'The forest sprites whisper approvingly as you claim this gift.'
      )
    }
    return ''
  }

  /** Examine the acorn and its silver veins. */
  override examine(_gameState: GameState): string {
    const desc = this.description
    return (
      `${desc} When you ` +
      'hold it up to the light, you can see tiny veins of silver running ' +
      'through the shell like tree roots. The acorn seems to whisper in ' +
      'a language older than words, speaking of growth, wisdom, and the ' +
      'eternal cycle of the forest.'
    )
  }
}

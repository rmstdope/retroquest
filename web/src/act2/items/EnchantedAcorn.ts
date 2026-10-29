import { Item, type GameState } from '@/engine'
import { ForestEntrance } from '../rooms/ForestEntrance'

/** The acorn's description; `Act2.afterLoad` restores it in older saves. */
export const ENCHANTED_ACORN_DESCRIPTION =
  'An acorn, perfectly shaped, with fine veins of silver running through ' +
  'the shell like roots. It is warm, as if someone had just been holding it.'

/** An acorn from the forest entrance: the "something that hasn't grown yet". */
export class EnchantedAcorn extends Item {
  constructor() {
    super({
      name: 'enchanted acorn',
      shortName: 'acorn',
      description: ENCHANTED_ACORN_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** The acorn turns toward the silver-barked tree in the grove, and lies still elsewhere. */
  override use(gameState: GameState): string {
    const currentRoom = gameState.currentRoom.name
    if (currentRoom.toLowerCase().includes('ancient grove')) {
      // This should be handled by the room or character interaction
      return (
        `${this.nameInSentence({ atStart: true })} pulses with magical energy in ` +
        'response to the sacred grove, warm as a held hand, and turns in your ' +
        'palm toward the silver-barked tree.'
      )
    }
    return 'The [item_name]acorn[/item_name] lies warm and still in your hand.'
  }

  /** Called when the item is picked up by the player. */
  override pickedUp(gameState: GameState): string {
    if (gameState.currentRoom instanceof ForestEntrance) {
      return (
        'It is warm in your palm. The forest sprites go quiet, all at once, ' +
        'and watch you put it away.'
      )
    }
    return ''
  }
}

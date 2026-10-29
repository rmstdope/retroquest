import { Item, type GameState, characterName, dialogue } from '@/engine'
import { WhisperingGlade } from '../rooms/WhisperingGlade'

/** The item's description; `Act2.afterLoad` restores it in older saves. */
export const MOONFLOWERS_DESCRIPTION =
  'White flowers that open only at night, and these are open still. ' +
  'They smell faintly sweet, and their petals give off a little light of ' +
  'their own.'

/** White flowers that open at night and give off a little light of their own. */
export class Moonflowers extends Item {
  constructor() {
    super({
      name: 'moonflowers',
      description: MOONFLOWERS_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** In the Healer's House Lyria waves the blooms away; elsewhere they glow or lie dormant. */
  override use(gameState: GameState): string {
    const currentRoom = gameState.currentRoom.name
    if (currentRoom.toLowerCase().includes('healer')) {
      return (
        characterName('Lyria') +
        ' glances at the silver blooms and shakes her head.' +
        '\n\n' +
        dialogue(
          'Master Healer Lyria',
          'Not for my shelves. Those belong to things older than me. Take ' +
            'them back to the forest.',
        )
      )
    } else if (currentRoom.toLowerCase().includes('forest')) {
      return (
        'The [item_name]moonflowers[/item_name] glow more brightly in the ' +
        'magical atmosphere of the forest, their protective properties enhanced.'
      )
    }
    return (
      'The [item_name]moonflowers[/item_name] remain dormant here. ' +
      'They likely have special significance for healing or magical purposes.'
    )
  }

  /** Called when the item is picked up by the player. */
  override pickedUp(gameState: GameState): string {
    if (gameState.currentRoom instanceof WhisperingGlade) {
      return (
        'They come up easily, roots and all, as if they had been waiting to ' +
        'be carried.'
      )
    }
    return ''
  }
}

import { Item, type GameState, characterName, event, speech } from '@/engine'
import { WhisperingGlade } from '../rooms/WhisperingGlade'

/** Rare bioluminescent blossoms used in healing and divinatory practices. */
export class Moonflowers extends Item {
  constructor() {
    super({
      name: 'moonflowers',
      description:
        'Ethereal white flowers that bloom only in places where moonlight and ' +
        'magic converge. Their petals shimmer with a silvery luminescence and ' +
        'give off a faint, sweet fragrance that seems to calm the mind and spirit. ' +
        'These rare blossoms are prized by herbalists and magical practitioners ' +
        'for their ability to enhance divination and provide protection against ' +
        'nightmares and dark visions.',
      canBeCarried: true,
    })
  }

  override use(gameState: GameState): string {
    const currentRoom = gameState.currentRoom.name
    if (currentRoom.toLowerCase().includes('healer')) {
      return (
        characterName('Lyria') +
        ' glances at the silver blooms and shakes her head.' +
        '\n\n' +
        characterName('Master Healer Lyria') +
        ': ' +
        speech(
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
        'The moonflowers seem to approve of your gentle touch, their ' +
        'silvery glow pulsing warmly as you gather them. These blessed ' +
        'blooms will aid in healing and protection magic.'
      )
    }
    return ''
  }

  override examine(_gameState: GameState): string {
    const desc = this.description
    return event(
      `You examine the [item_name]moonflowers[/item_name]. ${desc} As ` +
        "you watch, the petals seem to move gently even though there's no " +
        'breeze, and you notice tiny motes of silvery light drifting from ' +
        'the blooms like magical pollen.',
    )
  }
}

import { Room } from '@/engine'
import { InnkeeperMarcus } from '../characters/InnkeeperMarcus'
import { BarmaidElena } from '../characters/BarmaidElena'
import { RoomKey } from '../items/RoomKey'
import { Door } from '../items/Door'

/**
 * Silver Stag Inn room: social nexus and information hub (Act II).
 *
 * `useKey()` adds an east exit to the inn rooms exactly once.
 */
export class SilverStagInn extends Room {
  constructor() {
    super({
      name: 'The Silver Stag Inn',
      description:
        'A three-story inn glows with warm yellow light. Conversations from travelers ' +
        'and locals merge into a comforting din while tales are traded over bread and ' +
        'ale. Stag mounts and adventuring trophies line the walls. The place feels ' +
        'welcoming; information flows here as freely as the drink.',
      items: [new RoomKey(), new Door()],
      characters: [new InnkeeperMarcus(), new BarmaidElena()],
      exits: { south: 'MarketDistrict' },
    })
  }

  /** Handle use of the room key, unlocking the inn rooms if not already open. */
  useKey(): string {
    if (!('east' in this.exits)) {
      this.exits.east = 'InnRooms'
      return (
        '[success]The key turns with a soft click, and the door to the stairs ' +
        'swings open.[/success]'
      )
    }
    return '[failure]The inn rooms are already unlocked.[/failure]'
  }
}

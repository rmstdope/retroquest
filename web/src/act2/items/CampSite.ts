import { Item, type GameState, event } from '@/engine'
import { EntryPass } from './EntryPass'

/** Abandoned rest node offering single hidden item discovery (entry pass). */
export class CampSite extends Item {
  examined = false

  constructor() {
    super({
      name: 'camp site',
      shortName: 'camp',
      description:
        'A small clearing off the main path where travelers often rest. Signs ' +
        'of recent use remain—a fire pit with cold ashes and scattered ' +
        'belongings suggesting a hurried departure.',
      canBeCarried: false,
    })
  }

  /** Examine the camp; the first time reveals an entry pass in the room. */
  override examine(gameState: GameState): string {
    if (this.examined) {
      return (
        "You've already thoroughly examined the camp site. There's nothing " +
        'more to find here.'
      )
    }
    this.examined = true
    const entryPass = new EntryPass()
    gameState.currentRoom.addItem(entryPass)
    return (
      'You carefully examine the abandoned camp site. Hidden under ' +
      'leaves near the fire pit you discover an [item_name]entry ' +
      'pass[/item_name] to Greendale — likely dropped by a prior ' +
      'traveler in haste.\n\n' +
      event('You found an [item_name]entry pass[/item_name]!')
    )
  }

  /** Using the camp examines it the first time; afterwards nothing more is found. */
  override use(gameState: GameState): string {
    if (!this.examined) {
      return this.examine(gameState)
    }
    return (
      'The camp site has been thoroughly examined. You could rest here if needed, ' +
      "but there's nothing more to discover."
    )
  }
}

import { Item, type GameState, clue } from '@/engine'
import { AbandonedShed } from '../rooms/AbandonedShed'
import { Key } from './Key'

const LOCKED_DOOR_DESCRIPTION =
  "It's a sturdy wooden [item_name]door[/item_name], locked tight. " +
  "There's a keyhole visible."

/** Locked shed door that can be unlocked with a `Key` item. */
export class ShedDoor extends Item {
  locked = true

  constructor() {
    super({
      name: 'shed door',
      description: LOCKED_DOOR_DESCRIPTION,
      shortName: 'door',
    })
  }

  /** The door's look: locked tight, or unlocked and ajar. */
  override descriptionFor(_gameState: GameState): string {
    return this.locked
      ? LOCKED_DOOR_DESCRIPTION
      : `The [item_name]${this.name}[/item_name] is unlocked and slightly ajar.`
  }

  /** Opening by hand: the locked door holds; the unlocked one is already ajar. */
  override open(_gameState: GameState): string {
    if (this.locked) {
      return clue('The door holds. It is locked, and it has a keyhole.')
    }
    return (
      `[failure]The [item_name]${this.name}[/item_name] already stands ` +
      'ajar.[/failure]'
    )
  }

  /**
   * Use a `Key` on the door to unlock it (consumes the key), startling the
   * hiding cat, or return failures.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Key) {
      if (this.locked) {
        const keyName = other.name
        const doorName = this.name
        gameState.removeItemFromInventory(keyName)
        this.locked = false
        const room = gameState.currentRoom
        if (room instanceof AbandonedShed) room.unlock()
        return (
          'The [item_name]' +
          keyName +
          '[/item_name] turns in the lock! The [item_name]' +
          doorName +
          '[/item_name] creaks open.\n' +
          'In the gloom you make out an old workbench and a few interesting ' +
          'things. ' +
          'From the shadows comes a frightened mew, and a small patchwork ' +
          'shape bolts behind the broken crates.'
        )
      }
      return (
        '[failure]The [item_name]' +
        this.name +
        '[/item_name] is already unlocked.[/failure]'
      )
    }
    return (
      "[failure]You can't use the [item_name]" +
      other.name +
      '[/item_name] on the [item_name]shed door[/item_name].[/failure]'
    )
  }
}

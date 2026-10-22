import { Item, event, type GameState } from '@/engine'
import { MinersKey } from './MinersKey'
import { ReinforcedBraces } from './ReinforcedBraces'
import { SupportStraps } from './SupportStraps'
import { WedgeBlocks } from './WedgeBlocks'

/** A locked crate containing braces, straps, and wedge blocks. */
export class SupplyCrate extends Item {
  locked = true
  opened = false
  contents: Item[] = [
    new ReinforcedBraces(),
    new SupportStraps(),
    new WedgeBlocks(),
  ]

  constructor() {
    super({
      name: 'Supply Crate',
      description:
        'A heavy wooden crate reinforced with iron bands. It is locked with a large iron ' +
        "padlock. The label reads: 'Rescue Supplies — For Emergency Use Only.'",
      shortName: 'crate',
      canBeCarried: false,
    })
  }

  /** Describe the crate according to its locked and opened state. */
  override examine(_gameState: GameState): string {
    if (this.locked) {
      return event(
        'You examine the crate. The padlock is sturdy and rusted, but the keyhole ' +
          'looks intact. The crate is labeled for rescue supplies.',
      )
    } else if (!this.opened) {
      return event(
        'The crate is unlocked but still closed. You could try to open it.',
      )
    }
    return event('The crate stands open, its contents mostly removed.')
  }

  /** Open the unlocked crate, releasing its contents into the room. */
  override open(gameState: GameState): string {
    if (this.locked) {
      return "[failure]The crate is locked. You'll need a key to open it.[/failure]"
    }
    if (this.opened) {
      return event(
        'The crate is already open. Only packing straw remains inside.',
      )
    }
    // Add contents to the room
    for (const item of this.contents) {
      gameState.currentRoom.addItem(item)
    }
    this.opened = true
    return event(
      'You open the crate. Inside are heavy iron braces, strong hemp straps, and ' +
        'tapered wooden wedge blocks—just what you need to rescue the trapped miners!',
    )
  }

  /**
   * Unlock the crate with the unlock sigil instead of the key: the second
   * use of the spell in the act. The key, if carried, stays in the pack.
   */
  unlockWithSpell(_gameState: GameState): string {
    if (!this.locked) {
      return event('The padlock already hangs open.')
    }
    this.locked = false
    return event(
      "The sigil finds the padlock's rusted pins and lifts them one by one. " +
        'The lock falls open. Whatever key was cut for it can stay where it ' +
        'is.',
    )
  }

  /** Unlock the crate with the miner's key, consuming the key. */
  override useWith(gameState: GameState, other: Item): string {
    if (this.locked && other instanceof MinersKey) {
      this.locked = false
      // Remove the key from inventory by name
      gameState.removeItemFromInventory(other.name, 1)
      return event(
        "You fit the miner's key into the padlock. With a click, the lock opens. " +
          'The crate is now unlocked. The key is left twisted and useless, and you ' +
          'discard it.',
      )
    }
    return super.useWith(gameState, other)
  }
}

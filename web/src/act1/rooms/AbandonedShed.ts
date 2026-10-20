import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { BrokenShovel } from '../items/BrokenShovel'
import { MysteriousBox } from '../items/MysteriousBox'
import { FishingRod } from '../items/FishingRod'
import { Magnet } from '../items/Magnet'
import { ShedDoor } from '../items/ShedDoor'
import { Patches } from '../characters/Patches'
import { FLAG_PATCHES_FOUND } from '../Act1StoryFlags'

/**
 * Abandoned Shed room: staged unlock and layered search progression.
 *
 * `unlock()` toggles the locked state and injects the MysteriousBox,
 * BrokenShovel and Patches, the missing cat; the first search after unlocking
 * adds the FishingRod and Magnet.
 */
export class AbandonedShed extends Room {
  locked = true
  roomSearched = false

  constructor() {
    super({
      name: 'Abandoned Shed',
      description:
        'A rickety shed leans precariously at the edge of Willowbrook, its weathered ' +
        'boards creaking in the wind. Rusty tools and broken crates are scattered ' +
        'about, and a thick layer of dust covers everything. Shadows gather in the ' +
        'corners, and the air smells of old earth and forgotten secrets. Something ' +
        'about the place feels both forlorn and mysteriously inviting.',
      items: [new ShedDoor()],
      characters: [],
      exits: { north: 'VillageWell', south: 'OldMill' },
    })
  }

  /** Unlock the shed, add the unlock items, and return a descriptive message. */
  unlock(): string {
    if (!this.locked) {
      return 'The shed is already unlocked.'
    }
    this.locked = false
    this.addItem(new MysteriousBox())
    this.addItem(new BrokenShovel())
    this.addCharacter(new Patches())
    return (
      'The old wooden door creaks open with a groan, revealing the dusty interior ' +
      'of the Abandoned Shed. A [item_name]Mysterious Box[/item_name] sits on a rickety ' +
      'table, and a [item_name]Broken Shovel[/item_name] leans against a cobweb-covered ' +
      'wall.'
    )
  }

  /**
   * Put Patches back behind the crates when the shed was unlocked by a save
   * made before she hid there and she has not been found yet.
   */
  override onEnter(gameState: GameState): void {
    this.hidePatches(gameState)
    super.onEnter(gameState)
  }

  /** Add Patches to an unlocked shed unless she is there or already found. */
  private hidePatches(gameState: GameState): void {
    if (
      !this.locked &&
      !gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !this.characters.some((c) => c instanceof Patches)
    ) {
      this.addCharacter(new Patches())
    }
  }

  /**
   * Search the shed; the first search after unlocking adds the loot, and
   * Patches is seen hiding while she has not been coaxed out.
   */
  override search(gameState: GameState): string {
    this.hidePatches(gameState)
    const hiding = this.characters.some((c) => c instanceof Patches)
      ? '\nA pair of frightened green eyes watches you from behind the crates.'
      : ''
    return this.searchClutter() + hiding
  }

  /** The search of the clutter itself: the loot the first time, then nothing. */
  private searchClutter(): string {
    if (this.locked) {
      return (
        'You take a look around the shed. Nothing! The [item_name]Shed Door[/item_name] ' +
        "is locked so you can't search inside."
      )
    }

    const itemsFoundMessages: string[] = []
    if (!this.roomSearched) {
      this.addItem(new FishingRod())
      this.roomSearched = true
      itemsFoundMessages.push('a discarded [item_name]Fishing Rod[/item_name]')
      this.addItem(new Magnet())
      itemsFoundMessages.push('a small [item_name]Magnet[/item_name]')
    }

    if (itemsFoundMessages.length > 0) {
      return (
        'You rummage through the clutter of rusty tools and broken crates. Tucked away in ' +
        `dusty corners, you find ${itemsFoundMessages.join(', and ')}!`
      )
    }
    return (
      'You search around the shed again, but find nothing else of interest among the ' +
      'clutter.'
    )
  }
}

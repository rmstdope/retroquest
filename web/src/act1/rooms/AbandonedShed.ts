import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { BrokenShovel } from '../items/BrokenShovel'
import { MysteriousBox } from '../items/MysteriousBox'
import { FishingRod } from '../items/FishingRod'
import { Magnet } from '../items/Magnet'
import { ShedDoor } from '../items/ShedDoor'
import { Lantern } from '../items/Lantern'
import { Patches } from '../characters/Patches'
import { FLAG_PATCHES_FOUND } from '../Act1StoryFlags'

/**
 * Abandoned Shed room: staged unlock and layered search progression.
 *
 * Once the workshop of Elior's father, it is dark inside. `unlock()` toggles
 * the locked state and injects the MysteriousBox, BrokenShovel and Patches,
 * the missing cat; the first search after unlocking adds the FishingRod and
 * Magnet, but only by the light of a lit lantern Elior holds or of the
 * `light` spell.
 */
export class AbandonedShed extends Room {
  locked = true
  roomSearched = false
  /** Set by the `light` spell; absent in saves made before the shed was dark. */
  lit = false

  constructor() {
    super({
      name: 'Abandoned Shed',
      description:
        'A rickety shed leans precariously at the edge of Willowbrook, its weathered ' +
        'boards creaking in the wind. Rusty tools and broken crates are scattered ' +
        'about a long workbench, and a thick layer of dust covers everything. ' +
        'Little light gets past the grimy boards; shadows gather in the corners, ' +
        'and the air smells of old earth and forgotten secrets. Something ' +
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
      'of the Abandoned Shed. A [item_name]mysterious box[/item_name] sits on an old ' +
      'workbench, and a [item_name]broken shovel[/item_name] leans against a ' +
      'cobweb-covered wall.'
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
   * Search the shed; the first search after unlocking adds the loot when
   * there is light to see by, and Patches is seen hiding, her eyes shining in
   * the dark, while she has not been coaxed out.
   */
  override search(gameState: GameState): string {
    this.hidePatches(gameState)
    const hiding = this.characters.some((c) => c instanceof Patches)
      ? '\nA pair of frightened green eyes watches you from behind the crates.'
      : ''
    return this.searchClutter(gameState) + hiding
  }

  /** The search of the clutter itself: the loot the first time, then nothing. */
  private searchClutter(gameState: GameState): string {
    if (this.locked) {
      return (
        'You take a look around the shed. Nothing! The [item_name]shed door[/item_name] ' +
        "is locked so you can't search inside."
      )
    }

    if (!this.roomSearched && !this.hasLight(gameState)) {
      return (
        "It's too dark to rummage through the clutter. The shadows swallow the " +
        'corners of the workbench, and you would need a light to see what lies ' +
        'in them.'
      )
    }

    const itemsFoundMessages: string[] = []
    if (!this.roomSearched) {
      this.addItem(new FishingRod())
      this.roomSearched = true
      itemsFoundMessages.push('a discarded [item_name]fishing rod[/item_name]')
      this.addItem(new Magnet())
      itemsFoundMessages.push('a small [item_name]magnet[/item_name]')
    }

    if (itemsFoundMessages.length > 0) {
      return (
        `${this.lightSource(gameState)}, you rummage through the clutter of ` +
        'rusty tools and broken crates. Tucked away in ' +
        `dusty corners, you find ${itemsFoundMessages.join(', and ')}!`
      )
    }
    return (
      'You search around the shed again, but find nothing else of interest among the ' +
      'clutter.'
    )
  }

  /** Whether Elior holds a lit lantern or has lit the shed with the spell. */
  private hasLight(gameState: GameState): boolean {
    return (
      this.lit === true ||
      gameState.inventory.some((i) => i instanceof Lantern && i.isLit())
    )
  }

  /** How Elior sees in the shed: by the lantern he holds or the spell's glow. */
  private lightSource(gameState: GameState): string {
    return gameState.inventory.some((i) => i instanceof Lantern && i.isLit())
      ? 'Holding the [item_name]lantern[/item_name] high'
      : 'By the glow of your spell'
  }

  /**
   * The `light` spell lights the dark shed, so it can be searched; while the
   * door is locked it only shows the door.
   */
  override light(_gameState: GameState): string {
    if (this.locked) {
      return (
        'The glow plays over the weathered boards and the locked ' +
        '[item_name]shed door[/item_name]. Whatever lies inside stays dark.'
      )
    }
    this.lit = true
    return (
      'A soft glow fills the shed.\n' +
      'Warm light spills over the old workbench and the dusty shelves above ' +
      'it. Whoever worked here kept their tools in careful rows.'
    )
  }
}

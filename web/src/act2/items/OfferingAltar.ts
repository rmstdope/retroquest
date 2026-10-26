import { Item, type GameState } from '@/engine'
import { Nyx } from '../characters/Nyx'
import { DruidicCharm } from './DruidicCharm'
import { NaturesCharm } from './NaturesCharm'
import { ProtectiveCharm } from './ProtectiveCharm'

/** An ancient starstone altar where the three sacred charms can be placed to summon Nyx. */
export class OfferingAltar extends Item {
  constructor() {
    super({
      name: 'offering altar',
      description:
        'An ancient altar carved from a single piece of starstone, its surface ' +
        'adorned with mystical runes that pulse with otherworldly light. Three ' +
        'circular indentations suggest that specific items are meant to be ' +
        'placed here in a sacred ritual. The altar radiates ' +
        'powerful magic and seems to be waiting for the proper offerings to activate its ' +
        'full potential.',
    })
  }

  /** Use the offering altar with one of the three sacred charms to summon Nyx. */
  override useWith(gameState: GameState, other: Item): string {
    const isCharm = (item: Item): boolean =>
      item instanceof DruidicCharm ||
      item instanceof ProtectiveCharm ||
      item instanceof NaturesCharm
    // Check if the other item is one of the three sacred charms
    if (!isCharm(other)) {
      return (
        `The altar's runes remain dim. ${other.nameInSentence({ atStart: true })} does not seem to be one of ` +
        'the sacred charms needed for this ancient ritual. You need the three blessed ' +
        "charms: druidic charm, protective charm, and nature's charm."
      )
    }
    // Check if player has all three sacred charms
    const hasDruidic = gameState.inventory.some(
      (item) => item instanceof DruidicCharm,
    )
    const hasProtective = gameState.inventory.some(
      (item) => item instanceof ProtectiveCharm,
    )
    const hasNatures = gameState.inventory.some(
      (item) => item instanceof NaturesCharm,
    )
    if (!(hasDruidic && hasProtective && hasNatures)) {
      const missingCharms: string[] = []
      if (!hasDruidic) missingCharms.push('Druidic Charm')
      if (!hasProtective) missingCharms.push('Protective Charm')
      if (!hasNatures) missingCharms.push("Nature's Charm")
      return (
        `The altar's runes flicker weakly as you place ${other.nameInSentence()} upon it. ` +
        'You sense that you need all three sacred charms to activate the full ritual: ' +
        `${missingCharms.join(', ')}. The ancient magic requires all three offerings to ` +
        'complete the summoning.'
      )
    }
    // Player has all three charms - complete the ritual!
    // Remove all three charms from inventory
    gameState.inventory = gameState.inventory.filter((item) => !isCharm(item))
    // Create and add Nyx to the current room if not already present
    const nyx = new Nyx()
    gameState.currentRoom.characters.push(nyx)
    const summonMessage =
      'As the three sacred charms are placed upon the altar, the starstone erupts in ' +
      'brilliant light! The mystical runes blaze with ancient power, and the very air ' +
      'shimmers with magic. From the swirling energies, a figure of ethereal beauty ' +
      "materializes - Nyx, the ancient forest sprite, has answered the ritual's call!"
    return `[success]${summonMessage}[/success]`
  }
}

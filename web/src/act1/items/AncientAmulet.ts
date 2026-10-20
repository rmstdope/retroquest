import { Item } from '@/engine'

/**
 * Powerful heirloom artifact intentionally withheld early to establish
 * narrative guardianship; Mira always blocks pickup.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      description:
        'A mysterious amulet inscribed with runes. It glows faintly and feels powerful ' +
        'to the touch.',
      shortName: 'amulet',
    })
  }

  /** Always blocks pickup with narrative justification (no readiness check yet). */
  override preventPickup(): string {
    return (
      '[character_name]Mira[/character_name] places a protective hand over the ' +
      "[item_name]amulet[/item_name]. [dialogue]'This is not yet yours to claim, " +
      '[character_name]Elior[/character_name]. The [item_name]Ancient Amulet[/item_name] ' +
      'is a powerful artifact that must be earned through preparation and wisdom. ' +
      "Complete your journey preparations first, and it shall be yours.'[/dialogue]"
    )
  }
}

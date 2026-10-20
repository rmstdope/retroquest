import { Item, characterName, speech } from '@/engine'

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
      characterName('Mira') +
      ' places a protective hand over the [item_name]amulet[/item_name]. ' +
      speech(
        "'This is not yet yours to claim, " +
          characterName('Elior') +
          '. The [item_name]Ancient Amulet[/item_name] ' +
          'is a powerful artifact that must be earned through preparation and wisdom. ' +
          "Complete your journey preparations first, and it shall be yours.'",
      )
    )
  }
}

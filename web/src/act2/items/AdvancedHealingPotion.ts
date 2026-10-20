import { Item } from '@/engine'

/** High-tier curative consumable placeholder. */
export class AdvancedHealingPotion extends Item {
  constructor() {
    super({
      name: 'advanced healing potion',
      shortName: 'adv heal',
      description:
        'A sealed crystal vial swirling with layered iridescent strata that pulse ' +
        'faintly when held. Even unopened it radiates clean restorative potential—' +
        'clearly beyond a common herbal tincture.',
      canBeCarried: true,
    })
  }
}

import { Room } from '@/engine'
import { MasterHealerLyria } from '../characters/MasterHealerLyria'

/** The Healer's House description; `Act2.afterLoad` restores it on older saves. */
export const HEALERS_HOUSE_DESCRIPTION =
  'A small stone house that smells of crushed herbs. A few bundles of dried ' +
  'plants still hang from the rafters, but the shelves below them are nearly ' +
  'bare: rows of empty bottles, rinsed and waiting. A fire burns in the ' +
  'hearth, and a door at the back stands half shut.'

/**
 * Healer's House room: restorative enclave where Master Healer Lyria lives.
 */
export class HealersHouse extends Room {
  constructor() {
    super({
      name: "Healer's House",
      description: HEALERS_HOUSE_DESCRIPTION,
      items: [],
      characters: [new MasterHealerLyria()],
      exits: { south: 'ResidentialQuarter' },
    })
  }
}

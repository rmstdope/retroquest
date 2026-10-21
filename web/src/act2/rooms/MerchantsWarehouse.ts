import { Room } from '@/engine'
import { Brenn } from '../characters/Brenn'

/**
 * Merchant's Warehouse room: storage adjunct supporting market scale (Act II).
 * Thorne's guard Brenn waits here.
 */
export class MerchantsWarehouse extends Room {
  constructor() {
    super({
      name: "Merchant's Warehouse",
      description:
        'A large stone building packed with goods from distant lands. Crates and ' +
        'barrels form narrow corridors between tall shelving. Exotic spice and ' +
        'lacquer aromas mingle in the cool still air. This is where the most valuable ' +
        'inventory rests under quiet watch.',
      items: [],
      characters: [new Brenn()],
      exits: { north: 'MarketDistrict' },
    })
  }
}

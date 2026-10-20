import { Room } from '@/engine'
import { OfferingAltar } from '../items/OfferingAltar'

/** Heart of the Forest room: climactic ritual sanctum with offering altar. */
export class HeartOfTheForest extends Room {
  constructor() {
    super({
      name: 'Heart of the Forest',
      description:
        'The deepest part of the Enchanted Forest, where reality feels fluid and ' +
        'magic flows like water. Impossible colors paint the landscape and the air ' +
        'sparkles with latent energy. A colossal tree dominates the center, its ' +
        'branches seeming to uphold the sky. Before it rests an ancient altar carved ' +
        "from starstone, runes pulsing with otherworldly light. This is Nyx's domain " +
        'where profound secrets surface. The sacred grove path is the only passage into ' +
        'this mystical heart.',
      items: [new OfferingAltar()],
      characters: [],
      exits: { north: 'AncientGrove' },
    })
  }
}

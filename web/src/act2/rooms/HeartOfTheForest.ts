import { Room } from '@/engine'
import { OfferingAltar } from '../items/OfferingAltar'

/** The room's description; `Act2.afterLoad` restores it in older saves. */
export const HEART_OF_THE_FOREST_DESCRIPTION =
  'The deepest part of the forest. The light here is green and gold and ' +
  'does not seem to come from the sky. A tree vaster than any other holds ' +
  'up the branches overhead, and before it stands an altar of starstone. ' +
  'The only way out is back north, to the grove.'

/** Heart of the Forest room: climactic ritual sanctum with offering altar. */
export class HeartOfTheForest extends Room {
  constructor() {
    super({
      name: 'Heart of the Forest',
      description: HEART_OF_THE_FOREST_DESCRIPTION,
      items: [new OfferingAltar()],
      characters: [],
      exits: { north: 'AncientGrove' },
    })
  }
}

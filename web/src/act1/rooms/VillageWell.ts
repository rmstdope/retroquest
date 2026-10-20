import { Room } from '@/engine'
import { Well } from '../items/Well'

/** Village Well room: mystical utility hub foreshadowing purification systems. */
export class VillageWell extends Room {
  constructor() {
    super({
      name: 'Village Well',
      description:
        "An old stone well stands at the village's center, its stones worn smooth " +
        'by countless hands. The water below glimmers with a crystalline clarity, ' +
        'and the air is cool and damp. Moss creeps up the sides, and a frayed rope ' +
        'hangs nearby. The well seems to whisper secrets to those who listen closely.',
      items: [new Well()],
      characters: [],
      exits: {
        west: 'VegetableField',
        east: 'BlacksmithsForge',
        south: 'AbandonedShed',
      },
    })
  }
}

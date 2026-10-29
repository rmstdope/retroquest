import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { FallenRock } from '../items/FallenRock'
import { FLAG_ACT3_MINERS_RESCUE_COMPLETED } from '../Act3StoryFlags'

/** Room where miners are trapped behind a collapsed passage in Act 3. */
export class CollapsedGalleries extends Room {
  constructor() {
    super({
      name: 'Collapsed Galleries',
      description:
        'A gallery choked with fallen stone, floor to roof. ' +
        'The timbers that held it lie snapped under the pile, ' +
        'and dust hangs in the still air.',
      items: [new FallenRock()],
      characters: [],
      exits: {
        south: 'StillnessVestibule',
        east: 'EchoChambers',
        west: 'ToolCache',
      },
    })
  }

  /** Hide east exit until the miners' rescue is completed. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    if (!gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)) {
      delete exits.east
    }
    return exits
  }
}

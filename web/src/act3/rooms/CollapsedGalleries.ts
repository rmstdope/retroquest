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

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new CollapsedGalleries().description
  }

  /** After the rescue the stone is cleared and the miners are beaming the gallery. */
  override descriptionFor(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)) {
      return this.description
    }
    return (
      'The fallen stone is heaped along the walls now, ' +
      'and the gallery runs open end to end. ' +
      'The miners are setting fresh timbers where the old ones snapped.'
    )
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

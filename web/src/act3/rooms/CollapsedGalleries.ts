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
        'Ancient passages lie strangled by fallen stone, their throats choked with ' +
        'the weight of ages. Dust motes drift like restless spirits in the stagnant ' +
        'air, and shadows pool in the broken archways where starlight once danced. ' +
        'The walls bear scars of some long-forgotten catastrophe, and you sense the ' +
        'presence of those who await deliverance from this tomb of earth and shadow. ' +
        'A palpable tension hangs in the darkness, as if the very stones remember ' +
        'their violent collapse.',
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

import { Item, type GameState, event } from '@/engine'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'

/** The orbs are cracked and clouded until the enhanced Echo Stone mends them. */
const ORBS_BEFORE =
  'The orbs are cracked and clouded. In one you glimpse three young people ' +
  'laughing over a workbench; in another, a cradle by a fire. Each scene ' +
  'breaks apart before you can hold it.'

/** What the orbs show once they are whole. */
const ORBS_AFTER =
  'Whole now. In one, three young Wardens laugh over a workbench; in ' +
  'another, a cradle sits by a fire. The clearest scenes all lie beyond the ' +
  'door to the east.'

/** The orbs of crystallized memory in the Memory Vault: scenery that the Echo Stone mends. */
export class MemoryOrbs extends Item {
  constructor() {
    super({
      name: 'Memory Orbs',
      description: ORBS_BEFORE,
      canBeCarried: false,
    })
  }

  /** Also answers to "orbs" and "memory orbs". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'orbs'
  }

  /** Looking at the orbs starts the Shadow's quest; the look changes once they are mended. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return event(ORBS_AFTER)
    }
    return event(ORBS_BEFORE)
  }
}

import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { MountainFlower } from '../items/MountainFlower'
import { WalkingStick } from '../items/WalkingStick'
import { CampSite } from '../items/CampSite'
import { MountainHermit } from '../characters/MountainHermit'
import { FLAG_SUPPLIES_QUEST_COMPLETED } from '../Act2StoryFlags'

/**
 * Mountain Path room: preparation corridor linking settlements (Act II).
 *
 * `getExits()` withholds the eastern forest transition until the supplies quest
 * flag is set.
 */
export class MountainPath extends Room {
  constructor() {
    super({
      name: 'Mountain Path',
      description:
        'A winding trail climbs through rocky terrain between Willowbrook and Greendale. ' +
        'Sturdy trees cast intermittent shade and the path remains well tended despite ' +
        'its remoteness. Glimpses of both settlements appear at overlooks, offering ' +
        'reflective pauses. A small ' +
        'camp site used by travelers rests just off the main trail.',
      items: [new MountainFlower(), new WalkingStick(), new CampSite()],
      characters: [new MountainHermit()],
      exits: { north: 'GreendaleGates', east: 'ForestTransition' },
    })
  }

  /** Return exits, hiding the forest route until the supplies quest is completed. */
  override getExits(gameState: GameState): Exits {
    const exitsDict: Exits = { ...super.getExits(gameState) }
    if (!gameState.getStoryFlag(FLAG_SUPPLIES_QUEST_COMPLETED)) {
      delete exitsDict.east
    }
    return exitsDict
  }
}

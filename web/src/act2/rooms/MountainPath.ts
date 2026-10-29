import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { MountainFlower } from '../items/MountainFlower'
import { WalkingStick } from '../items/WalkingStick'
import { CampSite } from '../items/CampSite'
import { MountainHermit } from '../characters/MountainHermit'
import { FLAG_SUPPLIES_QUEST_COMPLETED } from '../Act2StoryFlags'

/** The room's description; `Act2.afterLoad` restores it in older saves. */
export const MOUNTAIN_PATH_DESCRIPTION =
  'A trail climbs through rock and pine between Willowbrook and ' +
  'Greendale. From the overlooks you can see both: Greendale ahead, and ' +
  'Willowbrook small and far behind you. Just off the trail is a camp ' +
  'site where travellers stop for the night.'

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
      description: MOUNTAIN_PATH_DESCRIPTION,
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

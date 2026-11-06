import { Room, type GameState } from '@/engine'
import { Egg } from '../items/Egg'
import { Feather } from '../items/Feather'
import { Chicken } from '../items/Chicken'
import { Scenery } from '../items/Scenery'
import { Key } from '../items/Key'
import { AbandonedShed } from './AbandonedShed'
import { FLAG_COOP_KEY_FELL } from '../Act1StoryFlags'

/** The coop as it always is. */
const COOP_DESCRIPTION =
  'A small wooden coop stands here, its planks patched and weathered. Nervous ' +
  'chickens cluck and flutter, their feathers ruffled as they dart between ' +
  'straw nests. The air is thick with the scent of hay and the occasional ' +
  'squawk. Sunbeams slip through the slats, casting striped shadows on the ' +
  'dirt floor.'
/** The sentence about the key, shown only while it is still on the rafter. */
const RAFTER_SENTENCE =
  ' High on a rafter, out of reach, something glints where no hen ' +
  'could have put it.'

/**
 * Chicken Coop room: light agricultural ambience with small resource items.
 * Something glints on a rafter until the bread knocks the key down.
 */
export class ChickenCoop extends Room {
  constructor() {
    super({
      name: 'Chicken Coop',
      description: COOP_DESCRIPTION + RAFTER_SENTENCE,
      items: [
        new Chicken(),
        new Egg(),
        new Feather(),
        ...Scenery.forRoom('ChickenCoop'),
      ],
      characters: [],
      exits: { north: 'VegetableField' },
    })
  }

  /**
   * Whether the key has come down from the rafter: the flag, or, for a save
   * from before the flag, the key here or in the bag or the shed it opens open.
   */
  private keyFell(gameState: GameState): boolean {
    const shed = gameState.allRooms.AbandonedShed
    return (
      gameState.getStoryFlag(FLAG_COOP_KEY_FELL) ||
      this.items.some((item) => item instanceof Key) ||
      gameState.inventory.some((item) => item instanceof Key) ||
      (shed instanceof AbandonedShed && !shed.locked)
    )
  }

  /** The coop, with the glint on the rafter only while the key is still up there. */
  override descriptionFor(gameState: GameState): string {
    return this.keyFell(gameState)
      ? COOP_DESCRIPTION
      : COOP_DESCRIPTION + RAFTER_SENTENCE
  }
}

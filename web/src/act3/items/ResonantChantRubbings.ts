import { Item, clue, effect, type GameState } from '@/engine'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_PHANTOMS_FREED,
  FLAG_ACT3_POOLS_STILLED,
} from '../Act3StoryFlags'
import { WanderingPhantoms } from '../characters/WanderingPhantoms'
import { StillnessVestibule } from '../rooms/StillnessVestibule'
import { EchoStones } from './EchoStones'

/**
 * What Elior does when the rubbings are used with the blessed stones: the
 * effect of the use, not an echo of it, and the antecedent of "The words".
 */
const RECITED = effect('You recite the resonant chant at each stone.')

/** Rubbings of the Resonant Chant from the Echo Chambers. */
export class ResonantChantRubbings extends Item {
  constructor() {
    super({
      name: 'Resonant Chant Rubbings',
      description:
        'Carefully made rubbings of ancient runes containing the ' +
        "Resonant Chant: 'Let stillness echo, let silence bind.'",
      canBeCarried: true,
      shortName: 'rubbings',
    })
  }

  /** Handle using the rubbings with the echo stones: blessed and over still pools, the chant completes the Oath. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof EchoStones) {
      // Check if the echo stones are blessed
      if (other.areBlessed()) {
        if (!gameState.getStoryFlag(FLAG_ACT3_POOLS_STILLED)) {
          return (
            `${RECITED}\n` +
            clue(
              'The words leave the stones and skim out across the ' +
                'pools. Water that looked frozen shivers under them, and the ' +
                'chant breaks apart on a thousand tiny ripples. It will not ' +
                'carry over water that is not truly still.',
            )
          )
        }
        // Perform the Oath of Stillness
        gameState.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
        // Remove the rubbings from inventory (consumed in the ritual)
        gameState.removeItemFromInventory(this.name)
        // Remove phantoms from current room if it's StillnessVestibule
        const currentRoom = gameState.currentRoom
        if (currentRoom instanceof StillnessVestibule) {
          currentRoom.characters = currentRoom.characters.filter(
            (char) => !(char instanceof WanderingPhantoms),
          )
        }
        // Freed first (the optional mercy): the silence settles on an empty room.
        const silence = gameState.getStoryFlag(FLAG_ACT3_PHANTOMS_FREED)
          ? 'settles over the empty chamber.'
          : 'banishes the wandering phantoms.'
        return (
          `${RECITED}\n` +
          '[success]The words ' +
          'echo and re-echo, building into a harmonious silence that ' +
          `${silence} The path to the dragon's hall ` +
          'now lies open.[/success]'
        )
      }
      return clue(
        'The stones remain cold and unresponsive. They must be ' +
          'sanctified before the chant can take hold.',
      )
    }
    return `[failure]The ${other.name} has no effect on the rubbings.[/failure]`
  }
}

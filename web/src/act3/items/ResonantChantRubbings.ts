import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED } from '../Act3StoryFlags'
import { WanderingPhantoms } from '../characters/WanderingPhantoms'
import { StillnessVestibule } from '../rooms/StillnessVestibule'
import { EchoStones } from './EchoStones'

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

  /** Handle using resonant chant rubbings with blessed echo stones. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof EchoStones) {
      // Check if the echo stones are blessed
      if (other.areBlessed()) {
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
        return (
          '[event]You recite the resonant chant at each stone. [/event]\n' +
          '[success]The words ' +
          'echo and re-echo, building into a harmonious silence that ' +
          "banishes the wandering phantoms. The path to the dragon's hall " +
          'now lies open.[/success]'
        )
      }
      return (
        '[failure]The stones remain cold and unresponsive. They must be ' +
        'sanctified before the chant can take hold.[/failure]'
      )
    }
    return `[failure]The ${other.name} has no effect on the rubbings.[/failure]`
  }
}

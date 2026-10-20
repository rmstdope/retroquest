import { characterName, Room, type GameState } from '@/engine'
import { SmoothStone } from '../items/SmoothStone'
import { River } from '../items/River'
import { MothersLetter } from '../items/MothersLetter'
import { Fisherman } from '../characters/Fisherman'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
} from '../Act1StoryFlags'

/**
 * Riverbank room: the bend of the river named on the back of the faded
 * photograph, where the fisherman keeps watch.
 *
 * Once the fisherman has told of the tin, a search under the smooth stone
 * finds it and leaves the MothersLetter in the room (FLAG_FOUND_MOTHERS_LETTER).
 */
export class Riverbank extends Room {
  constructor() {
    super({
      name: 'Riverbank',
      description:
        'A gentle river flows past the village. Reeds sway along the banks, and ' +
        `the air is alive with the hum of insects. A weathered ${characterName('fisherman')} sits ` +
        'nearby, humming a quiet tune. The riverbank is peaceful, a place where ' +
        'time seems to slow and worries drift away.',
      items: [new SmoothStone(), new River()],
      characters: [new Fisherman()],
      exits: { west: 'OldMill', south: 'ForestPath' },
    })
  }

  /** Finds the mother's tin under the smooth stone once the fisherman has told of it. */
  override search(gameState: GameState): string {
    if (
      gameState.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN) &&
      !gameState.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)
    ) {
      const letter = new MothersLetter()
      this.items.push(letter)
      gameState.setStoryFlag(FLAG_FOUND_MOTHERS_LETTER, true)
      return (
        'You tip the [item_name]smooth stone[/item_name] aside and dig into ' +
        'the cold mud beneath it. Your fingers close on a small tin, sealed ' +
        'with wax. Inside, wrapped in oilcloth, lies a ' +
        `[item_name]${letter.name}[/item_name].`
      )
    }
    return (
      'You search along the bank, among the reeds and the mud, but find ' +
      'nothing of interest.'
    )
  }
}

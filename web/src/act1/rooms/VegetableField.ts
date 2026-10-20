import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { RustyHoe } from '../items/RustyHoe'
import { DullKnife } from '../items/DullKnife'
import { FLAG_INVESTIGATED_WITHERED_CROPS } from '../Act1StoryFlags'

/**
 * Vegetable Field room: blighted crops establishing early restorative themes.
 *
 * Entering the field sets FLAG_INVESTIGATED_WITHERED_CROPS unprompted.
 */
export class VegetableField extends Room {
  constructor() {
    super({
      name: 'Vegetable Field',
      description:
        'Rows of withered crops stretch beneath a brooding gray sky. The earth is ' +
        'cracked and dry, with only a few stubborn carrots and a rusty hoe hinting at ' +
        'better days. A faint breeze rustles the brittle leaves, carrying the scent ' +
        'of soil and distant rain. The field feels quiet, as if holding its breath, ' +
        'waiting for a touch of magic to bring it back to life.',
      items: [new WitheredCarrot(), new RustyHoe(), new DullKnife()],
      characters: [],
      exits: {
        north: 'EliorsCottage',
        east: 'VillageWell',
        south: 'ChickenCoop',
      },
    })
  }

  /** Set the investigation story flag when the player enters the field. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    super.onEnter(gameState)
  }
}

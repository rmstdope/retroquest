import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { RustyHoe } from '../items/RustyHoe'
import { DullKnife } from '../items/DullKnife'
import {
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VEGETABLE_FIELD_WATERED,
} from '../Act1StoryFlags'

const WITHERED_DESCRIPTION =
  'Rows of withered crops stretch beneath a brooding gray sky. The earth is ' +
  'cracked and dry, with only a few stubborn carrots and a rusty hoe hinting at ' +
  'better days. A faint breeze rustles the brittle leaves, carrying the scent ' +
  'of soil and distant rain. These rows were green a month ago.'
const WITHERED_WITHOUT_HOE_DESCRIPTION =
  'Rows of withered crops stretch beneath a brooding gray sky. The earth is ' +
  'cracked and dry, with only a few stubborn carrots hinting at better days. ' +
  'A faint breeze rustles the brittle leaves, carrying the scent of soil and ' +
  'distant rain. These rows were green a month ago.'
const WATERED_DESCRIPTION =
  'Rows of green crops stretch beneath an open sky. The earth is dark and soft ' +
  'where the clean well water soaked in, and young leaves stand tall where ' +
  'brittle ones once curled. A breeze carries the scent of damp soil. ' +
  'The field feels awake again, as if it has finally let out the breath it ' +
  'was holding.'

/**
 * Vegetable Field room: blighted crops establishing early restorative themes.
 *
 * Entering the field sets FLAG_INVESTIGATED_WITHERED_CROPS unprompted. Once
 * it is watered with purified well water (FLAG_VEGETABLE_FIELD_WATERED) the
 * description shows the field recovered; `descriptionFor` reads the flag
 * each time the room is shown. The withered field mentions the rusty hoe only
 * while the hoe still lies in it.
 */
export class VegetableField extends Room {
  /** The sound state of the field before it is watered. */
  static readonly SOUND_WITHERED = 'withered'
  /** The sound state of the field once it is watered. */
  static readonly SOUND_GREEN = 'green'

  constructor() {
    super({
      name: 'Vegetable Field',
      description: WITHERED_DESCRIPTION,
      items: [new WitheredCarrot(), new RustyHoe(), new DullKnife()],
      characters: [],
      exits: {
        north: 'EliorsCottage',
        east: 'VillageWell',
        south: 'ChickenCoop',
      },
    })
  }

  /** Sounds withered or, once watered, green: the crow gives way to birds. */
  override soundState(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)
      ? VegetableField.SOUND_GREEN
      : VegetableField.SOUND_WITHERED
  }

  /** The room's sound states, the one it starts in first. */
  override soundStates(): readonly string[] {
    return [VegetableField.SOUND_WITHERED, VegetableField.SOUND_GREEN]
  }

  /** The field withered (with or without its rusty hoe) or, once watered, recovered. */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED))
      return WATERED_DESCRIPTION
    return this.items.some((item) => item instanceof RustyHoe)
      ? WITHERED_DESCRIPTION
      : WITHERED_WITHOUT_HOE_DESCRIPTION
  }

  /** Set the investigation story flag when the player enters the field. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    super.onEnter(gameState)
  }
}

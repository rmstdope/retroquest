import { Room, type GameState } from '@/engine'
import { MineOverseer } from '../characters/MineOverseer'

/** The misty entrance to the ancient cavern system. */
export class CavernMouth extends Room {
  constructor() {
    super({
      name: 'Cavern Mouth',
      description:
        'A broad arch opens into the hill, hung with cold mist. ' +
        'Lantern light dims a step inside it. ' +
        'Old signs are cut into the arch stone, worn too smooth to read.',
      items: [],
      characters: [new MineOverseer()],
      exits: { north: 'ToolCache', east: 'StillnessVestibule' },
    })
  }

  /**
   * The room's look, from the current wording, so a save made before a
   * wording change shows the current text.
   */
  override descriptionFor(_gameState: GameState): string {
    return new CavernMouth().description
  }
}

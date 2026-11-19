import { Item, type Character, type GameState } from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'

/** The item's description; `descriptionFor` returns it in older saves. */
export const CRYSTAL_CLEAR_WATER_DESCRIPTION =
  "Water from the nymphs' stream, so clear the flask looks empty until " +
  'you tip it. No bucket has ever gone down that spring.'

/** Water from the nymphs' stream, which Elena's cure needs. */
export class CrystalClearWater extends Item {
  constructor() {
    super({
      name: 'crystal-clear water',
      shortName: 'water',
      description: CRYSTAL_CLEAR_WATER_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** The look: the class's own wording, so an older save reads the current text. */
  override descriptionFor(): string {
    return CRYSTAL_CLEAR_WATER_DESCRIPTION
  }

  /**
   * Used with Elena the water purifies her; with anyone else it is handed
   * over, as any item is (the Ancient Tree Spirit takes it as a gift).
   */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof BarmaidElena) {
      return target.receiveCrystalWaterPurification(gameState)
    }
    return super.useOnCharacter(gameState, target)
  }
}

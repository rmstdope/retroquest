import { Item, type Character, type GameState, characterName } from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'

/** The item's description; `Act2.afterLoad` restores it in older saves. */
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

  /** Use crystal-clear water on a character to purify them. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    // Special handling for Elena's curse purification
    if (target instanceof BarmaidElena) {
      return target.receiveCrystalWaterPurification(gameState)
    }
    const name = target.name
    return (
      'The [item_name]crystal-clear water[/item_name] glows faintly when ' +
      'near ' +
      characterName(name) +
      ', but it seems this blessed water is meant for someone ' +
      'specifically afflicted by dark magic.'
    )
  }
}

import {
  Item,
  type Character,
  type GameState,
  characterName,
  event,
} from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'

/** Purifying water item that can cleanse curses and dark enchantments. */
export class CrystalClearWater extends Item {
  constructor() {
    super({
      name: 'crystal-clear water',
      shortName: 'water',
      description:
        'Water from the sacred spring in the Whispering Glade, this liquid is so ' +
        'pure it seems to glow with its own inner light. The water has been ' +
        'blessed by the water nymphs and carries powerful purification magic ' +
        'that can break curses and cleanse dark enchantments. Each drop sparkles ' +
        'like liquid starlight, and the container feels cool to the touch.',
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

  /** Examine the water and sense the purification magic within. */
  override examine(_gameState: GameState): string {
    const description = this.description
    return event(
      `You examine the [item_name]crystal-clear water[/item_name]. ${description}` +
        ' The liquid moves with an otherworldly fluidity, and you can ' +
        'sense the powerful purification magic contained within. This ' +
        'water could break even the strongest curses.',
    )
  }
}

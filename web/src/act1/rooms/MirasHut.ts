import { characterName, Room, type GameState } from '@/engine'
import { HealingHerb } from '../items/HealingHerb'
import { AncientAmulet } from '../items/AncientAmulet'
import { Mira } from '../characters/Mira'

const GLOW =
  ' On its stand, the [item_name]Ancient Amulet[/item_name] glows brighter as you ' +
  'step in, as if something you carry has woken it.'
const EMPTY_STAND = ' The stand where the amulet rested stands empty.'

/**
 * Mira's Hut room: early healing and mystical mentor resource node. The
 * amulet on its stand glows brighter while Elior carries the locket or his
 * mother's letter; once Mira has handed it over the stand reads as empty.
 */
export class MirasHut extends Room {
  constructor() {
    super({
      name: "Mira's Hut",
      description:
        'A fragrant hut filled with drying herbs and mysterious potions. Shelves ' +
        'overflow with bottles, roots, and colorful flowers. The air is thick with ' +
        'the scent of lavender and sage. Sunlight streams through stained glass, ' +
        `painting the walls in shifting hues. ${characterName('Mira')} herself moves gracefully among ` +
        'her concoctions, her eyes bright with knowledge and kindness.',
      items: [new HealingHerb(), new AncientAmulet()],
      characters: [new Mira()],
      exits: { south: 'VillageSquare' },
    })
  }

  /** Add the amulet's glow or the empty stand to the description, then describe. */
  override describe(gameState: GameState): string {
    const base = this.description.replace(GLOW, '').replace(EMPTY_STAND, '')
    const onStand = this.items.some((item) => item instanceof AncientAmulet)
    const keepsake =
      gameState.hasItem('locket') || gameState.hasItem("mother's letter")
    this.description = base + (onStand ? (keepsake ? GLOW : '') : EMPTY_STAND)
    return super.describe(gameState)
  }
}

import { Item, type GameState } from '@/engine'
import { FLAG_MENDED_LIBRARY_ENCHANTMENTS } from '../Act2StoryFlags'

/** Static environmental magical barriers protecting restricted library texts. */
export class ProtectiveEnchantments extends Item {
  constructor() {
    super({
      name: 'protective enchantments',
      shortName: 'enchantments',
      description:
        'Shimmering magical barriers that surround the most valuable texts in the ' +
        'ancient library. These enchantments appear damaged by time, with flickering ' +
        'energy and weak points that suggest they need repair. The ancient magic that ' +
        'protects this knowledge requires restoration before the texts can be safely ' +
        'accessed.',
      canBeCarried: false,
    })
  }

  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS)) {
      return (
        'The [item_name]protective enchantments[/item_name] now glow steadily with ' +
        'restored power. The magical barriers around the most valuable texts have ' +
        'been successfully repaired, allowing access to the ancient knowledge within.'
      )
    }
    return (
      'The [item_name]protective enchantments[/item_name] flicker weakly, showing clear ' +
      'signs of damage from the passage of time. These ancient magical barriers ' +
      'need to be repaired with restoration magic before they can properly protect ' +
      "the library's most precious texts."
    )
  }

  /** Use the protective enchantments (not directly usable). */
  useItem(_gameState: GameState): string {
    return (
      '[failure]The protective enchantments are magical barriers, not something you ' +
      'can use directly.[/failure]'
    )
  }
}

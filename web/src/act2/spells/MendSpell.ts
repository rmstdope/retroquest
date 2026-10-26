import { Spell, type GameState, type Item } from '@/engine'
import { FLAG_MENDED_LIBRARY_ENCHANTMENTS } from '../Act2StoryFlags'
import { ProtectiveEnchantments } from '../items/ProtectiveEnchantments'
import { TrainingSword } from '../items/TrainingSword'

/**
 * Utility repair spell with special handling for library protective wards.
 * Any item whose description mentions 'broken' or 'damaged' can be repaired;
 * the Hidden Library's ProtectiveEnchantments set a story flag on first repair.
 */
export class MendSpell extends Spell {
  constructor() {
    super({
      id: 'mend',
      name: 'mend',
      description:
        'A basic repair spell that can fix broken objects, torn clothing, and ' +
        'minor damage to items. This fundamental magic is essential for any ' +
        'aspiring mage.',
    })
  }

  /** Cast mend without a target; nothing nearby needs repair. */
  override castSpell(_gameState: GameState): string {
    return (
      '[success]The spell shimmers in the air, looking for something to ' +
      'repair, but finds nothing that needs mending nearby.[/success]'
    )
  }

  /** Repair the target item: the library wards when they are the target; Cedric's notched sword is left alone on purpose. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    // Special handling for protective enchantments in Hidden Library
    if (targetItem instanceof ProtectiveEnchantments) {
      if (!gameState.getStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS)) {
        gameState.setStoryFlag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, true)
        return (
          '[success]The magical barriers flicker and ' +
          'stabilize as your repair magic restores their integrity. The ' +
          'shimmering barriers around the most valuable texts now glow ' +
          'steadily. You have proven your worthiness and respect for ' +
          'ancient knowledge.[/success]'
        )
      }
      return (
        `[failure]${targetItem.nameInSentence({ atStart: true })} have already been repaired ` +
        'and are functioning properly.[/failure]'
      )
    }
    if (targetItem instanceof TrainingSword) {
      return (
        'The notch by the guard starts to close under your hand, and you ' +
        'stop. Somebody cut that notch as a boy, and it is how he will ' +
        'know the blade. You leave it as it is.'
      )
    }
    // Check if the item can be repaired (this is the original implementation)
    const lowered = targetItem.description.toLowerCase()
    if (lowered.includes('broken') || lowered.includes('damaged')) {
      return (
        '[success]Magical energy flows through the damaged item, repairing ' +
        'damage and restoring it to working condition![/success]'
      )
    }
    const name = this.name
    return (
      `[failure]You cast [spell_name]${name}[/spell_name] on ` +
      `${targetItem.nameInSentence()}, but it doesn't appear to need any ` +
      'repairs. The spell has no effect.[/failure]'
    )
  }
}

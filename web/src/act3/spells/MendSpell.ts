import { Spell, type GameState, type Item } from '@/engine'
import { MirrorMount } from '../items/MirrorMount'

/**
 * Mend spell used to finish repairs on Mirror Mounts in Act 3.
 *
 * Casting this spell on a MirrorMount will call its `mend` method so the
 * mount can finalize and set the quest completion flag.
 */
export class MendSpell extends Spell {
  constructor() {
    super({
      name: 'mend',
      description:
        'A focused repair charm used to bind and finish delicate work; in ' +
        'Mount Ember it is used to set the final mirrors into resonance.',
    })
  }

  /** Cast the mend spell without a specific target. */
  override castSpell(_gameState: GameState): string {
    const name = this.displayName
    return (
      `[success]You cast [spell_name]${name}[/spell_name] into the air. The ` +
      'magic shivers but finds nothing to mend nearby.[/success]'
    )
  }

  /** If targetItem is a MirrorMount call its mend method, otherwise fall back. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof MirrorMount) {
      // Delegate to the mount's mend method which sets story flags when ready
      return targetItem.mend(gameState)
    }

    // Fallback behavior: mimic the generic mend response
    const name = this.displayName
    const iname = targetItem.name
    return (
      `[dim]You cast [spell_name]${name}[/spell_name] on ` +
      `[item_name]${iname}[/item_name], but it doesn't appear to need mending.[/dim]`
    )
  }
}

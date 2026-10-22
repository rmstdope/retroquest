import { Spell, type GameState, type Item } from '@/engine'
import { Locker } from '../items/Locker'
import { SupplyCrate } from '../items/SupplyCrate'

/** A deft sigil that loosens fused pins and grudging clasps. */
export class UnlockSpell extends Spell {
  constructor() {
    super({
      id: 'unlock',
      name: 'unlock',
      description: 'A deft sigil that loosens fused pins and grudging clasps.',
    })
  }

  /** Cast unlock on an item: the fused locker, or the miners' supply crate. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof Locker) {
      return targetItem.unlock(gameState)
    }
    if (targetItem instanceof SupplyCrate) {
      return targetItem.unlockWithSpell(gameState)
    }
    return (
      `[failure]You cast [spell_name]${this.name}[/spell_name] on ` +
      `[item_name]${targetItem.name}[/item_name], but no lock ` +
      'yields.[/failure]'
    )
  }
}

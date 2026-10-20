import { Spell, type GameState, type Item } from '@/engine'
import { Locker } from '../items/Locker'

/** A deft sigil that loosens fused pins and grudging clasps. */
export class UnlockSpell extends Spell {
  constructor() {
    super({
      name: 'unlock',
      description: 'A deft sigil that loosens fused pins and grudging clasps.',
    })
  }

  /** Cast unlock spell on target item, specifically handling lockers. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof Locker) {
      return targetItem.unlock(gameState)
    }
    return (
      `[failure]You cast [spell_name]${this.name}[/spell_name] on ` +
      `[item_name]${targetItem.name}[/item_name], but no lock ` +
      'yields.[/failure]'
    )
  }
}

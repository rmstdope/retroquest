import { Spell, clue, type GameState, type Item } from '@/engine'
import { Locker } from '../items/Locker'
import { SupplyCrate } from '../items/SupplyCrate'

/** Mira's second lesson: opens the fused locker and the miners' supply crate. */
export class UnlockSpell extends Spell {
  constructor() {
    super({
      id: 'unlock',
      name: 'unlock',
      description: 'The second thing Mira showed you: how to open.',
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
    return clue('That has no lock or magical seal to open.')
  }
}

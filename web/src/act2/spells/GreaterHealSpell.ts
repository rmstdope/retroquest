import { Spell, type Character, type GameState, type Item } from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'
import { Caravan } from '../items/Caravan'

/**
 * Advanced restorative spell used in Elena's staged cure and high-impact
 * healing. Casting on BarmaidElena invokes her first recovery step.
 */
export class GreaterHealSpell extends Spell {
  constructor() {
    super({
      id: 'greater_heal',
      name: 'greater heal',
      description:
        'An advanced healing spell that can cure serious ailments, break ' +
        'curses, and restore significant health. This powerful magic ' +
        'requires deep understanding of healing arts and compassion.',
    })
  }

  override castSpell(_gameState: GameState): string {
    return (
      '[success]Powerful healing energy radiates outward, ready to cure ' +
      'serious ailments, but finds no one in immediate need of healing ' +
      'nearby.[/success]'
    )
  }

  /** The rescued merchants answer the spell; in any other item nothing answers it, as usual. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof Caravan) {
      return targetItem.receiveGreaterHeal(gameState)
    }
    return super.castOnItem(gameState, targetItem)
  }

  override castOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    // Special handling for Elena's curse
    if (targetCharacter instanceof BarmaidElena) {
      // Invoke Elena's staged recovery handler
      return targetCharacter.receiveGreaterHeal(gameState)
    }
    return (
      '[success]Golden healing energy flows from your hands, restoring ' +
      'vitality and curing any minor ailments.[/success]'
    )
  }
}

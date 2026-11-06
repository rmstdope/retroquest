import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
} from '@/engine'
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
        `${characterName('Lyria')} taught you over the carter's bed: gather your healing into a ` +
        'narrow light. It makes the weak strong. It does not lift a curse.',
    })
  }

  /** Give a spell learned in an older save the current description. */
  override refreshSavedText(): void {
    this.description = new GreaterHealSpell().description
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

  /** Heal a character: Elena's staged recovery, anyone else finds nothing to mend. */
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
      `[success]Golden light settles over ${targetCharacter.nameInSentence()} ` +
      'and finds nothing that needs it.[/success]'
    )
  }
}

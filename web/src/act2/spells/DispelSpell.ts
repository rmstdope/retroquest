import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
} from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'

/**
 * Counter-magic spell for breaking enchantments and Elena's final cure phase.
 * Casting on BarmaidElena defers to her final-cure logic; otherwise generic
 * dispel narration.
 */
export class DispelSpell extends Spell {
  constructor() {
    super({
      name: 'dispel',
      description:
        'A powerful counter-magic spell that can break magical barriers, ' +
        'dispel illusions, and counter enemy enchantments. This advanced ' +
        'magic requires deep understanding of magical theory and precise ' +
        'control.',
    })
  }

  override castSpell(_gameState: GameState): string {
    const name = this.displayName
    return (
      `[success]You cast [spell_name]${name}[/spell_name], sending out waves of ` +
      'counter-magic that neutralize hostile enchantments. The spell ripples ' +
      'through the air, ready to break magical barriers and curses, but finds ' +
      'no active magic to dispel nearby.[/success]'
    )
  }

  override castOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    // Special handling for Elena's curse - final step
    if (targetCharacter instanceof BarmaidElena) {
      return targetCharacter.receiveDispelFinalCure(gameState)
    }
    const name = this.displayName
    const tname = targetCharacter.name
    return (
      `[success]You cast [spell_name]${name}[/spell_name] on ` +
      characterName(tname) +
      '. Counter-magic flows around them, dispelling any minor ' +
      'enchantments and magical effects they may have been affected ' +
      'by.[/success]'
    )
  }

  override castOnItem(_gameState: GameState, targetItem: Item): string {
    // This could be used for breaking magical barriers or dispelling cursed items
    const name = this.displayName
    const iname = targetItem.name
    return (
      `[success]You cast [spell_name]${name}[/spell_name] on ` +
      `[item_name]${iname}[/item_name]. Counter-magic flows through the ` +
      'item, neutralizing any magical enchantments or curses that may ' +
      'have been affecting it.[/success]'
    )
  }
}

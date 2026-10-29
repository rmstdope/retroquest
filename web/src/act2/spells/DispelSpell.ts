import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import { BarmaidElena } from '../characters/BarmaidElena'
import { SpectralLibrarian } from '../characters/SpectralLibrarian'

/**
 * Counter-magic spell for breaking enchantments and Elena's final cure phase.
 * Casting on BarmaidElena defers to her final-cure logic; on the Spectral
 * Librarian it slides off, since the unbinding was theirs first; otherwise
 * generic dispel narration.
 */
export class DispelSpell extends Spell {
  constructor() {
    super({
      id: 'dispel',
      name: 'dispel',
      description:
        "The Wardens' unbinding, from their chronicle: loosen what another " +
        'hand has bound.',
    })
  }

  /** Cast dispel without a target: no active magic nearby. */
  override castSpell(_gameState: GameState): string {
    return (
      '[success]Waves of counter-magic ripple through the air, ready to ' +
      'break magical barriers and curses, but find no active magic to ' +
      'dispel nearby.[/success]'
    )
  }

  /** Dispel on a character: one fixed sentence for anyone but Elena and the Librarian. */
  override castOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    // Special handling for Elena's curse - final step
    if (targetCharacter instanceof BarmaidElena) {
      return targetCharacter.receiveDispelFinalCure(gameState)
    }
    if (targetCharacter instanceof SpectralLibrarian) {
      return (
        'The unbinding slides off the ' +
        characterName(targetCharacter.name) +
        ' like water off glass.\n' +
        speech(
          'It was ours before it was yours. It does not work on the hand ' +
            'that wrote it down.',
        )
      )
    }
    return (
      '[success]Counter-magic flows outward, dispelling any minor ' +
      'enchantments and magical effects it finds.[/success]'
    )
  }

  /** Dispel on an item: one fixed sentence whatever the item is. */
  override castOnItem(_gameState: GameState, _targetItem: Item): string {
    return '[success]The unbinding finds nothing bound in it.[/success]'
  }
}

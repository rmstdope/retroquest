import { Spell, type Character, type GameState, type Item } from '@/engine'
import { WardingPillars } from '../items/WardingPillars'
import { Steles } from '../items/Steles'

/** Act III variant of Purify, customized for Sunken Ruins interactions. */
export class PurifySpell extends Spell {
  constructor() {
    super({
      id: 'purify',
      name: 'purify',
      description:
        'Your mother taught it to the fisherman at the bend, and he gave it ' +
        'back to you. It makes foul water clean.',
    })
  }

  /** Cast purify spell providing cleansing aura. */
  override castSpell(_gameState: GameState): string {
    // Act III version has no global gating; it always responds with a cleansing aura
    return 'A brine-bright clarity flows from your hands, cutting through the mire.'
  }

  /** Cast purify on an item: the warding pillars, or the salt-crusted steles. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof WardingPillars) {
      return targetItem.purify(gameState)
    }
    if (targetItem instanceof Steles) {
      return targetItem.purify(gameState)
    }
    return 'Saltlight skims the surface, though nothing more changes.'
  }

  /** Cast purify on target character to provide cleansing calm. */
  override castOnCharacter(
    _gameState: GameState,
    _targetCharacter: Character,
  ): string {
    return 'A cleansing calm settles, washing away lingering dread.'
  }
}

import {
  Spell,
  type Character,
  type GameState,
  type Item,
  clue,
} from '@/engine'
import { MysteriousBox } from '../items/MysteriousBox'
import { Mechanism } from '../items/Mechanism'

/** Spell that attempts to open locks, magical or mundane, by focused intent. */
export class UnlockSpell extends Spell {
  constructor() {
    super({
      id: 'unlock',
      name: 'unlock',
      description: 'The second thing Mira showed you: how to open.',
    })
  }

  /** Handle casting without an explicit target: prompt for an object to unlock. */
  override castSpell(_gameState: GameState): string {
    return (
      '[failure]You cast [spell_name]unlock[/spell_name] into the air, but magic requires a ' +
      'target to focus on. What do you wish to unlock?[/failure]'
    )
  }

  /** Unlock the mysterious box; the mill's mechanism has no lock to find; other items refuse. */
  override castOnItem(gameState: GameState, item: Item): string {
    if (item instanceof MysteriousBox) {
      return item.unlock(gameState)
    }
    if (item instanceof Mechanism) {
      return (
        'The spell finds nothing to turn. The black iron has no lock; it was ' +
        'never meant to be opened, only to run' +
        (item.repaired ? ', and now not even that.' : '.')
      )
    }
    return clue('That has no lock or magical seal to open.')
  }

  /** Casting on characters always fails; characters are not unlockable objects. */
  override castOnCharacter(
    _gameState: GameState,
    _character: Character,
  ): string {
    return clue("You can't unlock a person!")
  }
}

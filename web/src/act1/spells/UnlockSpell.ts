import {
  Spell,
  type Character,
  type GameState,
  type Item,
  characterName,
  event,
} from '@/engine'
import { MysteriousBox } from '../items/MysteriousBox'
import { Mechanism } from '../items/Mechanism'

/** Spell that attempts to open locks, magical or mundane, by focused intent. */
export class UnlockSpell extends Spell {
  constructor() {
    super({
      id: 'unlock',
      name: 'unlock',
      description:
        'A spell that can open magically sealed or complex mundane locks.',
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
      return event(
        'The sigil finds nothing to turn. The black iron has no lock; it was ' +
          'never meant to be opened, only to run' +
          (item.repaired ? ', and now not even that.' : '.'),
      )
    }
    const name = item.name
    return (
      `[failure]You cast [spell_name]unlock[/spell_name] on [item_name]${name}[/item_name], ` +
      'but it seems to lack any locks or magical seals to open.[/failure]'
    )
  }

  /** Casting on characters always fails; characters are not unlockable objects. */
  override castOnCharacter(
    _gameState: GameState,
    character: Character,
  ): string {
    const name = character.name
    return (
      `[failure]You can't unlock ${characterName(name)}. They are not a ` +
      'locked object![/failure]'
    )
  }
}

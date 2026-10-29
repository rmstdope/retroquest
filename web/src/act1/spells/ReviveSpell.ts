import {
  Spell,
  type Character,
  type GameState,
  type Item,
  clue,
} from '@/engine'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { Bush } from '../items/Bush'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Restore life to withered plants; the carrot and the bush answer, living people do not. */
export class ReviveSpell extends Spell {
  constructor() {
    super({
      id: 'revive',
      name: 'revive',
      description:
        "Your father's word for calling a thing back when it is nearly " +
        'gone. Grandmother remembered it for you.',
    })
  }

  private outOfReach(): string {
    return (
      'You focus your will, a faint warmth spreads from your fingertips, ' +
      'and nothing answers it. The warmth is yours; the door it wants is ' +
      'not open yet.'
    )
  }

  /** Cast without a target: check gating then prompt for a target. */
  override castSpell(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    return '[failure]What do you want to cast [spell_name]revive[/spell_name] on?[/failure]'
  }

  /** Revive the withered carrot, or green the Forest Path's bush; other items refuse. */
  override castOnItem(gameState: GameState, item: Item): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    if (item instanceof WitheredCarrot) {
      // The WitheredCarrot is revived in place (inventory or room).
      const revivalMessage = item.revive()
      return revivalMessage
    }
    if (item instanceof Bush) return item.revive(gameState)
    const name = item.name
    return `[failure]You can't revive [item_name]${name}[/item_name].[/failure]`
  }

  /** Casting on characters is not supported in Act I; always fails for living targets. */
  override castOnCharacter(
    gameState: GameState,
    _character: Character,
  ): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    return clue("You can't revive someone who is very much alive!")
  }
}

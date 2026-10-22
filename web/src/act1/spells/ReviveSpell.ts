import {
  Spell,
  type Character,
  type GameState,
  type Item,
  event,
  characterName,
} from '@/engine'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { Bush } from '../items/Bush'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Restore life to withered plants or recently deceased small creatures. */
export class ReviveSpell extends Spell {
  constructor() {
    super({
      id: 'revive',
      name: 'revive',
      description:
        'A potent spell that can restore life to withered plants or even recently ' +
        'deceased small creatures.',
    })
  }

  private outOfReach(): string {
    return event(
      'You focus your will, a faint warmth spreads from your fingertips, ' +
        'and nothing answers it. The warmth is yours; the door it wants is ' +
        'not open yet.',
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
      return (
        event(
          'You channel the life-giving energy into the ' +
            '[item_name]Withered Carrot[/item_name].',
        ) +
        '\n' +
        revivalMessage
      )
    }
    if (item instanceof Bush) return item.revive(gameState)
    const name = item.name
    return `[failure]You can't revive [item_name]${name}[/item_name].[/failure]`
  }

  /** Casting on characters is not supported in Act I; always fails for living targets. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    const name = character.name
    return (
      `[failure]You can't revive ${characterName(name)}. ` +
      'They are very much alive![/failure]'
    )
  }
}

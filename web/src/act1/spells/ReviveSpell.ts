import {
  Spell,
  type Character,
  type GameState,
  type Item,
  clue,
  characterName,
} from '@/engine'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { Bush } from '../items/Bush'
import { Scenery } from '../items/Scenery'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from '../Act1StoryFlags'

/** The scenery key of the Vegetable Field's crops. */
const CROPS_KEY = 'VegetableField.crops'

/** Restore life to withered plants; the carrot and the bush answer, living people do not. */
export class ReviveSpell extends Spell {
  constructor() {
    super({
      id: 'revive',
      name: 'revive',
      description:
        "Your father's word for calling a thing back when it is nearly " +
        `gone. ${characterName('Grandmother')} remembered it for you.`,
    })
  }

  /** Give a spell known in an older save the current description, which colours who taught it. */
  override refreshSavedText(): void {
    this.description = new ReviveSpell().description
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

  /** The parched crops are thirsty, not gone; once watered there is nothing to call back. */
  private onCrops(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)) {
      return (
        '[failure]The crops are green and standing; there is nothing in ' +
        'them to call back.[/failure]'
      )
    }
    return clue(
      'The warmth runs into the leaves and straight back out again. ' +
        'These crops are not gone, only thirsty; what they are calling for ' +
        'is water.',
    )
  }

  /**
   * Revive the withered carrot, or green the Forest Path's bush; the crops
   * say they want water; other items refuse.
   */
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
    if (item instanceof Scenery && item.key === CROPS_KEY) {
      return this.onCrops(gameState)
    }
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

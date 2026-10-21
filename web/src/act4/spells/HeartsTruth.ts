import { Spell, type Character, type GameState, type Item } from '@/engine'
import { SorceressOfLies } from '../characters/SorceressOfLies'

/** What the spell hears where there is no lie. */
const NOTHING_TO_HEAR =
  '[dim]You listen for a hidden heart, but there is no lie here to hear ' +
  'beneath.[/dim]'

/**
 * Learned when the knight's badge is shown to the Sorceress of Lies: hears the
 * true heart beneath a lie. Cast on her it shows her loneliness.
 */
export class HeartsTruth extends Spell {
  constructor() {
    super({
      id: 'hearts_truth',
      name: "Heart's Truth",
      description: 'Hear the true heart beneath a lie.',
    })
  }

  /** Nothing to hear without a target. */
  override castSpell(_gameState: GameState): string {
    return NOTHING_TO_HEAR
  }

  /** Nothing to hear in an item. */
  override castOnItem(_gameState: GameState, _target: Item): string {
    return NOTHING_TO_HEAR
  }

  /** Only the Sorceress of Lies has a heart hidden beneath a lie. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof SorceressOfLies) return target.hearHeart(gameState)
    return NOTHING_TO_HEAR
  }
}

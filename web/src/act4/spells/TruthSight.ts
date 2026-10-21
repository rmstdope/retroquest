import { Spell, type Character, type GameState, type Item } from '@/engine'
import { KnightOfDespair } from '../characters/KnightOfDespair'

/** What the spell shows where nothing is hidden. */
const NOTHING_HIDDEN =
  '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]'

/** Learned in the Mirror Labyrinth: sees through illusion to what is really there. */
export class TruthSight extends Spell {
  constructor() {
    super({
      id: 'truth_sight',
      name: 'Truth Sight',
      description: 'See through illusion to what is really there.',
    })
  }

  /** Nothing is hidden anywhere in this piece of the act. */
  override castSpell(_gameState: GameState): string {
    return NOTHING_HIDDEN
  }

  /** Nothing is hidden in an item. */
  override castOnItem(_gameState: GameState, _target: Item): string {
    return NOTHING_HIDDEN
  }

  /** The Knight of Despair is shown as he is; nothing is hidden in anyone else. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof KnightOfDespair) return target.seeThrough(gameState)
    return NOTHING_HIDDEN
  }
}

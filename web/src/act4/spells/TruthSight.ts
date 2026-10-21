import { Spell, type Character, type GameState, type Item } from '@/engine'

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

  /** Nothing is hidden in a character yet (the knight comes with his own piece). */
  override castOnCharacter(_gameState: GameState, _target: Character): string {
    return NOTHING_HIDDEN
  }
}

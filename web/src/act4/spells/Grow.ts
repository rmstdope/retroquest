import { Spell, type GameState, type Item, event } from '@/engine'

/**
 * The first and smallest spell, the one Elior keeps after the Sacrifice
 * ending. Act IV carries its own copy so the acts stay self-contained.
 */
export class Grow extends Spell {
  constructor() {
    super({
      id: 'grow',
      name: 'grow',
      description: 'A nature spell that encourages plants to flourish.',
    })
  }

  /** Cast alone, the plants nearby answer and nothing else happens. */
  override castSpell(_gameState: GameState): string {
    return (
      event('You cast [spell_name]grow[/spell_name].') +
      '\n' +
      'The nearby plants seem to respond with vibrant energy, ' +
      'but nothing else happens.'
    )
  }

  /** Cast on an item, the item decides what growing does to it. */
  override castOnItem(gameState: GameState, item: Item): string {
    return item.grow(gameState)
  }
}

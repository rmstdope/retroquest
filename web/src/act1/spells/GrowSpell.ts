import { Spell, type GameState, type Item, event } from '@/engine'

/** Spell that encourages plants to flourish; delegates growth to items. */
export class GrowSpell extends Spell {
  constructor() {
    super({
      id: 'grow',
      name: 'grow',
      description: 'A nature spell that encourages plants to flourish.',
    })
  }

  override castSpell(_gameState: GameState): string {
    return (
      event('You cast [spell_name]grow[/spell_name].') +
      '\n' +
      'The nearby plants seem to respond with vibrant energy, ' +
      'but nothing else happens.'
    )
  }

  override castOnItem(gameState: GameState, item: Item): string {
    return item.grow(gameState)
  }
}

import { Item, type GameState } from '@/engine'

/** A bundle of medicinal herbs used for healing and crafting. */
export class HealingHerbs extends Item {
  constructor() {
    super({
      name: 'healing herbs',
      shortName: 'herbs',
      description:
        'A bundle of carefully selected medicinal herbs known for their ' +
        'healing properties. These herbs are essential for advanced healing ' +
        'magic and potion-making.',
      canBeCarried: true,
    })
  }

  /** Inspect the fresh herbs. */
  override use(_gameState: GameState): string {
    return (
      'The healing herbs are fresh and potent - perfect for use ' +
      'in advanced healing magic, training with Master Healer Lyria, or crafting ' +
      'powerful remedies.'
    )
  }
}

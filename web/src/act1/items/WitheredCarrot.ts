import { Item, type GameState } from '@/engine'

/** A shriveled carrot that can be revived into a fresh carrot. */
export class WitheredCarrot extends Item {
  constructor() {
    super({
      name: 'withered carrot',
      description:
        'A shriveled, orange carrot barely clinging to life. It looks edible, ' +
        'but only just.',
      shortName: 'carrot',
      canBeCarried: true,
    })
  }

  /** Turn the withered carrot into a fresh carrot and return a message (ReviveSpell). */
  revive(): string {
    this.name = 'fresh carrot'
    this.shortName = 'carrot'
    this.description =
      'A vibrant, healthy carrot, freshly revived. It looks delicious and ' +
      'full of nutrients.'
    return (
      'The [item_name]' +
      this.name.toLowerCase() +
      '[/item_name] looks vibrant and healthy!'
    )
  }

  /** The line for the carrot as it is when taken: withered, or fresh once revived. */
  override pickedUp(_gameState: GameState): string {
    if (this.name === 'fresh carrot') {
      return (
        'It is cool and firm, with soil still on it. ' +
        'Not long ago it was barely alive.'
      )
    }
    return (
      'It bends in your fingers, soft and nearly gone. ' +
      'It is still a carrot, just.'
    )
  }
}

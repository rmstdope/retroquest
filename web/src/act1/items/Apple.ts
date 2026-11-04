import { Item, nameInSentence, speech, type GameState } from '@/engine'

/** Basic food item; the shopkeeper blocks pickup until it has been bought. */
export class Apple extends Item {
  constructor() {
    super({
      name: 'apple',
      description:
        'A crisp, red apple. It looks fresh and delicious, perfect for a quick snack.',
    })
  }

  /** Shopkeeper prevents taking the apple unless it's been given/purchased. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        nameInSentence('character', 'Hemlock', { atStart: true }) +
        ' quickly steps over. ' +
        speech(
          `Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
            "is merchandise, not a free sample. If you want it, you'll need to buy it " +
            'proper-like.',
        )
      )
    }
    return ''
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is crisp and cold, and nearly too red. ' + 'You save it for later.'
    )
  }
}

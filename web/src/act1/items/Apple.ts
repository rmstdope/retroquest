import { Item, characterName, speech } from '@/engine'

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
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          `'Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
            "is merchandise, not a free sample. If you want it, you'll need to buy it " +
            "proper-like.'",
        )
      )
    }
    return ''
  }
}

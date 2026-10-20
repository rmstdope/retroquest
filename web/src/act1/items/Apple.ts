import { Item } from '@/engine'

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
        '[character_name]Shopkeeper[/character_name] quickly steps over. ' +
        `[dialogue]'Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
        "is merchandise, not a free sample. If you want it, you'll need to buy it " +
        "proper-like.'[/dialogue]"
      )
    }
    return ''
  }
}

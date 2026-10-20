import { Item, type GameState } from '@/engine'
import { Coin } from './Coin'

/** Gardening hoe with a rusted blade and splintered handle, useful for tilling soil. */
export class RustyHoe extends Item {
  constructor() {
    super({
      name: 'rusty hoe',
      description:
        'A gardening hoe with a rusted blade and a splintered handle. ' +
        'It might still be useful for tilling soil.',
      shortName: 'hoe',
      canBeCarried: true,
    })
  }

  /** Till the soil in Vegetable Field to find a coin, otherwise fail. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name === 'Vegetable Field') {
      const playerHasCoin = gameState.inventory.some(
        (item) => item instanceof Coin,
      )
      if (!playerHasCoin) {
        gameState.addItemToInventory(new Coin())
        return (
          '[event]You till the soil with the [item_name]rusty hoe[/item_name]. ' +
          'The ground is tough, and you unearth a small, tarnished ' +
          '[item_name]coin[/item_name]! ' +
          'You quickly pocket it.[/event]'
        )
      }
      return (
        '[failure]You till the soil again with the [item_name]hoe[/item_name], but it ' +
        "seems you've already found what was hidden here.[/failure]"
      )
    }
    return (
      "[failure]You swing the [item_name]rusty hoe[/item_name], but it doesn't seem to " +
      "have much effect here. It's a sturdy (but rusty) tool, though.[/failure]"
    )
  }
}

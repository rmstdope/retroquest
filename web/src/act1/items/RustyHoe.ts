import { Item, type GameState, clue } from '@/engine'
import { Coin } from './Coin'
import { VegetableField } from '../rooms/VegetableField'
import { FLAG_RUSTY_HOE_FIRST_COIN_FOUND } from '../Act1StoryFlags'

/** Gardening hoe with a rusted blade and splintered handle. */
export class RustyHoe extends Item {
  constructor() {
    super({
      name: 'rusty hoe',
      description: 'A hoe with a rusted blade and a splintered handle.',
      shortName: 'hoe',
      canBeCarried: true,
    })
  }

  /** Till the field to find its one coin, otherwise fail. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof VegetableField) {
      if (!gameState.getStoryFlag(FLAG_RUSTY_HOE_FIRST_COIN_FOUND)) {
        gameState.setStoryFlag(FLAG_RUSTY_HOE_FIRST_COIN_FOUND, true)
        gameState.addItemToInventory(new Coin())
        return (
          'The ground is tough, and you unearth a small, tarnished ' +
          '[item_name]coin[/item_name]! ' +
          'You quickly pocket it.'
        )
      }
      return (
        '[failure]You till the soil again with the [item_name]hoe[/item_name], but it ' +
        "seems you've already found what was hidden here.[/failure]"
      )
    }
    return clue(
      "You swing the [item_name]rusty hoe[/item_name], but it doesn't seem to " +
        "have much effect here. It's a sturdy (but rusty) tool, though.",
    )
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'Rust comes off on your palm. ' +
      'Someone worked a field with it for years.'
    )
  }
}

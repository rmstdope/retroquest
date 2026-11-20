import { Item, type GameState, clue } from '@/engine'
import { Coin } from './Coin'
import { VegetableField } from '../rooms/VegetableField'
import { FLAG_RUSTY_HOE_FIRST_COIN_FOUND } from '../Act1StoryFlags'

const NAME = 'rusty trowel'
const SHORT_NAME = 'trowel'
const DESCRIPTION = 'A trowel with a rusted blade and a worn wooden handle.'

/**
 * Gardening trowel with a rusted blade and a worn wooden handle. It was the
 * rusty hoe until the words were made to match its picture; saves still name
 * it by the old registry key (`RustyHoe` in `classes.ts`) and
 * `refreshSavedText` gives a saved one its new name.
 */
export class RustyTrowel extends Item {
  constructor() {
    super({
      name: NAME,
      description: DESCRIPTION,
      shortName: SHORT_NAME,
      canBeCarried: true,
    })
  }

  /** Give a trowel saved as the rusty hoe its new name and short name. */
  override refreshSavedText(_gameState: GameState): void {
    this.name = NAME
    this.shortName = SHORT_NAME
  }

  /** The look in the current words, whatever a save from the hoe days kept. */
  override descriptionFor(_gameState: GameState): string {
    return DESCRIPTION
  }

  /** Dig the field to find its one coin, otherwise fail. */
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
        '[failure]You dig the soil again with the [item_name]trowel[/item_name], but it ' +
        "seems you've already found what was hidden here.[/failure]"
      )
    }
    return clue(
      "You dig at the ground with the [item_name]rusty trowel[/item_name], but it doesn't seem to " +
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

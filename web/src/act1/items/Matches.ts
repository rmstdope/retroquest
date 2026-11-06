import {
  Item,
  type GameState,
  characterName,
  nameInSentence,
  speech,
} from '@/engine'
import { Candle } from './Candle'
import { Shopkeeper } from '../characters/Shopkeeper'

/** Basic ignition source enabling illumination and ritual flavor actions. */
export class Matches extends Item {
  constructor() {
    super({
      name: 'matches',
      description:
        'A small box of matches. Useful for lighting fires, candles, or lanterns.',
    })
  }

  /**
   * Hemlock prevents taking the store's matches, which are kept for the
   * priest. While the store is shut and the priest has sent Elior for them,
   * he gives his word on the errand instead.
   */
  override preventPickup(gameState: GameState): string {
    if (!this.canBeCarried) {
      const errand = gameState.currentRoom.characters
        .find((character) => character instanceof Shopkeeper)
        ?.priestErrandWhileShut(gameState)
      return (
        nameInSentence('character', 'Hemlock', { atStart: true }) +
        ' quickly steps over. ' +
        (errand ??
          speech(
            'Hold on there, friend! Those ' +
              `[item_name]${this.name}[/item_name] are set aside for the ${characterName('priest')}. ` +
              'He gets them on the house whenever he asks.',
          ))
      )
    }
    return ''
  }

  /** Delegate to Candle's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Candle) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The box rattles, nearly full. ' + 'You keep it away from anything damp.'
    )
  }
}

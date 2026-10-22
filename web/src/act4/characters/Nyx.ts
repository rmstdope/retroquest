import { Character, type GameState, type Item, event } from '@/engine'
import { NyxToken } from '../items/NyxToken'
import { ForestHeartCrystal } from '../items/ForestHeartCrystal'

/**
 * Nyx, the small light in the hedge of Willowbrook Field. She cannot speak
 * here, but she takes back the two gifts she gave in the Heart of the Forest
 * if Elior offers them; each is remembered so the hedge can be looked at
 * afterwards.
 */
export class Nyx extends Character {
  /** Whether her token has been given back. */
  tokenReturned = false
  /** Whether the Forest Heart Crystal has been set in the hedge. */
  crystalReturned = false

  constructor() {
    super({
      name: 'Nyx',
      description: 'A small light that flickers in the hedge, keeping close.',
    })
  }

  /** Nyx cannot speak; the light answers with a touch. */
  override talkTo(_gameState: GameState): string {
    return (
      'The little light brushes your cheek, warm, and settles back into ' +
      'the hedge.'
    )
  }

  /** Her gifts she takes back, each once; anything else the light leaves in your hand. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof NyxToken) {
      this.tokenReturned = true
      gameState.removeItemFromInventory(item.name, 1)
      return event(
        'You hold out the pendant. The light comes down to it and the two ' +
          'of them are gone into the hedge together; a moment later the ' +
          'light is back, a little steadier, and your hand is empty.',
      )
    }
    if (item instanceof ForestHeartCrystal) {
      this.crystalReturned = true
      gameState.removeItemFromInventory(item.name, 1)
      return event(
        'You set the crystal in the hedge, down among the roots. The tiny ' +
          'lights inside it go out one by one, and the small light above ' +
          'them grows by exactly that much. The hedge sounds, very faintly, ' +
          'of wind in leaves.',
      )
    }
    return event(
      `You hold out the [item_name]${item.name}[/item_name]. The light ` +
        'brushes it once and leaves it in your hand. It is yours.',
    )
  }

  /** The light, and what has been given back to it. */
  override examine(gameState: GameState): string {
    const back: string[] = []
    if (this.tokenReturned) back.push('her pendant')
    if (this.crystalReturned) back.push('the crystal with the forest in it')
    if (back.length === 0) return super.examine(gameState)
    const where =
      back.length > 1 ? 'are where they belong' : 'is where it belongs'
    return (
      super.examine(gameState) +
      `\nSomewhere in the hedge, ${back.join(' and ')} ${where} now.`
    )
  }
}

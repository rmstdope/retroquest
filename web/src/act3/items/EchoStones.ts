import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_OATH_OF_STILLNESS_STARTED } from '../Act3StoryFlags'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { StillwaterPhial } from './StillwaterPhial'

/** Sacred stones that amplify the resonant chant when blessed. */
export class EchoStones extends Item {
  private blessed = false

  constructor() {
    super({
      name: 'echo stones',
      description:
        'Three weathered stones arranged in a triangle, each one carved ' +
        'with spiraling channels that catch and hold whispered words.',
      canBeCarried: false,
      shortName: 'stones',
    })
  }

  /** Examine the echo stones and start the Oath of Stillness quest. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED, true)
    return super.examine(gameState)
  }

  /** Handle a spell cast on the echo stones: `spellId` is matched, `spellName` is shown. */
  receiveSpell(
    gameState: GameState,
    spellId: string,
    spellName: string = spellId,
  ): string {
    if (spellId === 'bless' && !this.blessed) {
      this.blessed = true
      gameState.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED, true)
      return (
        'As the blessing leaves your lips, the echo stones hum, and you ' +
        'feel it in your bones. Silver light runs along their carved ' +
        'channels like water finding its course. Then the light settles ' +
        'into a slow, steady glow.' +
        '\n' +
        '[success]You sense that these hallowed stones now await ' +
        'the ancient chant that will complete the ritual and banish the ' +
        'restless spirits from this sacred place.[/success]'
      )
    } else if (spellId === 'bless' && this.blessed) {
      return '[dim]The echo stones are already blessed.[/dim]'
    } else {
      return `[failure]The ${spellName} spell has no effect on the echo stones.[/failure]`
    }
  }

  /** Check if the echo stones have been blessed. */
  areBlessed(): boolean {
    return this.blessed
  }

  /** Handle using other items with the echo stones. */
  override useWith(gameState: GameState, other: Item): string {
    if (
      other instanceof ResonantChantRubbings ||
      other instanceof StillwaterPhial
    ) {
      // Delegate to the other item's useWith method
      return other.useWith(gameState, this)
    } else {
      return super.useWith(gameState, other)
    }
  }
}

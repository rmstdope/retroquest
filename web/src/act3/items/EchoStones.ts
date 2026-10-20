import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_OATH_OF_STILLNESS_STARTED } from '../Act3StoryFlags'
import { ResonantChantRubbings } from './ResonantChantRubbings'

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

  /** Handle bless spell cast on the echo stones. */
  receiveSpell(gameState: GameState, spellName: string): string {
    if (spellName === 'bless' && !this.blessed) {
      this.blessed = true
      gameState.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED, true)
      return (
        '[event]As the blessing flows from your lips, the echo stones awaken ' +
        'with a resonance that vibrates through your very bones. Tendrils of ' +
        'silver-white radiance spiral up from their carved channels, each groove ' +
        'igniting like liquid starlight flowing through ancient runes. The air ' +
        'itself seems to crystallize around the stones, forming prismatic veils ' +
        'that shimmer with otherworldly harmonics. A low, ethereal hum fills ' +
        'the chamber as the stones synchronize their energies, their surfaces ' +
        'now pulsing with a gentle, sacred luminescence that casts dancing ' +
        'shadows on the obsidian pools. The mystical conduits glow with ' +
        'patient anticipation, ready to weave spoken words into the very ' +
        'fabric of reality. [/event]\n' +
        '[success]You sense that these hallowed stones now await ' +
        'the ancient chant that will complete the ritual and banish the ' +
        'restless spirits from this sacred place.[/success]'
      )
    } else if (spellName === 'bless' && this.blessed) {
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
    if (other instanceof ResonantChantRubbings) {
      // Delegate to the ResonantChantRubbings' useWith method
      return other.useWith(gameState, this)
    } else {
      return super.useWith(gameState, other)
    }
  }
}

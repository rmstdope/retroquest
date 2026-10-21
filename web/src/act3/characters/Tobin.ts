import { Character, type GameState, event } from '@/engine'

/** Names the player may use for Tobin. */
const TOBIN_NAMES: readonly string[] = ['tobin', 'young miner', 'boy']

/**
 * The young miner who shouted for help until his voice went and has not
 * spoken since. He only ever answers with narrated silence.
 */
export class Tobin extends Character {
  /** How many times the player has talked to him. */
  talks = 0

  constructor() {
    super({
      name: 'tobin',
      description:
        'A boy of perhaps fifteen sits apart from the others on an upturned ' +
        'bucket, knees drawn up, a cracked lamp in his lap. His throat is ' +
        'wrapped in a strip of torn shirt. He watches the ceiling, not you.',
    })
  }

  /** He answers to "tobin", "young miner" and "boy", however cased. */
  override answersTo(name: string): boolean {
    return TOBIN_NAMES.includes(name.trim().toLowerCase())
  }

  /** Narrate his silence: one line each for the first and second talk, a third forever after. */
  override talkTo(_gameState: GameState): string {
    this.talks += 1
    if (this.talks === 1) {
      return event(
        'Tobin looks at you for a long moment. His lips part, then close ' +
          'again. He turns the cracked lamp over in his hands and goes back ' +
          'to watching the ceiling.',
      )
    }
    if (this.talks === 2) {
      return event(
        'Tobin swallows, and you see what it costs him. No sound comes. ' +
          'He shakes his head, once.',
      )
    }
    return event(
      "Tobin does not look up. His thumb traces the crack in the lamp's " +
        'glass, back and forth.',
    )
  }
}

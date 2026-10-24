import { Character, type GameState, characterName } from '@/engine'
import { HiddenGlade } from '../rooms/HiddenGlade'

/**
 * Deer NPC representing a graceful creature of the Hidden Glade. It never
 * speaks; talking to it or looking at it gives a wordless moment that turns
 * Elior's eyes to the mossy stone until its runes have been lit.
 */
export class Deer extends Character {
  constructor() {
    super({
      name: 'deer',
      description:
        `A graceful ${characterName('deer')} with wise, gentle eyes. ` +
        'It seems to sense the ' +
        'magic of the glade and watches you with curiosity.',
    })
  }

  /** The deer does not answer in words; it shares a wordless moment. */
  override talkTo(gameState: GameState): string {
    return (
      `The ${characterName(this.name)} does not answer, not in words. ` +
      this.wordlessMoment(gameState)
    )
  }

  /** Looking at the deer also catches its gaze and the moment it shares. */
  override examine(gameState: GameState): string {
    return super.examine(gameState) + '\n' + this.wordlessMoment(gameState)
  }

  /**
   * Before the glade is lit its gaze drifts to the mossy stone, then to
   * Elior; afterwards it bows its head to him beside the glowing stone.
   */
  private wordlessMoment(gameState: GameState): string {
    const room = gameState.currentRoom
    if (room instanceof HiddenGlade && room.lightSpellCast) {
      return (
        'It lifts its head toward the glowing stone, then dips it to you, ' +
        'slow and deliberate, as if in thanks. For a heartbeat the whole ' +
        'glade seems to breathe with it.'
      )
    }
    return (
      'Its dark eyes hold yours for a long moment. Then its gaze drifts to ' +
      'the mossy stone and the shadowed runes upon it... then to you, ' +
      'patient, as if waiting for you to bring something to light.'
    )
  }
}

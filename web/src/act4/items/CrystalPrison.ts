import { Item, type GameState, event } from '@/engine'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
} from '../Act4StoryFlags'
import { endingPlayed } from '../endings'
import { THRONE_CHAMBER_SHATTERED } from '../rooms/throneDescriptions'

/** The prison's look once it is broken. */
const PRISON_SHATTERED = 'The crystal lies in shards around the ritual circle.'

/**
 * The crystal that holds King Alden. The Lifelight Elixir breaks it once;
 * afterwards only shards remain.
 */
export class CrystalPrison extends Item {
  constructor() {
    super({
      name: 'Prison',
      description:
        'The crystal is clouded and cold. Inside it King Alden sleeps ' +
        'without breathing, his crown dark. A thread of light runs from ' +
        'his crown into the wound.',
      canBeCarried: false,
    })
  }

  /** Also answers to "crystal" and "crystal prison". */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['crystal', 'crystal prison'].includes(name.toLowerCase())
    )
  }

  /** The prison's look, which changes once it is broken. */
  override examine(gameState: GameState): string {
    if (
      endingPlayed(gameState) ||
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
    ) {
      return event(PRISON_SHATTERED)
    }
    return event(this.description)
  }

  /** The elixir breaks the crystal: the king falls free and the elixir is gone. */
  breakWith(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    gameState.setStoryFlag(FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED, true)
    gameState.removeItemFromInventoryOrRoom('Lifelight Elixir', 1)
    gameState.currentRoom.description = THRONE_CHAMBER_SHATTERED
    return [
      event(
        'You pour the elixir over the crystal. It cracks like ice in ' +
          'spring, and King Alden falls free, gasping, alive. But the wound ' +
          'still stands open, and Malakar still stands beside it.',
      ),
      event('The Lifelight Elixir is gone.'),
    ].join('\n')
  }
}

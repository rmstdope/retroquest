import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { DreamVoice } from '../characters/DreamVoice'
import { Scenery } from '../items/Scenery'

const DESCRIPTION =
  'It is raining hard on a village street. Thunder breaks so close ' +
  'that the shutters shake with it. Shadows drift through the rain ' +
  'like smoke. In the street a man in a hooded cloak holds a child ' +
  'against his shoulder. His hood hides his face. ' +
  'Somewhere a slow tune climbs three notes and settles home again. ' +
  'Behind him a tall figure stands among the shadows. It has no face ' +
  'you can find. It is too far away to reach, and too close to be ' +
  'only a dream. It is whispering, at the very edge of hearing, and ' +
  'what it whispers is your name.'

/**
 * The Dream: where the game opens. One room, a rainy village street with a
 * storm in it, the cradle tune, a hooded man holding a child, and a tall
 * figure whispering Elior's name. The shadows, the man and the child can be examined, but
 * nothing can be carried out of it and no way leads anywhere;
 * answering the voice (talking to it, or saying anything to it) ends it,
 * and Elior wakes in his cottage. Asking for a hint here points at the
 * voice, since no quest is open yet.
 */
export class TheDream extends Room {
  constructor() {
    super({
      name: 'The Dream',
      description: DESCRIPTION,
      items: Scenery.forRoom('TheDream'),
      characters: [new DreamVoice()],
      exits: {},
    })
  }

  /** The dream in the current words, whatever an older save kept. */
  override descriptionFor(_gameState: GameState): string {
    return DESCRIPTION
  }

  /** A dream has no ways out of it. */
  override getExits(_gameState: GameState): Exits {
    return {}
  }

  /** Every direction is the same street, and the whisper again. */
  override blockedExit(_gameState: GameState, _direction: string): string {
    return (
      'You go that way, and it is the same street, the same rain, the same ' +
      'tune. There is no way out of this. There is only the voice, and it ' +
      'says your name.'
    )
  }

  /** Nothing to find; a dream has no end to its street. */
  override search(_gameState: GameState): string {
    return (
      'Your hands find nothing. The street has no end and the dream no ' +
      'edges. The whisper comes again, nearer, and it is your name.'
    )
  }

  /** He is asleep already. */
  override rest(_gameState: GameState): string {
    return 'You are asleep already. The voice says your name again, nearer.'
  }

  /** No quest is open yet; what presses on him is the voice, unanswered. */
  override hint(_gameState: GameState): string {
    return (
      'You think it over. The voice keeps saying your name, nearer ' +
      'each time, as if it is waiting for you to answer it.'
    )
  }

  /** Any other name spoken into the dark is answered by the one voice. */
  override talkToNobody(_gameState: GameState, _target: string): string {
    return 'Nothing here answers to that. The voice says your name.'
  }
}

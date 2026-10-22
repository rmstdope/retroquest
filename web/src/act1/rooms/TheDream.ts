import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { DreamVoice } from '../characters/DreamVoice'

/**
 * The Dream: where the game opens. One dark room with a storm in it, the
 * cradle tune, a man's hand lifting a child, and a tall figure whispering
 * Elior's name. Nothing can be carried out of it and no way leads anywhere;
 * answering the voice (talking to it, or saying anything to it) ends it,
 * and Elior wakes in his cottage.
 */
export class TheDream extends Room {
  constructor() {
    super({
      name: 'The Dream',
      description:
        'Dark, and a storm in it. Rain drives against shutters you cannot ' +
        'see, and the thunder comes so close that the dark itself shakes. ' +
        'Shadows move through it the way smoke moves. A hand, a man’s ' +
        'hand, lifts a child out of the dark and holds it against a ' +
        'shoulder, and then the dark has them both. Somewhere a slow tune ' +
        'climbs three notes and settles home again. Among the shadows a ' +
        'figure stands, tall and without a face, too far to reach and too ' +
        'near to be anything but real. Its whisper is at the edge of ' +
        'hearing, and it is your name.',
      items: [],
      characters: [new DreamVoice()],
      exits: {},
    })
  }

  /** A dream has no ways out of it. */
  override getExits(_gameState: GameState): Exits {
    return {}
  }

  /** Every direction is the same dark, and the whisper again. */
  override blockedExit(_gameState: GameState, _direction: string): string {
    return (
      'You go that way, and it is the same dark, the same rain, the same ' +
      'tune. There is no door in this. There is only the voice, and it ' +
      'says your name.'
    )
  }

  /** What the storm leaves to hear: the tune, and under it the name. */
  override getAmbientSound(_gameState: GameState): string {
    return (
      'The rain, and the thunder under it. Under the thunder, the tune: ' +
      'three notes climbing, and settling home. You know it, and could ' +
      'not say from where. Under the tune, a whisper, and the whisper is ' +
      'your name.'
    )
  }

  /** Nothing to find; a dream has no floor. */
  override search(_gameState: GameState): string {
    return (
      'Your hands find nothing. The dark has no floor and the dream no ' +
      'edges. The whisper comes again, nearer, and it is your name.'
    )
  }

  /** He is asleep already. */
  override rest(_gameState: GameState): string {
    return 'You are asleep already. The voice says your name again, nearer.'
  }

  /** Any other name spoken into the dark is answered by the one voice. */
  override talkToNobody(_gameState: GameState, _target: string): string {
    return 'Nothing here answers to that. The voice says your name.'
  }
}

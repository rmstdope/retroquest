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
        'It is dark, and it is raining hard. You hear it beating on ' +
        'shutters, though you cannot see any. Thunder breaks so close ' +
        'that the dark shakes with it. Shadows drift past like smoke. ' +
        'A man’s hand reaches out of the dark, lifts a child and holds ' +
        'it against his shoulder, and then both of them are gone. ' +
        'Somewhere a slow tune climbs three notes and settles home again. ' +
        'A tall figure stands among the shadows. It has no face you can ' +
        'find. It is too far away to reach, and too close to be only a dream. ' +
        'It is whispering, at the very edge of hearing, and what it ' +
        'whispers is your name.',
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

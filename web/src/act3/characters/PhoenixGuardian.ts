import {
  Character,
  type GameState,
  characterName,
  speech,
  type NameOptions,
} from '@/engine'
import { CEDRIC_PATIENCE, cedricAdds } from '../CedricLines'
import {
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
  FLAG_ACT3_FUMAROLE_WARD_APPLIED,
} from '../Act3StoryFlags'

/** The vent stones that bring the vents into harmony. */
const VENT_STONES_NEEDED = 3

/** How many vent stones are set in the room, read structurally (0 elsewhere). */
function ventCalibrations(gameState: GameState): number {
  const room = gameState.allRooms.FumarolePassages
  return room &&
    'ventCalibrations' in room &&
    typeof room.ventCalibrations === 'number'
    ? room.ventCalibrations
    : 0
}

/** A masked figure who counts the vents' breath and watches the passage to the crater. */
export class PhoenixGuardian extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'phoenix guardian',
      description:
        'A tall, masked figure in fire-etched robes stands by the vents, staff in hand. ' +
        'His head is turned to the vents, and his lips move as if he is counting.',
    })
  }

  /**
   * Give hints before the vents are in harmony, once they are but the ward is
   * not set, while the breath must be counted, and after the first crossing.
   */
  override talkTo(gameState: GameState): string {
    const crossed = gameState.getStoryFlag(
      FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
    )
    if (!crossed && gameState.getStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED)) {
      return (
        'The ' +
        characterName('Phoenix Guardian') +
        ' watches the vents. ' +
        speech(
          'The ward holds, but the mountain still breathes. Count its breath. ' +
            'Walk when it draws in.',
        )
      )
    }
    if (!crossed && ventCalibrations(gameState) >= VENT_STONES_NEEDED) {
      return (
        'The ' +
        characterName('Phoenix Guardian') +
        ' listens to the vents. ' +
        speech(
          'They breathe as one now. Bind the heat with a ward, and they ' +
            'will hold.',
        )
      )
    }
    if (!crossed) {
      return (
        'The ' +
        characterName('Phoenix Guardian') +
        ' studies you for a ' +
        'moment. ' +
        speech(
          'You have come for the Phoenix. Then you must be both patient and ' +
            'watchful. The vents breathe wild here, and the heat will turn ' +
            'you back. First bring the vents into harmony, so they breathe ' +
            'as one. Then bind the heat with a ward; the gallery below the ' +
            'terraces has what a ward is made of. When the rhythm is steady ' +
            'and the ward is set, the way to the crater opens.',
        )
      )
    }
    return (
      'The ' +
      characterName('Phoenix Guardian') +
      ' nods: ' +
      speech(
        'The way is open, but patience is your ally. The Phoenix will not ' +
          'appear for those who rush. Sit in the crater a while, and let it ' +
          'come to you.',
      ) +
      cedricAdds(gameState, CEDRIC_PATIENCE)
    )
  }
}

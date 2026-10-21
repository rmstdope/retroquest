import { Character, type GameState, characterName, speech } from '@/engine'
import { CEDRIC_PATIENCE, cedricAdds } from '../CedricLines'
import { FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED } from '../Act3StoryFlags'

/** A silent, vigilant figure who tends the vents and watches the passage to the crater. */
export class PhoenixGuardian extends Character {
  constructor() {
    super({
      name: 'phoenix guardian',
      description:
        'A tall, masked figure in fire-etched robes stands by the vents, staff in hand. ' +
        "His eyes glint with emberlight, and he seems to listen to the mountain's breath.",
    })
  }

  /** Give hints before and after the south exit is unlocked. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)) {
      return (
        'The ' +
        characterName('Phoenix Guardian') +
        ' studies you for a ' +
        'moment. ' +
        speech(
          'So, you seek the mighty one? To stand before the Phoenix, you must be ' +
            'both patient and watchful. The mountain tests those who would pass: its breath is ' +
            'wild, its heat unforgiving. First, bring the vents into harmony—let them ' +
            'breathe as one. Only then can you bind the heat with a ward. When the rhythm ' +
            'is steady and the ward is set, the way to the crater will open.',
        )
      )
    }
    return (
      'The ' +
      characterName('Phoenix Guardian') +
      ' nods: ' +
      speech(
        'The way is open, but patience is your ally. The Phoenix will not ' +
          'appear for those who rush. Be patient, and the mighty one will reveal ' +
          'itself.',
      ) +
      cedricAdds(gameState, CEDRIC_PATIENCE)
    )
  }
}

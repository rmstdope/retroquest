import { Character, type GameState } from '@/engine'
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
        'The [character_name]Phoenix Guardian[/character_name] studies you for a ' +
        'moment. ' +
        '[dialogue]So, you seek the mighty one? To stand before the Phoenix, you must be ' +
        'both brave and bold. The mountain tests those who would pass: its breath is ' +
        'wild, its heat unforgiving. First, bring the vents into harmony—let them ' +
        'breathe as one. Only then can you bind the heat with a ward. When the rhythm ' +
        'is steady and the ward is set, the way to the crater will open.[/dialogue]'
      )
    }
    return (
      'The [character_name]Phoenix Guardian[/character_name] nods: ' +
      '[dialogue]The way is open, but patience is your ally. The Phoenix will not ' +
      'appear for those who rush. Be patient, and the mighty one will reveal ' +
      'itself.[/dialogue]'
    )
  }
}

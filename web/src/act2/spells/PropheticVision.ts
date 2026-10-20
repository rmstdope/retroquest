import { Spell, type GameState, event } from '@/engine'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { SirCedric } from '../characters/SirCedric'

/**
 * Ultimate divination spell concluding Act II foresight quest progression.
 * The first cast with Sir Cedric present completes the Gathering Storm quest
 * and delivers an extended prophecy; later casts return a shorter variant.
 */
export class PropheticVision extends Spell {
  constructor() {
    super({
      name: 'prophetic_vision',
      description:
        'A powerful divination spell that allows the caster to glimpse possible futures ' +
        'and see the threads of fate.',
    })
  }

  /** Cast the prophetic vision; variant depends on Cedric presence and story flags. */
  override castSpell(gameState: GameState): string {
    // Check if Sir Cedric is present in the current room
    const cedricPresent = gameState.currentRoom.characters.some(
      (char) => char instanceof SirCedric,
    )
    if (!cedricPresent) {
      return (
        '[dim]As you begin to cast the prophetic vision spell, you sense that the ' +
        'visions would be most meaningful if shared with someone who can act upon the ' +
        'knowledge. You should use this spell together with Sir Cedric, who has the ' +
        'authority and wisdom to prepare for the threats that the visions reveal.[/dim]'
      )
    }

    if (!gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)) {
      // First casting - complete The Gathering Storm quest
      gameState.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
      return event(
        'You close your eyes and reach out with your newly granted sight ' +
          'beyond sight. With Sir Cedric standing beside you, you share the ' +
          'visions as they flood your mind like fragments of a shattered ' +
          'mirror, each reflecting a possible future:\n\nYou see shadows ' +
          'gathering in the north, darker than any natural darkness. Ancient ' +
          "evils stir in forgotten places, and you sense that Malakar's " +
          'interest in Willowbrook was only the beginning of a much larger ' +
          'design. The scattered threads of fate show you glimpses of trials ' +
          'yet to come - allies who will stand with you, enemies who will ' +
          'test your resolve, and choices that will shape the very fabric of ' +
          'the world.\n\nThe vision fades, but the knowledge remains. Sir ' +
          "Cedric's expression grows grave as he witnesses the prophetic " +
          'revelations. You understand now that your journey has only just ' +
          'begun, and the gathering storm spoken of by Sir Cedric is far ' +
          'greater than anyone imagined. Together, armed with this ' +
          'foresight, you are better prepared for whatever challenges lie ' +
          'ahead.',
      )
    }

    return event(
      'You cast the prophetic vision spell, and brief glimpses of ' +
        'possible futures dance before your eyes. The gift of foresight ' +
        'reminds you that every choice creates ripples through the ' +
        'tapestry of time, and wisdom lies in understanding the ' +
        'consequences of your actions.',
    )
  }
}

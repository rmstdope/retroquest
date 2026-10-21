import { Spell, type GameState, characterName, event } from '@/engine'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { SirCedric } from '../characters/SirCedric'

/**
 * Ultimate divination spell concluding Act II foresight quest progression.
 * The first cast with Sir Cedric present completes the Gathering Storm quest
 * and shows the vision of the village, the robed figure and the dream voice; later casts return a shorter variant.
 */
export class PropheticVision extends Spell {
  constructor() {
    super({
      id: 'prophetic_vision',
      name: 'prophetic vision',
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
      const sideQuests = [
        ...gameState.nonActivatedQuests,
        ...gameState.activatedQuests,
        ...gameState.completedQuests,
      ].filter((quest) => !quest.isMain())
      if (
        !sideQuests.every((quest) => gameState.isQuestCompleted(quest.name))
      ) {
        return (
          '[failure]Complete every side quest in Act II before sharing these ' +
          'visions with Sir Cedric.[/failure]'
        )
      }

      // First casting - complete The Gathering Storm quest
      gameState.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
      return event(
        'You close your eyes and reach out with your newly granted sight ' +
          'beyond sight. With ' +
          characterName('Sir Cedric') +
          ' standing beside you, you share the vision as it rises before ' +
          'you:\n\n' +
          'A village at dusk, its roofs low and familiar. Beyond it, a field ' +
          'withered to grey stalks, the way yours was the morning all this ' +
          "began. And at the field's edge, a robed figure, its face lost in " +
          'shadow, reaching one hand toward you as if across a great ' +
          'distance.\n\n' +
          'Then the voice from your dream, the one that called your name on ' +
          'the night of the storm: [italic]“Elior… how you have grown. Do ' +
          'not be afraid of me.”[/italic] It is closer than it was. You do ' +
          'not know whose it is, only that you have heard it before, long ' +
          'before the dream.\n\n' +
          'The vision fades. ' +
          characterName('Sir Cedric') +
          "'s expression has grown grave.",
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

import {
  Character,
  type GameState,
  characterName,
  speech,
  dialogue,
  type NameOptions,
} from '@/engine'
import {
  FLAG_SQUIRES_TALKED_TO,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Group NPC representing trainee knights offering rumors and quest leads.
 *
 * Only engages fully after FLAG_CEDRIKS_HONOR_ACCEPTED; the first qualifying
 * talk sets FLAG_SQUIRES_TALKED_TO.
 */
export class Squires extends Character {
  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'squires',
      description:
        'A dozen squires at drill in the yard, wooden swords knocking. ' +
        'Between passes they glance at Sir Cedric and whisper.',
    })
  }

  /**
   * Brush the player off until Cedric's honor quest is accepted, then share
   * rumors; once his name is cleared they celebrate his sword instead.
   */
  override talkTo(gameState: GameState): string {
    // Check if Cedric's Lost Honor quest has been accepted
    if (!gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED)) {
      // Squires are too busy to talk if quest hasn't been accepted
      return (
        'The squires keep their eyes on their drill. One of them answers ' +
        'without turning.\n\n' +
        dialogue(
          'Squires',
          "Can't stop. The Training Master's watching, and he counts.",
        )
      )
    }
    // Set flag that squires have been talked to (only if quest is accepted)
    gameState.setStoryFlag(FLAG_SQUIRES_TALKED_TO, true)
    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        'The squires have abandoned their drill and crowd together, grinning.\n\n' +
        dialogue(
          'Squires',
          'Did you see? They gave ' +
            characterName('Sir Cedric') +
            ' his sword back! He walked into the yard this morning with it ' +
            'at his hip, and the Training Master saluted him in front of ' +
            'everyone.',
        ) +
        '\n\nOne squire looks at you shyly.\n\n' +
        speech('He said it was you who found the papers. Thank you.')
      )
    }
    return (
      'The young squires lower their voices and glance around nervously.\n\n' +
      dialogue(
        'Squires',
        "We're not supposed to talk about it, but we've heard the older " +
          "knights whispering about Sir Cedric's disgrace. They say he left the " +
          "king's wall the night His Majesty vanished, and that whoever took the " +
          'king walked in through the gap.',
      ) +
      '\n\nOne squire looks particularly troubled.\n\n' +
      speech(
        "But it doesn't make sense. Sir Cedric made us stand a post in the " +
          'rain till our boots filled. He would never leave one.',
      ) +
      '\n\nAnother squire nods.\n\n' +
      speech(
        "A squire before us kept a diary that week. It's under the stone benches. " +
          "Read it; it says what we can't.",
      )
    )
  }
}

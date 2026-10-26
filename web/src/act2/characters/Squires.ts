import {
  Character,
  type GameState,
  characterName,
  speech,
  dialogue,
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
  constructor() {
    super({
      name: 'squires',
      description:
        'Young men and women training to become knights under the guidance of the ' +
        'Training Master and Sir Cedric. They practice sword work and horsemanship with ' +
        'determination, though they occasionally pause to whisper among themselves about ' +
        "castle affairs and their mentors' reputations.",
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
        'The squires are deeply focused on their training exercises, ' +
        'practicing sword forms and footwork with intense concentration. ' +
        'They seem too busy and focused to engage in conversation right ' +
        'now.\n\n' +
        dialogue(
          'Squires',
          "Sorry, we can't talk - the Training Master expects us to " +
            'perfect these techniques before the day is over.',
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
        "But it doesn't make sense — Sir Cedric has always taught us about " +
          'honor and duty. He would never leave his post.',
      ) +
      '\n\nAnother squire nods.\n\n' +
      speech(
        'We found a diary under the stone benches that tells a different ' +
          'story. Maybe you should take a look at it.',
      )
    )
  }
}

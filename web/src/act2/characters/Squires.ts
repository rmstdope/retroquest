import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_SQUIRES_TALKED_TO,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
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

  /** Brush the player off until Cedric's honor quest is accepted, then share rumors. */
  override talkTo(gameState: GameState): string {
    // Check if Cedric's Lost Honor quest has been accepted
    if (!gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED)) {
      // Squires are too busy to talk if quest hasn't been accepted
      return (
        'The squires are deeply focused on their training exercises, ' +
        'practicing sword forms and footwork with intense concentration. ' +
        'They seem too busy and focused to engage in conversation right ' +
        'now.\n\n' +
        characterName('Squires') +
        ': ' +
        speech(
          "Sorry, we can't talk - the Training Master expects us to " +
            'perfect these techniques before the day is over.',
        )
      )
    }
    // Set flag that squires have been talked to (only if quest is accepted)
    gameState.setStoryFlag(FLAG_SQUIRES_TALKED_TO, true)
    return (
      'The young squires lower their voices and glance around nervously.\n\n' +
      characterName('Squires') +
      ': ' +
      speech(
        "We're not supposed to talk about it, but we've heard " +
          "the older knights whispering about Sir Cedric's disgrace. They " +
          'say he abandoned his post during a crucial battle and that ' +
          'soldiers died because of his cowardice.',
      ) +
      '\n\nOne squire looks particularly troubled.\n\n' +
      speech(
        "But it doesn't make sense - Sir Cedric " +
          'has always taught us about honor and duty. He would never abandon ' +
          'his men.',
      ) +
      '\n\nAnother squire nods.\n\n' +
      speech(
        'We found an old diary under the ' +
          'stone benches that tells a different story. Maybe you should take ' +
          'a look at it.',
      )
    )
  }
}

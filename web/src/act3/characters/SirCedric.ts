import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
} from '../Act3StoryFlags'

/** A steadfast knight who aids the player in their quest against Malakar. */
export class SirCedric extends Character {
  constructor() {
    super({
      name: 'sir cedric',
      description:
        'Armor tempered, eyes steady—Cedric stands ready for the trials. ' +
        'His presence is a quiet promise.',
    })
  }

  /**
   * Return appropriate dialogue based on quest progress and location.
   *
   * The response varies depending on whether the main quest has started,
   * which site the party currently occupies, and whether the Crystal of
   * Light has been won (which is only possible after the Vow of Courage).
   */
  override talkTo(gameState: GameState): string {
    // If the main quest hasn't started, direct the player to Mira.
    if (!gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)) {
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          "If we're to take " +
            'the fight to Malakar, speak with ' +
            characterName('Mira') +
            '. ' +
            'She understands the rites and the way to begin.',
        )
      )
    }

    // Main quest active: tailor replies to location and state.
    const roomName = gameState.currentRoom.name

    // Tidal Causeway: advice before the Crystal is won, encouragement after.
    // The Crystal can only be taken once the vow is made, so winning it
    // means the vow has been spoken.
    if (roomName === 'Tidal Causeway') {
      if (!gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
        return (
          characterName('Sir Cedric') +
          ': ' +
          speech(
            'The tide ' +
              'tests the brave. Stand strong with Mira—speak your vow before the ' +
              'guardian and let courage steady your hand.',
          )
        )
      }
      return (
        characterName('Sir Cedric') +
        ': ' +
        speech(
          'Your vow has ' +
            'been spoken. Let us press onward—Mira will open the circle when you ' +
            'are prepared.',
        )
      )
    }

    // Default reply when the main quest is active
    return (
      characterName('Sir Cedric') +
      ': ' +
      speech(
        'The path is set. ' +
          'Courage, Wisdom, Selflessness—name them with your deeds, and we ' +
          'will see this through.',
      )
    )
  }
}

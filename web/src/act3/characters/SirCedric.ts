import { Character, type GameState } from '@/engine'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
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
   * which site the party currently occupies, and whether key flags like
   * the Crystal acquisition and the Vow of Courage have been set.
   */
  override talkTo(gameState: GameState): string {
    // If the main quest hasn't started, direct the player to Mira.
    if (!gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)) {
      return (
        "[character_name]Sir Cedric[/character_name]: [dialogue]If we're to take " +
        'the fight to Malakar, speak with [character_name]Mira[/character_name]. ' +
        'She understands the rites and the way to begin.[/dialogue]'
      )
    }

    // Main quest active: tailor replies to location and state.
    const roomName = gameState.currentRoom.name

    // Tidal Causeway: advice about the Crystal and the vow
    if (roomName === 'Tidal Causeway') {
      if (!gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
        return (
          '[character_name]Sir Cedric[/character_name]: [dialogue]The tide ' +
          'tests the brave. Stand strong with Mira—speak your vow before the ' +
          'guardian and let courage steady your hand.[/dialogue]'
        )
      }
      if (!gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)) {
        return (
          '[character_name]Sir Cedric[/character_name]: [dialogue]The Crystal ' +
          'is ours. When you are ready, make your vow to bind its power; ' +
          'I will stand with you.[/dialogue]'
        )
      }
      return (
        '[character_name]Sir Cedric[/character_name]: [dialogue]Your vow has ' +
        'been spoken. Let us press onward—Mira will open the circle when you ' +
        'are prepared.[/dialogue]'
      )
    }

    // Default reply when the main quest is active
    return (
      '[character_name]Sir Cedric[/character_name]: [dialogue]The path is set. ' +
      'Courage, Wisdom, Selflessness—name them with your deeds, and we ' +
      'will see this through.[/dialogue]'
    )
  }
}

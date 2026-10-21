import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { CEDRIC_NAME, cedricAdds, cedricSays } from '../CedricLines'
import { FLAG_ACT3_VOW_OF_COURAGE_MADE } from '../Act3StoryFlags'

/** The Tide-Born Guardian: a figure of gathered waters and ward-sigils. */
export class TideBornGuardian extends Character {
  constructor() {
    super({
      name: 'Tide-Born Guardian',
      description:
        'A figure of gathered waters and ward-sigils, its form rippling ' +
        "with the tide's breath.",
    })
  }

  /** Return dialogue asking for vow when talking to the guardian. */
  override talkTo(_gameState: GameState): string {
    return (
      'The ' +
      characterName(this.name) +
      "'s voice is the hush " +
      'of a turning tide: ' +
      speech("'Name what you will not abandon.'")
    )
  }

  /** The Guardian turns to Sir Cedric, who answers; the water does not. */
  private turnsToCedric(): string {
    return (
      event(
        `The ${characterName(this.name)} turns its rippling face to ` +
          `${characterName(CEDRIC_NAME)}.`,
      ) +
      ' ' +
      speech("'Name what you will not abandon.'") +
      '\n' +
      cedricSays('My king.') +
      ' ' +
      event('A breath.') +
      ' ' +
      speech("'I did once.'") +
      '\n' +
      event('The water does not answer him.')
    )
  }

  /** Handle the vow of courage when saying specific words to the guardian. */
  override sayTo(gameState: GameState, words: string): string {
    const w = words.trim().toLowerCase()
    if (w === 'myself') {
      const firstVow = !gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)
      gameState.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
      return (
        '[success]The waters draw back as if breathing in. Your vow anchors ' +
        "the chamber's heart, and the relic heeds your courage. You may now " +
        'take the [item_name]Crystal of Light[/item_name].[/success]' +
        (firstVow ? cedricAdds(gameState, this.turnsToCedric()) : '')
      )
    }
    return (
      'The tide listens, then falls quiet. That is not the vow the ' +
      characterName(this.name) +
      ' will bind to.'
    )
  }
}

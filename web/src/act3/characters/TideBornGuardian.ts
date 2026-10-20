import { Character, type GameState } from '@/engine'
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
      `The [character_name]${this.name}[/character_name]'s voice is the hush ` +
      "of a turning tide: [dialogue]'Name what you will not abandon.'[/dialogue]"
    )
  }

  /** Handle the vow of courage when saying specific words to the guardian. */
  override sayTo(gameState: GameState, words: string): string {
    const w = words.trim().toLowerCase()
    if (w === 'myself') {
      gameState.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
      return (
        '[success]The waters draw back as if breathing in. Your vow anchors ' +
        "the chamber's heart, and the relic heeds your courage. You may now " +
        'take the [item_name]Crystal of Light[/item_name].[/success]'
      )
    }
    return (
      'The tide listens, then falls quiet. That is not the vow the ' +
      `[character_name]${this.name}[/character_name] will bind to.`
    )
  }
}

import { Quest, type GameState } from '@/engine'
import {
  FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED,
  FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Quest to solve the riddles posed by the forest guardians. Riddle interactions
 * elsewhere set the completion flag; `complete` prints the formatted completion
 * line on first completion.
 */
export class TheForestGuardiansRiddles extends Quest {
  experienceReward = 200

  constructor() {
    super({
      name: "The Forest Guardian's Riddles",
      description:
        'The forest sprites have challenged you to prove your wisdom by solving the ' +
        'riddles of the forest guardians. You must journey to the Ancient Grove and ' +
        'beyond to the Whispering Glade, where ancient spirits will test ' +
        'your understanding of forest ways and natural wisdom.',
      completion:
        'You have successfully solved the riddles of the forest guardians, ' +
        'proving your wisdom and respect for the natural world. The ' +
        'forest spirits acknowledge your understanding.',
    })
  }

  /** Check if this quest should be activated. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED)
  }

  /** Check if the quest can be completed based on story flags. */
  override checkCompletion(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED) &&
      !this.completed
    )
  }

  /** Complete the quest and give rewards. */
  override complete(_gameState: GameState): string {
    if (!this.completed) {
      this.completed = true
      return `[success]Quest Complete: ${this.name}[/success]`
    }
    return this.completion
  }
}

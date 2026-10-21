import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_STARTED,
} from '../Act4StoryFlags'

/** Side quest: find the one true way through the Mirror Labyrinth. */
export class TheMazeOfMirrors extends Quest {
  constructor() {
    super({
      name: 'The Maze of Mirrors',
      description:
        'Countless mirrors show false paths and twisted reflections. Find the ' +
        'one true way through the labyrinth.',
      completion:
        "Guided by the servants' pendant and the hall's echoes, Elior walks the " +
        'one true path through the mirrors, and learns to see through illusion.',
    })
  }

  /** Start on first entering the Mirror Labyrinth. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)
    )
  }

  /** Complete when the maze is solved. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)
  }
}

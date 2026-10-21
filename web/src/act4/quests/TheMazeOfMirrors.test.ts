import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheMazeOfMirrors } from './TheMazeOfMirrors'
import {
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_STARTED,
} from '../Act4StoryFlags'

describe('TheMazeOfMirrors', () => {
  it('starts on entering the maze and completes when it is solved', () => {
    const game = new Game([new Act4()])
    const quest = new TheMazeOfMirrors()
    expect(quest.checkTrigger(game.state)).toBe(false)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.isMain()).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })
})

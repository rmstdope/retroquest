import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheParentsLegacy } from './TheParentsLegacy'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'

describe('TheParentsLegacy', () => {
  it('starts and completes with its flags', () => {
    const game = new Game([new Act4()])
    const quest = new TheParentsLegacy()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })

  it("loads a save made with the old name as The Parents' Legacy", () => {
    const game = new Game([new Act4()])
    const quest = new TheParentsLegacy()
    quest.name = "The Parent's Legacy"
    game.state.activatedQuests.push(quest)
    const result = game.loadSaveData(game.toSaveData())
    expect(result).toContain('Game loaded successfully.')
    expect(game.state.activatedQuests.map((q) => q.name)).toEqual([
      "The Parents' Legacy",
    ])
  })
})

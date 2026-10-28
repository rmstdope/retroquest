import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest'
import { GameState, Room } from '@/engine'
import { OathOfStillness } from './OathOfStillness'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_STARTED,
} from '../Act3StoryFlags'

describe('Oath of Stillness quest', () => {
  let quest: OathOfStillness
  let gameState: GameState
  let getStoryFlag: MockInstance<GameState['getStoryFlag']>

  beforeEach(() => {
    quest = new OathOfStillness()
    // The port of Mock(spec=GameState): a real state whose flag lookup is stubbed.
    gameState = new GameState(
      new Room({ name: 'Nowhere', description: '' }),
      {},
      [],
    )
    getStoryFlag = vi.spyOn(gameState, 'getStoryFlag')
  })

  it('is properly initialized', () => {
    expect(quest.name).toBe('Oath of Stillness')
    expect(quest.description).toContain('Stillness Vestibule')
    expect(quest.description).toContain('as they have for years')
    expect(quest.description).toContain('walls of the Echo Chambers')
    expect(quest.description).not.toContain('centuries')
    expect(quest.completion).toContain("the way to the dragon's hall lies open")
    expect(quest.completion).not.toMatch(/centuries|ethereal|motes/)
    expect(quest.isMain()).toBe(false)
  })

  it('triggers when the oath has started', () => {
    // Should not trigger without miners rescue completion
    getStoryFlag.mockReturnValue(false)
    expect(quest.checkTrigger(gameState)).toBe(false)

    // Should trigger when echo stones are examined
    getStoryFlag.mockReturnValue(true)
    expect(quest.checkTrigger(gameState)).toBe(true)
    expect(getStoryFlag).toHaveBeenLastCalledWith(
      FLAG_ACT3_OATH_OF_STILLNESS_STARTED,
    )
  })

  it('completes only with the oath completed flag', () => {
    // Should not be complete without the flag
    getStoryFlag.mockReturnValue(false)
    expect(quest.checkCompletion(gameState)).toBe(false)

    // Should be complete with the flag
    getStoryFlag.mockReturnValue(true)
    expect(quest.checkCompletion(gameState)).toBe(true)
    expect(getStoryFlag).toHaveBeenLastCalledWith(
      FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
    )
  })
})

import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'
import { CrystalOfLight } from './CrystalOfLight'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('CrystalOfLight', () => {
  it('gates the pickup by the required story flags', () => {
    const game = new Game([new Act3()])
    const crystal = new CrystalOfLight()

    const result = crystal.pickedUp(game.state).toLowerCase()
    expect(
      result.includes('cannot') ||
        result.includes('may') ||
        result.includes('complete the rites') ||
        result.includes('locking'),
    ).toBe(true)

    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    const resultOk = crystal.pickedUp(game.state).toLowerCase()
    expect(
      ['take', 'picked', 'steady', 'cold', 'hand'].some((k) =>
        resultOk.includes(k),
      ),
    ).toBe(true)
  })

  it('picking up after the vow uses only known, balanced tags', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)

    const answer = new CrystalOfLight().pickedUp(game.state)

    expect(answer).toContain('crystal is cold, and steady in your hand')
    expectMarkupWellFormed(answer)
  })
})

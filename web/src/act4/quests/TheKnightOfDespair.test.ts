import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheKnightOfDespair } from './TheKnightOfDespair'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'

describe('TheKnightOfDespair', () => {
  it('has the agreed card and completion text', () => {
    const quest = new TheKnightOfDespair()
    expect(quest.name).toBe('The Knight of Despair')
    expect(quest.description).toBe(
      'A knight in a grey cloak bars the stair to the Tower of Shadows, lost in a despair no blade can reach. Learn the truth of him, and find a way past.',
    )
    expect(quest.completion).toBe(
      'Elior sees the knight as he truly is and offers him redemption instead of a blade. The man who framed Sir Cedric confesses, and the stair to the Tower of Shadows lies open.',
    )
  })

  it('starts and completes with its flags', () => {
    const game = new Game([new Act4()])
    const quest = new TheKnightOfDespair()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
    expect(quest.checkCompletion(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TheKnightOfDespair } from './TheKnightOfDespair'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_CHAIN_GIVEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_GUARDIANS_CHAIN_RAISED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
  FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL,
} from '../Act4StoryFlags'

describe('TheKnightOfDespair', () => {
  it('has the agreed card and completion text', () => {
    const quest = new TheKnightOfDespair()
    expect(quest.name).toBe('The Knight of Despair')
    expect(quest.description).toBe(
      'A knight in a grey cloak stands before the stair to the Tower of Shadows and does not move. Learn the truth of him, and find a way past.',
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

  it('moves its hint on at each stage: a sight, all three, and the shield', () => {
    const game = new Game([new Act4()])
    game.state.storyFlags = {}
    const quest = new TheKnightOfDespair()
    const hintAfter = (flags: string[]): string | null => {
      for (const flag of flags) game.state.setStoryFlag(flag, true)
      quest.checkUpdate(game.state)
      return quest.hint(game.state)
    }
    const hints = [
      hintAfter([]),
      hintAfter([FLAG_ACT4_KNIGHT_SEEN_THROUGH]),
      hintAfter([FLAG_ACT4_BANNERS_SEEN, FLAG_ACT4_ECHO_STONE_HEARD]),
      hintAfter([FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL]),
    ]
    expect(new Set(hints).size).toBe(hints.length)
    expect(quest.description).toContain('[/dim]\n\n')
  })

  it('counts the chain as a shield only while it is still carried', () => {
    const game = new Game([new Act4()])
    game.state.storyFlags = {}
    const quest = new TheKnightOfDespair()
    for (const flag of [
      FLAG_ACT4_KNIGHT_SEEN_THROUGH,
      FLAG_ACT4_BANNERS_SEEN,
      FLAG_ACT4_ECHO_STONE_HEARD,
    ])
      game.state.setStoryFlag(flag, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    const unshielded = quest.hint(game.state)
    game.state.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.hint(game.state)).not.toBe(unshielded)
    game.state.setStoryFlag(FLAG_ACT4_CHAIN_GIVEN, true)
    quest.checkUpdate(game.state)
    expect(quest.hint(game.state)).toBe(unshielded)
  })
})

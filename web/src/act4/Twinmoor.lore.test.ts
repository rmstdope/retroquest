import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
} from './Act4StoryFlags'
import { KingAlden } from './characters/KingAlden'

const MOOR_SENTENCE =
  'South of the ridge the moor runs to the edge of sight. Its pools hold ' +
  'no moon tonight.'

const OATH_LINE =
  'Every king of Twinmoor swears to hold what the Wardens bind. In all ' +
  'those years, I was the first they asked to keep it. I would swear it ' +
  'again.'

describe('Twinmoor lore in Act IV', () => {
  it('shows the moor from the fortress gates, before and after the wall falls', () => {
    const game = new Game([new Act4()])
    const gates = game.state.allRooms.FortressGates
    expect(gates.descriptionFor(game.state)).toContain(MOOR_SENTENCE)
    game.state.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
    expect(gates.descriptionFor(game.state)).toContain(MOOR_SENTENCE)
  })

  for (const flag of [
    FLAG_ACT4_REDEMPTION_ENDING,
    FLAG_ACT4_JUSTICE_ENDING,
    FLAG_ACT4_SACRIFICE_ENDING,
  ]) {
    it(`has King Alden say the oath on the talk after his ending line (${flag})`, () => {
      const game = new Game([new Act4()])
      game.state.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
      game.state.setStoryFlag(flag, true)
      const king = new KingAlden()
      const ending = king.talkTo(game.state)
      expect(ending).not.toContain(OATH_LINE)
      expect(king.talkTo(game.state)).toContain(OATH_LINE)
      expect(king.talkTo(game.state)).toBe(ending)
      expect(king.talkTo(game.state)).not.toContain(OATH_LINE)
    })
  }

  it('does not say the oath before the ending or after a reload that kept it said', () => {
    const game = new Game([new Act4()])
    const king = new KingAlden()
    expect(king.talkTo(game.state)).not.toContain(OATH_LINE)
    game.state.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    expect(king.talkTo(game.state)).not.toContain(OATH_LINE)
    game.state.setStoryFlag(FLAG_ACT4_JUSTICE_ENDING, true)
    king.talkTo(game.state)
    king.talkTo(game.state)
    const loaded = new Game([new Act4()])
    loaded.loadSaveData(game.toSaveData())
    expect(new KingAlden().talkTo(loaded.state)).not.toContain(OATH_LINE)
  })
})

import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'

const HEAD =
  'A mysterious amulet inscribed with runes. At its centre is the sigil of the Wardens of the Dawn: the sun rising over three linked rings. In its depths Aren and Lysa stand hand in hand. '

describe('AncientAmulet', () => {
  it('is carried from the first turn and shows the picture Act III left', () => {
    const game = new Game([new Act4()])
    expect(game.state.hasItem('ancient amulet')).toBe(true)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      'In its depths Aren and Lysa stand hand in hand. The third figure keeps his back turned.',
    )
  })

  it('works with the door either way round', () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.MemoryVault
    expect(executeCommands(game, ['use door with amulet'])).toContain(
      'runes stay dark',
    )
    expect(executeCommands(game, ['use amulet with door'])).toContain(
      'runes stay dark',
    )
  })

  describe('picture stages', () => {
    function examineWith(...flags: string[]): string {
      const game = new Game([new Act4()])
      for (const flag of flags) game.state.setStoryFlag(flag, true)
      return executeCommands(game, ['examine amulet'])
    }

    it('keeps the third figure turned away once the orbs are mended', () => {
      const text = examineWith(FLAG_ACT4_MEMORY_ORBS_MENDED)
      expect(text).toContain(
        HEAD +
          'The third figure keeps his back turned. He is young; you can see it in the set of his shoulders.',
      )
      expect(text).not.toContain('turned around')
    })

    it('shows Malakar as he is now after the refrain', () => {
      expect(
        examineWith(
          FLAG_ACT4_MEMORY_ORBS_MENDED,
          FLAG_ACT4_THRONE_REFRAIN_SAID,
        ),
      ).toContain(
        HEAD +
          'The third figure keeps his back turned, but his head is up, as if someone has said his name.',
      )
    })

    it.each([
      ['Redemption', FLAG_ACT4_REDEMPTION_ENDING],
      ['Justice', FLAG_ACT4_JUSTICE_ENDING],
      ['Sacrifice', FLAG_ACT4_SACRIFICE_ENDING],
    ])('is dark and empty after %s', (_name, endingFlag) => {
      const text = examineWith(
        FLAG_ACT4_MEMORY_ORBS_MENDED,
        FLAG_ACT4_THRONE_REFRAIN_SAID,
        endingFlag,
      )
      expect(text).toContain(
        'the sun rising over three linked rings. Its depths are empty now. It is dark, and still warm.',
      )
      expect(text).not.toContain('Aren and Lysa')
      expect(text).not.toContain('third figure')
    })
  })
})

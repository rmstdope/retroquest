import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'

const HEAD =
  'A family heirloom whose runes glint like dew at dawn. In its depths Aren and Lysa stand hand in hand. '

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

    it('turns the third figure once the orbs are mended', () => {
      expect(examineWith(FLAG_ACT4_MEMORY_ORBS_MENDED)).toContain(
        HEAD +
          'The third figure has turned around. He is young, and he is smiling at them.',
      )
    })

    it('shows Malakar as he is now after the refrain', () => {
      expect(
        examineWith(
          FLAG_ACT4_MEMORY_ORBS_MENDED,
          FLAG_ACT4_THRONE_REFRAIN_SAID,
        ),
      ).toContain(
        HEAD +
          'The third figure is Malakar as he is now: white-haired, grey-robed, a step behind them.',
      )
    })

    it('stays at the refrain stage after Justice', () => {
      expect(
        examineWith(
          FLAG_ACT4_MEMORY_ORBS_MENDED,
          FLAG_ACT4_THRONE_REFRAIN_SAID,
          FLAG_ACT4_JUSTICE_ENDING,
        ),
      ).toContain('The third figure is Malakar as he is now')
    })

    it('shows the three at the workbench after Redemption', () => {
      expect(
        examineWith(
          FLAG_ACT4_MEMORY_ORBS_MENDED,
          FLAG_ACT4_THRONE_REFRAIN_SAID,
          FLAG_ACT4_REDEMPTION_ENDING,
        ),
      ).toContain(
        HEAD +
          'The three of them stand together at a workbench, heads bent over something you cannot quite see.',
      )
    })
  })
})

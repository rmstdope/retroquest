import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from '../Act4StoryFlags'

const HEAD =
  'A mysterious amulet inscribed with runes. At its centre is the sigil of the Wardens of the Dawn: the sun rising over three linked rings. In its depths Aren and Lysa stand hand in hand. '

const DARK_AND_EMPTY =
  'the sun rising over three linked rings. Its depths are empty now. It is dark, and still warm.'
const DARK_WITH_THE_TURNED_FIGURE =
  'the sun rising over three linked rings. It is dark now, and still warm. Only the third figure is left in its depths, and he has turned around.'

const AMULET_STEP = ACT4_GOLDEN_PATH.indexOf('use ancient amulet') + 1

/** The amulet's note in the Bag, which reads the item's description. */
function bagNote(game: Game): string | undefined {
  return new GameController(game)
    .getInventory()
    .find((entry) => entry.name.includes('ancient amulet'))?.description
}

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
      ['Justice', FLAG_ACT4_JUSTICE_ENDING],
      ['Sacrifice', FLAG_ACT4_SACRIFICE_ENDING],
    ])('is dark and empty after %s', (_name, endingFlag) => {
      const text = examineWith(
        FLAG_ACT4_MEMORY_ORBS_MENDED,
        FLAG_ACT4_THRONE_REFRAIN_SAID,
        endingFlag,
      )
      expect(text).toContain(DARK_AND_EMPTY)
      expect(text).not.toContain('Aren and Lysa')
      expect(text).not.toContain('third figure')
    })

    it('is dark after Redemption, with only the third figure left, turned around', () => {
      const text = examineWith(
        FLAG_ACT4_MEMORY_ORBS_MENDED,
        FLAG_ACT4_THRONE_REFRAIN_SAID,
        FLAG_ACT4_REDEMPTION_ENDING,
      )
      expect(text).toContain(DARK_WITH_THE_TURNED_FIGURE)
      expect(text).not.toContain('Aren and Lysa')
    })
  })

  describe('in the Bag after an ending played through', () => {
    const ENDINGS: [string, string[], string[], string][] = [
      [
        'Redemption',
        [],
        [
          'use lifelight elixir on malakar',
          'say forgiveness to malakar',
          'cast forgiveness on wound',
        ],
        DARK_WITH_THE_TURNED_FIGURE,
      ],
      [
        'Justice',
        [VIRTUE_TRUTH, VIRTUE_TRUTH],
        [
          'use lifelight elixir on prison',
          'say justice to malakar',
          'use ancient amulet on wound',
        ],
        DARK_AND_EMPTY,
      ],
      [
        'Sacrifice',
        [VIRTUE_SELFLESS, VIRTUE_SELFLESS],
        [
          'use lifelight elixir on prison',
          'say sacrifice to malakar',
          'use ancient amulet on wound',
        ],
        DARK_AND_EMPTY,
      ],
    ]

    it.each(ENDINGS)(
      'matches the dark look after %s, and through a reload',
      (_name, virtues, commands, look) => {
        const game = new Game([new Act4()])
        executeCommands(game, ACT4_GOLDEN_PATH.slice(0, AMULET_STEP))
        for (const virtue of virtues) game.state.addVirtue(virtue)
        executeCommands(game, commands)
        expect(bagNote(game)).toContain(look)
        expect(game.loadSaveData(game.toSaveData())).toContain(
          'Game loaded successfully.',
        )
        expect(bagNote(game)).toContain(look)
      },
    )
  })
})

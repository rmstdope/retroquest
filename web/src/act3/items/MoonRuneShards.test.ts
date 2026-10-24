import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED } from '../Act3StoryFlags'
import { MoonRuneShards } from './MoonRuneShards'
import { WardingPillars } from './WardingPillars'

describe('MoonRuneShards', () => {
  it('can be added to the inventory', () => {
    const game = new Game([new Act3()])

    game.state.addItemToInventory(new MoonRuneShards())

    expect(game.state.hasItem('Moon Rune Shards')).toBe(true)
  })

  it('engraves the pillars only once they are purified', () => {
    const game = new Game([new Act3()])
    const shards = new MoonRuneShards()
    const pillars = new WardingPillars()

    const resultFail = shards.useWith(game.state, pillars)
    expect(
      resultFail.includes('[failure]') ||
        resultFail.toLowerCase().includes('clogged'),
    ).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)).toBe(
      false,
    )

    const purifyResult = pillars.purify(game.state).toLowerCase()
    expect(
      purifyResult.includes('rinse') || purifyResult.includes('cleansed'),
    ).toBe(true)
    game.state.addItemToInventory(shards)
    expect(game.state.hasItem('Moon Rune Shards')).toBe(true)

    const resultOk = shards.useWith(game.state, pillars)
    expect(resultOk).not.toContain('[event]')
    expect(resultOk).toContain('You press the pale shards')
    expect(game.state.hasItem('Moon Rune Shards')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)).toBe(
      true,
    )
  })
})

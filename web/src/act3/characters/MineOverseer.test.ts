import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { MineOverseer } from './MineOverseer'
import { FLAG_ACT3_MINERS_RESCUE_COMPLETED } from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Mine Overseer dialogue markup', () => {
  it('attributes the plea for help and the later reminder to the overseer', () => {
    const game = new Game([new Act3()])
    const overseer = new MineOverseer()

    const first = overseer.talkTo(game.state)
    const second = overseer.talkTo(game.state)

    expect(game.state.hasItem("Miner's Key")).toBe(true)
    expect(second).toContain('Tool Cache')
    for (const answer of [first, second]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, overseer.name)
    }
    expect(first.split('[dialogue]')[1]).toContain(
      'Half a dozen men are trapped',
    )
    expect(second.split('[dialogue]')[1]).toContain('Tool Cache is north')
  })
})

describe('Mine Overseer lines', () => {
  it('names the supplies, the way to the galleries and the order to brace first', () => {
    const game = new Game([new Act3()])

    const first = new MineOverseer().talkTo(game.state)

    expect(first).toContain('braces, straps, wedge blocks')
    expect(first).toContain('The Collapsed Galleries are past it, east.')
    expect(first).toContain('Brace the roof before you touch the rock')
    expect(first).not.toContain('tons of')
  })

  it('waits at the arch while the miners are still trapped', () => {
    const game = new Game([new Act3()])
    const overseer = new MineOverseer()
    overseer.talkTo(game.state)

    const again = overseer.talkTo(game.state)

    expect(again).toContain('has not moved from the arch')
    expect(again).toContain('Still nothing from the galleries.')
  })

  it('counts his men home once the rescue is done', () => {
    const game = new Game([new Act3()])
    const overseer = new MineOverseer()
    overseer.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)

    const after = overseer.talkTo(game.state)

    expectMarkupWellFormed(after)
    expect(after).toContain('All of them. Even the boy.')
    expect(after).toContain('He lets go of the arch at last.')
    expect(after).not.toContain('Still nothing')
  })
})

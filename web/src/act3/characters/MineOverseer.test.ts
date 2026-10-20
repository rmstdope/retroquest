import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { MineOverseer } from './MineOverseer'
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

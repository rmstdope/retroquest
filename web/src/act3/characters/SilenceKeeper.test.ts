import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SilenceKeeper } from './SilenceKeeper'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Silence Keeper dialogue markup', () => {
  it('attributes the guidance to the keeper before the first dialogue', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const answer = keeper.talkTo(game.state)

    expect(answer).toContain('echo stones await sanctification')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, keeper.name)
  })
})

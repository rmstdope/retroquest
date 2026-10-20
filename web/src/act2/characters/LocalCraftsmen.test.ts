import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HELPED_ELDERLY_RESIDENTS } from '../Act2StoryFlags'
import { LocalCraftsmen } from './LocalCraftsmen'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Local Craftsmen dialogue markup', () => {
  it('attributes the greeting after learning mend to the craftsmen', () => {
    const game = new Game([new Act2()])
    const craftsmen = new LocalCraftsmen()
    game.state.setStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS, true)
    craftsmen.talkTo(game.state)

    const answer = craftsmen.talkTo(game.state)

    expect(answer).toContain('Good to see you again!')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'local craftsmen')
  })
})

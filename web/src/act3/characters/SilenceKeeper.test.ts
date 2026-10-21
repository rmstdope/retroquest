import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SilenceKeeper } from './SilenceKeeper'
import { FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED } from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Silence Keeper dialogue markup', () => {
  it('attributes the guidance to the keeper before the first dialogue', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const answer = keeper.talkTo(game.state)

    expect(answer).toContain('I have kept this hush for forty years')
    expect(answer).toContain('I was a singer once, in the villages above.')
    expect(answer).toContain('Bless them, and give them the old chant')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, keeper.name)
  })
})

describe('Silence Keeper over time', () => {
  it('tells the story once, then reminds, then closes once the way is open', () => {
    const game = new Game([new Act3()])
    const keeper = new SilenceKeeper()

    const first = keeper.talkTo(game.state)
    const later = keeper.talkTo(game.state)
    expect(keeper.talkTo(game.state)).toBe(later)
    expect(later).toContain('Forty years I have listened to those stones.')
    expect(later).not.toContain('singer')

    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    const closing = keeper.talkTo(game.state)
    expect(closing).toContain('The sleeper spoke with you, and the stone held.')
    expect(keeper.talkTo(game.state)).toBe(closing)
    for (const text of [first, later, closing]) {
      expectMarkupWellFormed(text)
      expectDialogueSpeaker(text, keeper.name)
    }
  })

  it('gives the closing line on a first talk after completion', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
    expect(new SilenceKeeper().talkTo(game.state)).toContain(
      'never been so glad to have kept a quiet',
    )
  })
})

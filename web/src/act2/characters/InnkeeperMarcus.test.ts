import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_MARCUS_TOLD_TRUTH,
  VIRTUE_TRUTH,
} from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const ILL_WIND = 'An ill wind, the healer called it.'
const REMEMBERED = '✦ Truth — this will be remembered'

/** An Act II game at the Silver Stag Inn, Elena cured; the charm not yet given. */
function gameAfterCure(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.SilverStagInn
  game.state.setStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED, true)
  return game
}

describe('Innkeeper Marcus and the truth (truth moment)', () => {
  it('leaves the charm-giving talk unchanged', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('talk to innkeeper marcus')

    expect(answer).toContain('druidic charm')
    expect(answer).not.toContain(ILL_WIND)
  })

  it('ends every later talk with the ill wind line until told', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to innkeeper marcus')
      expect(answer).toContain('My daughter is healthy and happy again')
      expect(answer).toContain(ILL_WIND)
      expect(answer.indexOf(ILL_WIND)).toBeGreaterThan(
        answer.indexOf('My daughter is healthy'),
      )
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'innkeeper marcus')
    }
  })

  it('records truth with the telling, his reply and the remembered line', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('You tell')
    expect(answer).toContain('the curse was no ill wind')
    expect(answer).toContain('Someone chose my girl.')
    expect(answer).toContain(REMEMBERED)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'innkeeper marcus')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)).toBe(true)
  })

  it('works between the cure and the charm talk', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain(REMEMBERED)
  })

  it('records the moment although Act I already recorded truth', () => {
    const game = gameAfterCure()
    game.state.addVirtue(VIRTUE_TRUTH)

    expect(game.commandParser.parse('say truth to marcus')).toContain(
      REMEMBERED,
    )
  })

  it('drops the ill wind line after the truth and adds nothing', () => {
    const game = gameAfterCure()
    game.commandParser.parse('talk to innkeeper marcus')
    game.commandParser.parse('say truth to marcus')

    const answer = game.commandParser.parse('talk to innkeeper marcus')

    expect(answer).toContain('My daughter is healthy and happy again')
    expect(answer).not.toContain(ILL_WIND)
    expect(answer).not.toContain('remembered')
  })

  it('answers a second telling without a second remembered line', () => {
    const game = gameAfterCure()
    game.commandParser.parse('say truth to marcus')

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('I heard you the first time, friend.')
    expect(answer).not.toContain('remembered')
    expectDialogueSpeaker(answer, 'innkeeper marcus')
  })

  it('says the truth is upstairs before the cure and records nothing', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn

    const answer = game.commandParser.parse('say truth to marcus')

    expect(answer).toContain('The only truth I care about is upstairs')
    expect(answer).not.toContain('remembered')
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
    expectDialogueSpeaker(answer, 'innkeeper marcus')
  })

  it('gives other words the default reply', () => {
    const game = gameAfterCure()

    const answer = game.commandParser.parse('say hello to marcus')

    expect(answer).toContain("don't seem to understand")
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
  })
})

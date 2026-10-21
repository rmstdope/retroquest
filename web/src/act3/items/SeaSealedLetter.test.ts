import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SeaSealedLetter } from './SeaSealedLetter'
import { parseTurn } from '@/lantern/parseTurn'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('SeaSealedLetter', () => {
  it('exposes an appropriate name', () => {
    new Game([new Act3()])

    const letter = new SeaSealedLetter()

    expect(letter.name.toLowerCase().startsWith('sea')).toBe(true)
  })

  it('examining yields balanced, non-nested markup', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().examine(game.state)

    expect(answer).toContain('Malakar, our friend')
    expect(answer).not.toContain('Lyra')
    expect(answer).not.toContain('Theron')
    expectMarkupWellFormed(answer)
  })

  it("is a plea from Aren and Lysa with Malakar's reply, as unlabelled quotes", () => {
    const game = new Game([new Act3()])

    const blocks = parseTurn(new SeaSealedLetter().examine(game.state))

    const quotes = blocks.filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(5)
    expect(
      quotes.every((b) => b.kind === 'dialogue' && b.speaker === null),
    ).toBe(true)
    const text = JSON.stringify(blocks)
    expect(text).toContain('Wardens of the Dawn')
    expect(text).toContain('Aren and Lysa')
    expect(text).toContain('You would have me wait while you die. — M.')
    expect(text).toContain('He read it, and answered.')
  })

  it('shows the same text when looked at as when examined', () => {
    const game = new Game([new Act3()])
    const letter = new SeaSealedLetter()

    expect(letter.examine(game.state)).toContain(letter.description)
    expect(letter.examine(game.state)).toBe(letter.examine(game.state))
  })

  it('picking up uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().pickedUp(game.state)

    expect(answer).toContain('a plea to a friend, kept by the sea')
    expectMarkupWellFormed(answer)
  })
})

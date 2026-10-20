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

    expect(answer).toContain('Lyra and Theron')
    expectMarkupWellFormed(answer)
  })

  it('shows the letter as unlabelled quotes, naming the writers only at the end', () => {
    const game = new Game([new Act3()])

    const blocks = parseTurn(new SeaSealedLetter().examine(game.state))

    const quotes = blocks.filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(2)
    expect(
      quotes.every((b) => b.kind === 'dialogue' && b.speaker === null),
    ).toBe(true)
    expect(JSON.stringify(blocks.slice(0, -1))).not.toContain('Theron')
  })

  it('picking up uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().pickedUp(game.state)

    expect(answer).toContain('testament kept by the sea')
    expectMarkupWellFormed(answer)
  })
})

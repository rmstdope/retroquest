import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SeaSealedLetter } from './SeaSealedLetter'
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

  it('picking up uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().pickedUp(game.state)

    expect(answer).toContain('testament kept by the sea')
    expectMarkupWellFormed(answer)
  })
})

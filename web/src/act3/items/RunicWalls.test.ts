import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { RunicWalls } from './RunicWalls'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('RunicWalls markup', () => {
  it('examining the walls uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new RunicWalls().examine(game.state)

    expect(answer).toContain('chant to quiet the phantoms')
    expectMarkupWellFormed(answer)
  })
})

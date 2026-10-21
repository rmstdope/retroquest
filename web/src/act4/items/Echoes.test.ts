import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Echoes } from './Echoes'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('Echoes', () => {
  it('gives the same plain clue every time', () => {
    const game = new Game([new Act4()])
    const echoes = new Echoes()
    expect(echoes.canBeCarried).toBe(false)
    const first = echoes.examine(game.state)
    expect(first).toContain('the true path shows itself')
    expect(echoes.examine(game.state)).toBe(first)
    expectMarkupWellFormed(first)
  })
})

import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Echoes } from './Echoes'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('Echoes', () => {
  it('gives the route through the maze every time', () => {
    const game = new Game([new Act4()])
    const echoes = new Echoes()
    expect(echoes.canBeCarried).toBe(false)
    const first = echoes.examine(game.state)
    expect(first).toContain('one voice repeats the same words')
    expect(first).toContain(
      "'Left, then left, then the way your reflection does not go.'",
    )
    expect(echoes.examine(game.state)).toBe(first)
    expectMarkupWellFormed(first)
  })
})

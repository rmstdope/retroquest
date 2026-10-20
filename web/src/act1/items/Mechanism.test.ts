import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Mechanism } from './Mechanism'

describe('Mechanism', () => {
  it('asks for something to use with it in well-formed markup', () => {
    const game = new Game([new Act1()])
    expect(findMarkupProblems(new Mechanism().use(game.state))).toEqual([])
  })
})

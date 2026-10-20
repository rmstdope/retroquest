import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { OldNotice } from './OldNotice'

describe('OldNotice', () => {
  it('reads as well-formed markup', () => {
    const game = new Game([new Act1()])
    const text = new OldNotice().read(game.state)
    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain('[event]You read the [item_name]')
  })
})

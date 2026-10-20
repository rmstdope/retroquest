import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { Bucket } from './Bucket'
import { Well } from './Well'

describe('Bucket', () => {
  it('draws murky, sour water from the unpurified well', () => {
    const game = new Game([new Act1()])
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, new Well())

    expect(answer).toContain('murky')
    expect(answer).toContain('sour smell')
    expect(answer).not.toContain('clear water')
    expect(bucket.description).toContain('murky')
  })

  it('draws clear water once the well is purified', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = true
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, well)

    expect(answer).toContain('clear water')
    expect(bucket.description).toContain('clear water')
  })
})

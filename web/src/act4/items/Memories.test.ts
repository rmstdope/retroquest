import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Memories } from './Memories'

describe('Memories', () => {
  it('says what the ward is, where it lives and where it is tied, and dates the Wasting', () => {
    const game = new Game([new Act4()])

    const seen = new Memories().examine(game.state)

    expect(seen).toContain(
      'The year before you were born. The Wasting: a fever sweeps the land, and Aren and Lysa fall ill with it.',
    )
    expect(seen).toContain(
      'The ward is Aren and Lysa, and it lives in you. Their gift is the magic you have: every spell that ever answered your hands came through them, all but one, which you read from a stone in a glade.',
    )
    expect(seen.indexOf('Hold it shut, Aren.')).toBeLessThan(
      seen.indexOf('The ward is Aren and Lysa, and it lives in you.'),
    )
    expect(
      seen.indexOf('The ward is Aren and Lysa, and it lives in you.'),
    ).toBeLessThan(seen.indexOf('Last, and smallest'))
  })

  it('answers to "memory" and "lanterns"', () => {
    expect(new Memories().answersTo('lanterns')).toBe(true)
    expect(new Memories().answersTo('memory')).toBe(true)
    expect(new Memories().answersTo('memories')).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { LanternBracket } from './LanternBracket'

/** A bare game state for examining. */
function createState(): GameState {
  return new GameState(new Room({ name: 'x', description: '' }), {}, [])
}

describe('LanternBracket', () => {
  it('starts empty with no lantern mounted', () => {
    new Game([new Act3()])

    const bracket = new LanternBracket()

    expect('hasLantern' in bracket).toBe(true)
    expect(bracket.hasLantern).toBe(false)
  })

  it('examine reflects whether a lantern is mounted', () => {
    const bracket = new LanternBracket()
    const gs = createState()

    const resultEmpty = bracket.examine(gs)
    expect(
      resultEmpty.includes('empty bracket') ||
        resultEmpty.includes('waits for a lantern'),
    ).toBe(true)

    bracket.putLantern()
    const resultWith = bracket.examine(gs)
    expect(
      resultWith.includes('prism lantern rests') ||
        resultWith.includes('ready to be lit'),
    ).toBe(true)
  })
})

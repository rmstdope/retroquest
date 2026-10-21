import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_SERVANTS_TRUST_EARNED } from '../Act4StoryFlags'
import { OuterCourtyard } from './OuterCourtyard'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** Create an Act IV game for markup checks. */
function createMarkupGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

describe('OuterCourtyard', () => {
  it('has the correct name', () => {
    const room = new OuterCourtyard()
    expect(room.name).toBe('Outer Courtyard')
  })

  it('uses known tags in the messages after the servants are freed', () => {
    const game = createMarkupGame()
    const room = new OuterCourtyard()
    game.state.currentRoom = room
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
    room.castBless(game.state)

    const blessAgain = room.castBless(game.state)

    expect(blessAgain).toContain('nothing left to bless away')
    expectMarkupWellFormed(blessAgain)
  })
})

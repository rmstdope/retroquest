import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'
import { FortressGates } from './FortressGates'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** Create an Act IV game for markup checks. */
function createMarkupGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

describe('FortressGates', () => {
  it('has the correct name', () => {
    const room = new FortressGates()
    expect(room.name).toBe('Fortress Gates')
  })

  it('uses known tags in the messages after the guardians are banished', () => {
    const game = createMarkupGame()
    const room = new FortressGates()
    game.state.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
    room.light(game.state)

    const lightAgain = room.light(game.state)

    expect(lightAgain).toContain('already been banished')
    expectMarkupWellFormed(lightAgain)
  })
})

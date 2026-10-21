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

    expect(lightAgain).toContain('nothing left here for your light')
    expectMarkupWellFormed(lightAgain)
  })

  it('describes the wall up, the wall down and the guardians gone', () => {
    const game = createMarkupGame()
    const room = new FortressGates()
    const state = game.state

    expect(room.descriptionFor(state)).toContain('thin wall of the same light')

    state.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)
    const middle = room.descriptionFor(state)
    expect(middle).toContain('The violet wall is gone')
    expect(middle).toContain('still walk their short lines')

    room.light(state)
    const after = room.descriptionFor(state)
    expect(after).toContain('The gates stand open.')
    expect(after).not.toContain('still walk')
  })

  it('keeps the matching description through a save and load', () => {
    const game = createMarkupGame()
    const gates = game.state.currentRoom
    expect(gates).toBeInstanceOf(FortressGates)
    game.state.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)

    const reloaded = new Game([new Act4()])
    reloaded.loadSaveData(game.toSaveData())

    expect(reloaded.state.currentRoom.descriptionFor(reloaded.state)).toContain(
      'The violet wall is gone',
    )
  })

  it('tells the player nothing to type', () => {
    const game = createMarkupGame()
    const room = new FortressGates()
    expect(room.light(game.state)).not.toContain('You must')
  })
})

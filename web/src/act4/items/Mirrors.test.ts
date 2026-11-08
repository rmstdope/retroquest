import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Mirrors } from './Mirrors'
import { EchoStone } from './EchoStone'
import { ServantsPendant } from './ServantsPendant'
import { MirrorLabyrinth } from '../rooms/MirrorLabyrinth'
import { FLAG_ACT4_SERVANTS_FREED } from '../Act4StoryFlags'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

/** A game with Elior at the last fork of the maze, carrying stone and pendant. */
function atTheFork(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
  const room = act.rooms.MirrorLabyrinth as MirrorLabyrinth
  game.state.currentRoom = room
  room.onEnter(game.state)
  game.state.inventory.push(new EchoStone(), new ServantsPendant())
  game.move('west')
  game.move('west')
  return game
}

describe('Mirrors', () => {
  it('is scenery that tells of many false paths', () => {
    const game = new Game([new Act4()])
    const mirrors = new Mirrors()
    expect(mirrors.canBeCarried).toBe(false)
    const answer = mirrors.examine(game.state)
    expect(answer).toContain('Most of them are lies.')
    expectMarkupWellFormed(answer)
  })

  it('shows the empty corridor when the pendant is used with them at the fork', () => {
    const game = atTheFork()
    const answer = executeCommands(game, ["use servant's pendant with mirrors"])
    expect(answer).toContain('In the east corridor the glass stays empty.')
    expectMarkupWellFormed(answer)
  })

  it('repeats the route when the echo stone is used with them', () => {
    const game = atTheFork()
    const answer = executeCommands(game, ['use echo stone with mirrors'])
    expect(answer).toContain('Left, then left, then the way your reflection')
    expectMarkupWellFormed(answer)
  })
})

import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { EchoStone } from './EchoStone'
import { ServantsPendant } from './ServantsPendant'
import { Mirrors } from './Mirrors'
import { FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED } from '../Act4StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act IV game with the player standing in the maze. */
function inMaze(): { game: Game; act: Act4 } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = act.rooms.MirrorLabyrinth
  return { game, act }
}

describe('EchoStone', () => {
  it('can be carried and says what it is when taken', () => {
    const stone = new EchoStone()
    const { game } = inMaze()
    expect(stone.canBeCarried).toBe(true)
    expect(stone.pickedUp(game.state)).toContain('You lift a smooth grey stone')
  })

  it('murmurs neutrally outside the maze, also with the pendant', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    const stone = new EchoStone()
    const pendant = new ServantsPendant()
    game.state.inventory.push(pendant)
    const alone = stone.use(game.state)
    expect(alone).toContain('waiting for somewhere that needs them')
    expect(stone.useWith(game.state, pendant)).toBe(alone)
    expect(pendant.useWith(game.state, stone)).toBe(alone)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      false,
    )
    expectMarkupWellFormed(alone)
  })

  it('needs the pendant in the pack to solve the maze', () => {
    const { game } = inMaze()
    const stone = new EchoStone()
    expect(stone.use(game.state)).toContain('You need something to light')
    game.state.inventory.push(new ServantsPendant())
    expect(stone.use(game.state)).toContain('a plain mirror')
    expect(stone.use(game.state)).toContain('already clear')
  })

  it('refuses other items as the base class does', () => {
    const { game } = inMaze()
    expect(new EchoStone().useWith(game.state, new Mirrors())).toContain(
      "can't use",
    )
  })
})

describe('EchoStone enhanced', () => {
  it('is renamed, examined anew and only waits when used anywhere', () => {
    const game = new Game([new Act4()])
    const stone = new EchoStone()
    stone.enhance()
    expect(stone.name).toBe('Enhanced Echo Stone')
    expect(stone.examine(game.state)).toContain(
      'The Echo Stone hums more strongly now.',
    )
    expect(stone.use(game.state)).toContain(
      'waiting for a place where memories sleep.',
    )
  })
})

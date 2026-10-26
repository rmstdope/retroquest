import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { EchoStone } from './EchoStone'
import { ServantsPendant } from './ServantsPendant'
import { Mirrors } from './Mirrors'
import { FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED } from '../Act4StoryFlags'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

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

  it('only mentions the niche beneath the banners on the first pickup', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    const first = executeCommands(game, ['take echo stone'])
    expect(first).toContain('from a niche beneath the banners')
    game.state.currentRoom = act.rooms.MirrorLabyrinth
    executeCommands(game, ['drop echo stone'])
    const again = executeCommands(game, ['take echo stone'])
    expect(again).toBe(
      "The stone is warm, and the hall's echoes still speak inside it.",
    )
    expect(again).not.toContain('banners')
    expect(again).not.toContain('niche')
    expectMarkupWellFormed(again)
  })

  it('remembers across a save and load that it left the niche', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    executeCommands(game, ['take echo stone'])
    expect(game.loadSaveData(game.toSaveData())).toContain(
      'Game loaded successfully.',
    )
    executeCommands(game, ['drop echo stone'])
    expect(executeCommands(game, ['take echo stone'])).not.toContain('banners')
  })

  it('is taken in its own words, without the plain pick-up before them', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    const answer = game.commandParser.parse('take echo stone')
    expect(answer).toMatch(/^You lift a smooth grey stone/)
    expect(answer).not.toContain('You take')
    expect(game.state.getItemCount('Echo Stone')).toBe(1)
  })

  it('murmurs neutrally outside the maze, also with the pendant', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    const stone = new EchoStone()
    const pendant = new ServantsPendant()
    game.state.inventory.push(pendant)
    const alone = stone.use(game.state)
    expect(alone).toContain('waiting for somewhere that needs them')
    expect(alone).toContain(
      'one voice says a single word over and over, the way a man says a ' +
        'word he has stopped believing in: redemption.',
    )
    expect(stone.useWith(game.state, pendant)).toBe(alone)
    expect(pendant.useWith(game.state, stone)).toBe(alone)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      false,
    )
    expectMarkupWellFormed(alone)
  })

  it('repeats the route in the maze, alone or with the pendant, and never solves', () => {
    const { game } = inMaze()
    const stone = new EchoStone()
    const pendant = new ServantsPendant()
    game.state.inventory.push(pendant)
    const alone = stone.use(game.state)
    expect(alone).toContain('Left, then left, then the way your shadow')
    expect(stone.useWith(game.state, pendant)).toBe(alone)
    expect(pendant.useWith(game.state, stone)).toBe(alone)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      false,
    )
    expectMarkupWellFormed(alone)
  })

  it('still repeats the route in the maze once enhanced', () => {
    const { game } = inMaze()
    const stone = new EchoStone()
    stone.enhance()
    expect(stone.use(game.state)).toContain('Left, then left, then the way')
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
      'The echo stone hums more strongly now.',
    )
    expect(stone.use(game.state)).toContain(
      'waiting for a place where memories sleep.',
    )
  })

  it('reads in lower case mid-sentence when refused as a gift or a use', () => {
    const { game, act } = inMaze()
    game.state.currentRoom = act.rooms.HallOfEchoes
    const stone = new EchoStone()
    stone.enhance()
    game.state.inventory.push(stone)
    expect(executeCommands(game, ['give enhanced echo stone to knight'])).toBe(
      'The [character_name]Knight of Despair[/character_name] ' +
        "doesn't seem interested in the " +
        '[item_name]enhanced echo stone[/item_name].',
    )
    expect(
      executeCommands(game, ['use enhanced echo stone with banners']),
    ).toBe(
      "[failure]You can't use the [item_name]enhanced echo stone[/item_name] " +
        'with the [item_name]banners[/item_name].[/failure]',
    )
  })
})

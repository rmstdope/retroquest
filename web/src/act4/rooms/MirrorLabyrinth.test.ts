import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { MirrorLabyrinth } from './MirrorLabyrinth'
import { EchoStone } from '../items/EchoStone'
import { ServantsPendant } from '../items/ServantsPendant'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import {
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_STARTED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'

const ENTRANCE = 'You stand at the mouth of the maze, facing north.'
const STRETCH = 'The corridor narrows and bends, and you face north again.'
const FORK = 'The corridor ends in a last fork, facing north.'
const AFTER = 'The false mirrors stand dark and silent now.'
const WRONG = 'walk straight into cold glass'
const NO_STONE = "You try to recall the echoes' words"

/** A game with Elior standing at the entrance of the maze. */
function inMaze(carry: { stone?: boolean; pendant?: boolean } = {}): {
  game: Game
  room: MirrorLabyrinth
} {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  const room = act.rooms.MirrorLabyrinth as MirrorLabyrinth
  game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
  game.state.currentRoom = room
  room.onEnter(game.state)
  if (carry.stone ?? true) game.state.inventory.push(new EchoStone())
  if (carry.pendant ?? true) game.state.inventory.push(new ServantsPendant())
  return { game, room }
}

/** The exits the room offers, in order. */
function exitsOf(game: Game, room: MirrorLabyrinth): string[] {
  return Object.keys(room.getExits(game.state))
}

/** The room's description as the story view shows it. */
function seen(game: Game, room: MirrorLabyrinth): string {
  return room.descriptionFor(game.state)
}

describe('MirrorLabyrinth', () => {
  it('has the correct name and starts its quest on entering', () => {
    const { game, room } = inMaze()
    expect(room.name).toBe('Mirror Labyrinth')
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_STARTED)).toBe(
      true,
    )
  })

  it('starts at the entrance with four exits', () => {
    const { game, room } = inMaze()
    expect(seen(game, room)).toContain(ENTRANCE)
    expect(exitsOf(game, room)).toEqual(['north', 'east', 'west', 'south'])
  })

  it('walks left twice to the fork, each stretch with its own look', () => {
    const { game, room } = inMaze()
    expect(game.move('west')).toBe(
      'You turn left, and the glass lets you through.',
    )
    expect(game.state.currentRoom).toBe(room)
    expect(seen(game, room)).toContain(STRETCH)
    expect(exitsOf(game, room)).toEqual(['north', 'east', 'west', 'south'])
    expect(game.move('west')).toBe(
      'You turn left again, and the glass lets you through.',
    )
    expect(seen(game, room)).toContain(FORK)
    expect(exitsOf(game, room)).toEqual(['north', 'east', 'south'])
  })

  it.each(['north', 'east'])(
    'sends a wrong turn %s from the entrance back to the entrance',
    (way) => {
      const { game, room } = inMaze()
      expect(game.move(way)).toContain(WRONG)
      expect(seen(game, room)).toContain(ENTRANCE)
    },
  )

  it.each(['north', 'east'])(
    'sends a wrong turn %s from the first stretch back to the entrance',
    (way) => {
      const { game, room } = inMaze()
      game.move('west')
      expect(game.move(way)).toContain(WRONG)
      expect(seen(game, room)).toContain(ENTRANCE)
      expect(game.move('west')).toContain('the glass lets you through')
      expect(seen(game, room)).toContain(STRETCH)
    },
  )

  it.each(['north', 'east'])(
    'counts %s at the fork before the pendant as a wrong turn',
    (way) => {
      const { game, room } = inMaze()
      game.move('west')
      game.move('west')
      expect(game.move(way)).toContain(WRONG)
      expect(seen(game, room)).toContain(ENTRANCE)
      expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
        false,
      )
    },
  )

  it('fails every turn without the echo stone, even the right one', () => {
    const { game, room } = inMaze({ stone: false })
    expect(game.move('west')).toContain(NO_STONE)
    expect(seen(game, room)).toContain(ENTRANCE)
    expect(game.move('north')).toContain(NO_STONE)
  })

  it('fails the last turn without the stone and forgets the way', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    game.state.inventory = game.state.inventory.filter(
      (item) => !(item instanceof EchoStone),
    )
    expect(game.move('east')).toContain(NO_STONE)
    expect(seen(game, room)).toContain(ENTRANCE)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      false,
    )
  })

  it('answers the pendant before the fork with nothing to choose', () => {
    const { game, room } = inMaze()
    expect(room.usePendant(game.state)).toContain('nothing yet to choose')
    game.move('west')
    expect(room.usePendant(game.state)).toContain('nothing yet to choose')
  })

  it('shows the empty corridor at the fork, then only reminds', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    const first = room.usePendant(game.state)
    expect(first).toContain('In the east corridor the glass stays empty.')
    const again = room.usePendant(game.state)
    expect(again).toContain('Your reflection still walks the north corridor.')
    expect(again).not.toEqual(first)
  })

  it('forgets the pendant answer after a wrong turn', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    game.move('north')
    game.move('west')
    game.move('west')
    expect(game.move('east')).toContain(WRONG)
    game.move('west')
    game.move('west')
    expect(room.usePendant(game.state)).toContain('blue light')
  })

  it('solves the maze going east after the pendant has shown the fork', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    const result = game.move('east')
    expect(result).toContain('Behind you the false mirrors go dark')
    expect(result).toContain('Truth Sight')
    expect(game.state.hasSpell('truth_sight')).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      true,
    )
    expect(seen(game, room)).toContain(AFTER)
    expect(exitsOf(game, room)).toEqual(['south'])
    expect(room.characters.map((c) => c.name)).toEqual(['True Self'])
  })

  it('repeats the route for the stone and never solves with it', () => {
    const { game, room } = inMaze()
    const heard = room.useStone(game.state)
    expect(heard).toContain(
      'You hold the echo stone to your ear. One voice repeats',
    )
    expect(heard).toContain('Left, then left, then the way your shadow')
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    expect(room.useStone(game.state)).toContain('Left, then left')
    expect(game.state.getStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED)).toBe(
      false,
    )
  })

  it('retraces south out of any stretch and re-enters at the entrance', () => {
    const { game, room } = inMaze()
    game.move('west')
    const out = game.move('south')
    expect(out).toContain('You retrace your steps out of the glass.')
    expect(game.state.currentRoom.name).toBe('Outer Courtyard')
    game.move('north')
    expect(game.state.currentRoom).toBe(room)
    expect(seen(game, room)).toContain(ENTRANCE)
  })

  it('keeps the solved room solved when coming back', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    game.move('east')
    game.move('south')
    game.move('north')
    expect(seen(game, room)).toContain(AFTER)
    expect(exitsOf(game, room)).toEqual(['south'])
    expect(room.usePendant(game.state)).toContain('already clear')
    expect(game.move('north')).toContain("can't go that way")
  })

  it('writes well-formed markup in every state', () => {
    const { game, room } = inMaze()
    const answers = [
      room.useStone(game.state),
      room.usePendant(game.state),
      game.move('north'),
      game.move('west'),
      game.move('west'),
      room.usePendant(game.state),
      room.usePendant(game.state),
      game.move('east'),
      room.usePendant(game.state),
    ]
    const bare = inMaze({ stone: false })
    answers.push(bare.game.move('west'))
    for (const answer of answers) expectMarkupWellFormed(answer)
  })

  it('survives a save and load at the fork with the pendant shown', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    game.loadSaveData(game.toSaveData())
    const loaded = game.state.currentRoom as MirrorLabyrinth
    expect(seen(game, loaded)).toContain(FORK)
    expect(game.move('east')).toContain('Behind you the false mirrors go dark')
  })
})

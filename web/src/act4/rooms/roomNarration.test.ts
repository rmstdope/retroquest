import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
} from '../Act4StoryFlags'
import { EchoStone } from '../items/EchoStone'
import { ServantsPendant } from '../items/ServantsPendant'
import { WardStone } from '../items/WardStone'
import { WardStones } from '../items/WardStones'
import type { ChamberOfWhispers } from './ChamberOfWhispers'
import type { FortressGates } from './FortressGates'
import type { HallOfEchoes } from './HallOfEchoes'
import type { MemoryVault } from './MemoryVault'
import type { MirrorLabyrinth } from './MirrorLabyrinth'
import type { OuterCourtyard } from './OuterCourtyard'
import type { ParentsVault } from './ParentsVault'
import type { TowerOfShadows } from './TowerOfShadows'
import type { WillowbrookField } from './WillowbrookField'

/** An Act IV game with its rooms at hand. */
function newGame(): { game: Game; act: Act4 } {
  const act = new Act4()
  act.musicFile = ''
  return { game: new Game([act]), act }
}

/** The block kinds of an answer, with a star on a read red box. */
function shape(text: string | null): string[] {
  return parseTurn(text ?? '').map((b: TurnBlock) =>
    b.kind === 'failure' && b.narrated ? 'failure*' : b.kind,
  )
}

/** The text of a single block of an answer. */
function only(text: string): string {
  const blocks = parseTurn(text)
  expect(blocks).toHaveLength(1)
  const block = blocks[0]
  if (block.kind === 'checklist' || block.kind === 'dialogue') {
    throw new Error('unexpected block')
  }
  return block.markup
}

describe('Act IV rooms narrate their effect', () => {
  it('every blocked way is a read red box, except the way home', () => {
    const { game, act } = newGame()
    const cases: [string, string | null][] = [
      [
        'FortressGates',
        (act.rooms.FortressGates as FortressGates).blockedExit(
          game.state,
          'north',
        ),
      ],
      [
        'HallOfEchoes',
        (act.rooms.HallOfEchoes as HallOfEchoes).blockedExit(
          game.state,
          'east',
        ),
      ],
      [
        'MemoryVault',
        (act.rooms.MemoryVault as MemoryVault).blockedExit(game.state, 'east'),
      ],
      [
        'TowerOfShadows',
        (act.rooms.TowerOfShadows as TowerOfShadows).blockedExit(
          game.state,
          'up',
        ),
      ],
      [
        'ChamberOfWhispers',
        (act.rooms.ChamberOfWhispers as ChamberOfWhispers).blockedExit(
          game.state,
          'north',
        ),
      ],
      [
        'ParentsVault',
        (act.rooms.ParentsVault as ParentsVault).blockedExit(
          game.state,
          'north',
        ),
      ],
      [
        'OuterCourtyard',
        (act.rooms.OuterCourtyard as OuterCourtyard).blockedExit(
          game.state,
          'north',
        ),
      ],
    ]
    for (const [name, answer] of cases) {
      expect(shape(answer), name).toEqual(['failure*'])
    }
    const home = (act.rooms.WillowbrookField as WillowbrookField).blockedExit(
      game.state,
      'north',
    )
    expect(shape(home)).toEqual(['failure'])
  })

  it('the home field reads the remembered spell, with no grey line', () => {
    const { game, act } = newGame()
    const out = (act.rooms.WillowbrookField as WillowbrookField).enterText(
      game.state,
    )
    expect(out).toContain('You remember the grow spell!')
    expect(shape(out)).not.toContain('event')
  })

  describe('Fortress Gates', () => {
    it('light with no target and on all three stones are read red boxes', () => {
      const { game, act } = newGame()
      const gates = act.rooms.FortressGates as FortressGates
      expect(shape(gates.light(game.state))).toEqual(['failure*'])
      expect(shape(gates.lightAllStones(game.state))).toEqual(['failure*'])
    })

    it('light on a wrong stone is a read red box', () => {
      const { game, act } = newGame()
      const gates = act.rooms.FortressGates as FortressGates
      expect(
        shape(gates.lightStone(game.state, new WardStone('left'))),
      ).toEqual(['failure*'])
    })

    it('light on the right stone is read, then the stones are plain dark runes', () => {
      const { game, act } = newGame()
      const gates = act.rooms.FortressGates as FortressGates
      const out = gates.lightStone(game.state, new WardStone('right'))
      expect(shape(out)).toEqual(['text', 'text'])
      expect(only(gates.lightStone(game.state, new WardStone('left')))).toBe(
        'The stone is dark. Your light shows only its runes.',
      )
      expect(new WardStones()).toBeDefined()
    })
  })

  describe('Mirror Labyrinth', () => {
    /** A game standing in the maze with the stone and the pendant. */
    function inMaze(): { game: Game; room: MirrorLabyrinth } {
      const { game, act } = newGame()
      const room = act.rooms.MirrorLabyrinth as MirrorLabyrinth
      game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      game.state.currentRoom = room
      room.onEnter(game.state)
      game.state.inventory.push(new EchoStone(), new ServantsPendant())
      return { game, room }
    }

    it('the right turns say how Elior turns and what the glass does', () => {
      const { game } = inMaze()
      expect(only(game.move('west'))).toBe(
        'You turn left, and the glass lets you through.',
      )
      expect(only(game.move('west'))).toBe(
        'You turn left again, and the glass lets you through.',
      )
    })

    it('a wrong turn is a read red box', () => {
      const { game } = inMaze()
      expect(shape(game.move('north'))).toEqual(['failure*'])
    })

    it('leaving south is a read retracing of steps', () => {
      const { game } = inMaze()
      const out = game.move('south')
      expect(out).toMatch(/^You retrace your steps out of the glass\.\n\n/)
      expect(shape(out)[0]).toBe('text')
    })

    it('the stone and the pendant are read', () => {
      const { game, room } = inMaze()
      expect(room.useStone(game.state)).toContain(
        'You hold the echo stone to your ear. One voice repeats, patient as a heartbeat:',
      )
      expect(shape(room.useStone(game.state))).not.toContain('event')
      expect(shape(room.usePendant(game.state))).toEqual(['text'])
      game.move('west')
      game.move('west')
      expect(shape(room.usePendant(game.state))).toEqual(['text'])
    })

    it('solving it is read, with no grey line', () => {
      const { game, room } = inMaze()
      game.move('west')
      game.move('west')
      room.usePendant(game.state)
      const out = game.move('east')
      expect(out).toMatch(/^You step into the empty corridor\. Behind you/)
      expect(shape(out)).toEqual(['text', 'text'])
      expect(out).toContain('Behind you the false mirrors go dark')
    })
  })

  describe('Memory Vault', () => {
    it('mending the orbs reads the raising and the voices', () => {
      const { game, act } = newGame()
      const vault = act.rooms.MemoryVault as MemoryVault
      const out = vault.mendOrbs(game.state)
      expect(out).toMatch(
        /^You raise the echo stone\. The voices inside it pour out/,
      )
      expect(shape(out)).not.toContain('event')
    })

    it('the mask before the orbs are mended is a read red box', () => {
      const { game, act } = newGame()
      const vault = act.rooms.MemoryVault as MemoryVault
      expect(parseTurn(vault.showMask(game.state))).toEqual([
        {
          kind: 'failure',
          narrated: true,
          markup: 'The Shadow cannot see the mask through the broken memories.',
        },
      ])
    })

    it('the mask shown is read', () => {
      const { game, act } = newGame()
      const vault = act.rooms.MemoryVault as MemoryVault
      game.state.setStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED, true)
      const out = vault.showMask(game.state)
      expect(out).toContain(
        'The Shadow turns the silver mask over in hands that are almost ' +
          'solid now, and gives it back.',
      )
      expect(shape(out)).not.toContain('event')
    })
  })

  describe('Outer Courtyard', () => {
    it('blessing strangers is a read red box, the freeing is read', () => {
      const { game, act } = newGame()
      const yard = act.rooms.OuterCourtyard as OuterCourtyard
      expect(shape(yard.castBless(game.state))).toEqual(['failure*'])
      game.state.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
      expect(shape(yard.castBless(game.state))).toEqual(['text'])
    })
  })
})

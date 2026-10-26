import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'
import { FortressGates } from './FortressGates'
import {
  executeCommands,
  expectItemInInventory,
  expectQuestCompleted,
} from '@/testing/gameHelpers'

/** Create an Act IV game standing at the Fortress Gates. */
function createGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

/** The names of the items lying in the current room. */
function roomItems(game: Game): string[] {
  return game.state.currentRoom.items.map((item) => item.name)
}

describe('FortressGates', () => {
  it('has the correct name', () => {
    expect(new FortressGates().name).toBe('Fortress Gates')
  })

  it('starts with three stones and no fragment or chain on the ground', () => {
    const game = createGame()
    expect(game.state.currentRoom).toBeInstanceOf(FortressGates)
    const items = roomItems(game)
    expect(items).toEqual(
      expect.arrayContaining(['Left Stone', 'Middle Stone', 'Right Stone']),
    )
    expect(items).not.toContain('Ward Stone Fragment')
    expect(items).not.toContain("Guardian's Chain")
    expect(items).not.toContain("Guardian's Essence")
  })

  it('names the three stones in the arrival description', () => {
    const game = createGame()
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      'Three ancient ward stones, left, middle and right, pulse with ' +
        'malevolent energy',
    )
  })

  describe('before the gates fall', () => {
    it('names the odd stone when the ward stones are examined', () => {
      const game = createGame()
      const answer = executeCommands(game, ['examine ward stones'])
      expect(answer).toContain('the right stone brightens a breath after')
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED),
      ).toBe(true)
    })

    it('examines each stone on its own', () => {
      const game = createGame()
      expect(executeCommands(game, ['examine left stone'])).toContain(
        'The left stone swells and fades with the barrier, exactly on the beat.',
      )
      expect(executeCommands(game, ['examine middle ward stone'])).toContain(
        'The middle stone swells and fades with the barrier',
      )
      expect(executeCommands(game, ['examine right stone'])).toContain(
        'The right stone brightens a breath after the barrier does',
      )
    })

    it('refuses light on all the stones and light without a target', () => {
      const game = createGame()
      expect(executeCommands(game, ['cast light on ward stones'])).toContain(
        'They drink it together and keep their count.',
      )
      expect(executeCommands(game, ['cast light'])).toContain(
        'Your light falls on the guardians and slides off them.',
      )
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
    })

    it('answers light on a wrong stone and can be repeated', () => {
      const game = createGame()
      for (let i = 0; i < 2; i++) {
        expect(executeCommands(game, ['cast light on left stone'])).toContain(
          'The stone drinks your light and pulses brighter, and the ' +
            'guardians lean closer for a moment. The barrier keeps its rhythm.',
        )
      }
      expect(executeCommands(game, ['cast light on middle stone'])).toContain(
        'The stone drinks your light',
      )
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED),
      ).toBe(false)
    })

    it('throws the player back at the barrier', () => {
      const game = createGame()
      expect(executeCommands(game, ['go north'])).toContain(
        'A shimmering barrier of dark energy throws you back. It pulses in ' +
          'rhythm with the ward stones.',
      )
    })
  })

  describe('light on the right stone', () => {
    it('solves everything in one cast, without examining first', () => {
      const game = createGame()
      const answer = executeCommands(game, ['cast light on right stone'])
      expect(answer).toContain(
        'Your light finds the right stone between its beats.',
      )
      expect(answer).toContain("guardian's essence[/item_name]")
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(true)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED),
      ).toBe(true)
      expectQuestCompleted(game.state, 'Shattered Ward Guardians')
      expect(roomItems(game)).toEqual(
        expect.arrayContaining([
          'Ward Stone Fragment',
          "Guardian's Chain",
          "Guardian's Essence",
        ]),
      )
      const room = game.state.currentRoom
      expect(room.getExits(game.state)).toEqual({
        north: 'HallOfEchoes',
        east: 'OuterCourtyard',
      })
      expect(room.descriptionFor(game.state)).toContain(
        'The ward stones stand dark and silent now, and the barrier is gone.',
      )
    })

    it('lets the player take the chain and essence, and leave the fragment', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      executeCommands(game, [
        "take guardian's chain",
        "take guardian's essence",
      ])
      expectItemInInventory(game.state, "Guardian's Chain", true)
      expectItemInInventory(game.state, "Guardian's Essence", true)
      expectItemInInventory(game.state, 'Ward Stone Fragment', false)
      expect(executeCommands(game, ['take ward stone fragment'])).toContain(
        'The fragment is cold',
      )
    })

    it('cannot use the fragment on the barrier any more', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      executeCommands(game, ['take ward stone fragment'])
      const answer = executeCommands(game, [
        'use ward stone fragment with barriers',
      ])
      expect(answer).toContain("can't use")
    })

    it('keeps the solved gates through a save and load', () => {
      const game = createGame()
      executeCommands(game, [
        'cast light on right stone',
        "take guardian's chain",
      ])
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(roomItems(reloaded)).toContain("Guardian's Essence")
      expect(roomItems(reloaded)).not.toContain("Guardian's Chain")
      expect(executeCommands(reloaded, ['examine ward stones'])).toContain(
        'Three ward stones, dark and silent.',
      )
    })

    it('keeps the unsolved gates through a save and load', () => {
      const game = createGame()
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(
        executeCommands(reloaded, ['cast light on right stone']),
      ).toContain('Your light finds the right stone')
    })
  })

  describe('a save made before the stones existed', () => {
    it('gets its three stones back on load and can still be solved', () => {
      const game = createGame()
      const gates = game.state.currentRoom
      for (const side of ['left', 'middle', 'right']) {
        gates.removeItem(`${side} stone`)
      }
      expect(roomItems(game)).not.toContain('Right Stone')
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(roomItems(reloaded)).toEqual(
        expect.arrayContaining(['Left Stone', 'Middle Stone', 'Right Stone']),
      )
      executeCommands(reloaded, ['cast light on right stone'])
      expectQuestCompleted(reloaded.state, 'Shattered Ward Guardians')
    })
  })

  describe('after the gates fall', () => {
    /** A game where the right stone has been lit. */
    function solved(): Game {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      return game
    }

    it('describes the stones as dark', () => {
      const game = solved()
      expect(executeCommands(game, ['examine ward stones'])).toContain(
        'Three ward stones, dark and silent. The right one is missing a piece ' +
          'of its face.',
      )
      expect(executeCommands(game, ['examine left stone'])).toContain(
        'The left stone is dark.',
      )
      expect(executeCommands(game, ['cast light on middle stone'])).toContain(
        'The stone is dark. Your light shows only its runes.',
      )
      expect(executeCommands(game, ['cast light on right stone'])).toContain(
        'The stone is dark.',
      )
      expect(executeCommands(game, ['cast light on ward stones'])).toContain(
        'The ward stones are dark.',
      )
    })

    it('answers a bare light with the banished line', () => {
      expect(executeCommands(solved(), ['cast light'])).toContain(
        'The shadow guardians have already been banished. The way forward is clear.',
      )
    })
  })
})

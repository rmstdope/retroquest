import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { PhoenixCrater } from './PhoenixCrater'

/** A bare game state (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

/** The sentences the crater adds once the Phoenix is there. */
const PHOENIX_LINES =
  "At the crater's heart the phoenix lies on a bed of cooled slag, its " +
  'feathers red-gold and steaming. Each breath it lets out sends sparks up ' +
  'out of the bowl. Now and then a feather comes loose and cools on the rim ' +
  'to a shard that still hums.'

function phoenixCount(room: Room): number {
  return room.characters.filter((c) => c.name.toLowerCase() === 'phoenix')
    .length
}

describe('Phoenix Crater', () => {
  it('initializes empty with a north exit', () => {
    const room = new PhoenixCrater()
    expect(room.name).toBe('Phoenix Crater')
    expect(
      room.description.includes('vitrified rock') ||
        room.description.includes('crater'),
    ).toBe(true)
    expect(room.exits).toHaveProperty('north')
    expect(room.items).toEqual([])
    expect(room.characters).toEqual([])
  })

  it('reveals the Phoenix only once when resting', () => {
    const room = new PhoenixCrater()
    const gs = dummyState()
    // First rest: should add Phoenix and update description
    const result = room.rest(gs)
    expect(phoenixCount(room)).toBeGreaterThan(0)
    expect(result).toBe(
      'As your eyes close, the air grows warmer. When you open them, a ' +
        'phoenix is lying in the crater with you, watching you as if it has ' +
        'been there all along.',
    )
    expect(room.descriptionFor(gs)).toContain(PHOENIX_LINES)
    // Second rest: should not add another Phoenix
    const prevCount = phoenixCount(room)
    const result2 = room.rest(gs)
    expect(phoenixCount(room)).toBe(prevCount)
    expect(result2).toContain('The heat of the crater soaks into you')
  })

  describe('before the Phoenix has appeared', () => {
    const DROWSY =
      'The warmth is drowsy here, as if the bowl would rather you sat and ' +
      'rested a while.'

    it('answers talk to anyone with a quiet narrated line', () => {
      const game = new Game([new Act3()])
      game.state.currentRoom = new PhoenixCrater()
      const expected = 'The crater is silent. Nothing comes to those who call.'
      expect(game.talk('phoenix')).toBe(expected)
      expect(game.talk('bird')).toBe(expected)
      expect(game.talk('')).toBe('[failure]Talk to whom?[/failure]')
    })

    it('ends the description with the drowsy sentence', () => {
      const room = new PhoenixCrater()
      expect(room.descriptionFor(dummyState())).toMatch(
        new RegExp(`forge stars\\. ${DROWSY}$`),
      )
    })

    it('drops the sentence and talks normally once the Phoenix is there, even after a save', () => {
      const game = new Game([new Act3()])
      game.state.currentRoom = new PhoenixCrater()
      game.rest()
      const text = game.state.currentRoom.descriptionFor(game.state)
      expect(text).not.toContain(DROWSY)
      expect(text).toContain(PHOENIX_LINES)
      expect(game.talk('phoenix')).not.toContain('crater is silent')

      const fresh = new Game([new Act3()])
      fresh.loadSaveData(game.toSaveData())
      const loaded = fresh.state.currentRoom.descriptionFor(fresh.state)
      expect(loaded).not.toContain(DROWSY)
      expect(loaded).toContain(PHOENIX_LINES)
      expect(fresh.talk('phoenix')).not.toContain('crater is silent')
    })

    it('shows the current text to a save made before the rewrite', () => {
      const game = new Game([new Act3()])
      game.state.currentRoom = new PhoenixCrater()
      game.rest()
      game.state.currentRoom.description =
        'A luminous bowl. At the crater an enormous phoenix reclines on a throne.'
      const fresh = new Game([new Act3()])
      fresh.loadSaveData(game.toSaveData())
      const loaded = fresh.state.currentRoom.descriptionFor(fresh.state)
      expect(loaded).toContain(PHOENIX_LINES)
      expect(loaded).not.toContain('throne')
    })
  })
})

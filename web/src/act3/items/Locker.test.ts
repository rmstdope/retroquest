import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import { Locker } from './Locker'
import { PrismLantern } from './PrismLantern'
import { RustedLockerKey } from './RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game, the Collapsed Pier and its locker. */
function setup(): { game: Game; room: Room; locker: Locker } {
  const game = new Game([new Act3()])
  const room = game.state.allRooms.CollapsedPier
  const locker = room.items.find((i) => i instanceof Locker) as
    | Locker
    | undefined
  expect(locker).toBeDefined()
  return { game, room, locker: locker as Locker }
}

/** The prism lanterns in the room. */
function lanternsIn(room: Room): PrismLantern[] {
  return room.items.filter((i) => i instanceof PrismLantern)
}

describe('Locker', () => {
  it('is examinable and mentions the lock', () => {
    const { game, locker } = setup()

    const out = locker.examine(game.state).toLowerCase()

    expect(out.includes('lock') || out.includes('fused')).toBe(true)
  })

  it('fails to open while locked without spawning lanterns', () => {
    const { game, room, locker } = setup()
    expect(locker.locked).toBe(true)
    game.state.currentRoom = room

    const result = locker.open(game.state)

    expect(result).toContain('[failure]')
    expect(lanternsIn(room)).toHaveLength(0)
    expect(locker.opened).toBe(false)
  })

  it('spawns three lanterns when unlocked and opened', () => {
    const { game, room, locker } = setup()
    game.state.currentRoom = room
    const rusted = new RustedLockerKey()
    const stuckResult = locker.useWith(game.state, rusted)
    expect(stuckResult).toContain('[failure]')
    const unlockResult = locker.unlock(game.state).toLowerCase()
    expect(
      unlockResult.includes('locker') || unlockResult.includes('click'),
    ).toBe(true)
    expect(locker.locked).toBe(false)

    const openResult = locker.open(game.state)

    expect(openResult).toContain('[success]')
    expect(lanternsIn(room)).toHaveLength(3)
    expect(locker.opened).toBe(true)
    const again = locker.open(game.state)
    expect(again.toLowerCase()).toContain('already open')
  })

  it('fails to unlock without the rusted key jammed in first', () => {
    const { game, room, locker } = setup()
    expect(locker.locked).toBe(true)
    game.state.currentRoom = room

    const unlockResult = locker.unlock(game.state)

    expect(unlockResult).toContain('[failure]')
    expect(locker.locked).toBe(true)
  })

  it('repeat actions use only known, balanced tags', () => {
    const { game, room, locker } = setup()
    game.state.currentRoom = room
    locker.locked = false
    locker.open(game.state)

    const unlockAgain = locker.unlock(game.state)
    const openAgain = locker.open(game.state)

    expect(unlockAgain).toContain('already free')
    expect(openAgain).toContain('already open')
    for (const answer of [unlockAgain, openAgain]) {
      expectMarkupWellFormed(answer)
    }
  })
})

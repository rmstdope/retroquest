import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Locker } from './Locker'
import { PrismLantern } from './PrismLantern'
import { RustedLockerKey } from './RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('RustedLockerKey', () => {
  it('provides a plausible name', () => {
    new Game([new Act3()])

    const key = new RustedLockerKey()

    expect(key.name.toLowerCase().startsWith('rusted')).toBe(true)
  })

  it('fails on the locker without changing its state', () => {
    const game = new Game([new Act3()])
    const room = game.state.allRooms.CollapsedPier
    const locker = room.items.find((i) => i instanceof Locker) as
      | Locker
      | undefined
    expect(locker).toBeDefined()
    const rustedKey =
      room.items.find((i) => i instanceof RustedLockerKey) ??
      new RustedLockerKey()
    expect((locker as Locker).locked).toBe(true)
    game.state.currentRoom = room

    const out = rustedKey.useWith(game.state, locker as Locker)

    expect(out).toContain('[event]')
    expect((locker as Locker).locked).toBe(true)
    expect(room.items.filter((i) => i instanceof PrismLantern)).toHaveLength(0)
  })

  it('picking up the key uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new RustedLockerKey().pickedUp(game.state)

    expect(answer).toContain('ragged with corrosion')
    expectMarkupWellFormed(answer)
  })
})

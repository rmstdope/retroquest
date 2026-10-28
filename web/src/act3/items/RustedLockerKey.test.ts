import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Locker } from './Locker'
import { PrismLantern } from './PrismLantern'
import { RustedLockerKey } from './RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('RustedLockerKey', () => {
  it('says it came from the causeway, where it is found', () => {
    const game = new Game([new Act3()])
    const key = new RustedLockerKey()
    const text = key.examine(game.state)
    expect(text).toBe(
      'A corroded iron key from a hollow in the causeway rock, beside the ' +
        'mural. Its teeth are pitted with salt and age.',
    )
    key.description = 'A corroded iron key recovered from the pier vaults.'
    expect(key.examine(game.state)).toBe(text)
  })

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

    expect(out).not.toContain('[event]')
    expect(out).toContain('too corroded for the key to turn')
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

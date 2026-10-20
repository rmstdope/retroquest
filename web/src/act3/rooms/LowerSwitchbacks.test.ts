import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'

describe('Lower Switchbacks', () => {
  it('contains the Emberwater Canteen and the Ash Scholar', () => {
    const act3 = new Act3()
    new Game([act3])

    const room = act3.rooms.LowerSwitchbacks
    // check items and characters
    const itemNames = room.items.map((i) => i.name.toLowerCase())
    const charNames = room.characters.map((c) => c.name.toLowerCase())

    expect(itemNames).toContain('emberwater canteen')
    expect(charNames).toContain('ash scholar')
  })
})

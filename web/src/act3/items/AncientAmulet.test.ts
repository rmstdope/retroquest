import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { AncientAmulet } from './AncientAmulet'

describe('AncientAmulet', () => {
  it('instantiates and provides a name', () => {
    new Game([new Act3()])

    const amulet = new AncientAmulet()

    expect(amulet.name).not.toBeNull()
  })
})

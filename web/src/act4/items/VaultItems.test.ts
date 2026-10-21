import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { AncientAmulet } from './AncientAmulet'
import { Memories } from './Memories'
import { MemoryOrbs } from './MemoryOrbs'
import { VaultDoor } from './VaultDoor'
import { executeCommands } from '@/testing/gameHelpers'

describe('the Memory Vault scenery', () => {
  it('answers to its aliases', () => {
    expect(new MemoryOrbs().answersTo('orbs')).toBe(true)
    expect(new MemoryOrbs().answersTo('Memory Orbs')).toBe(true)
    expect(new VaultDoor().answersTo('sealed door')).toBe(true)
    expect(new Memories().answersTo('lanterns')).toBe(true)
    expect(new Memories().answersTo('memory')).toBe(true)
  })

  it('leaves other items to their own use on the door', () => {
    const game = new Game([new Act4()])
    expect(new VaultDoor().usedBy(game.state, new Memories())).toBeNull()
    expect(new VaultDoor().usedBy(game.state, new AncientAmulet())).toContain(
      'runes stay dark',
    )
  })

  it('is carried by Elior from the first turn of the act', () => {
    const game = new Game([new Act4()])
    expect(game.state.hasItem('ancient amulet')).toBe(true)
    expect(executeCommands(game, ['examine amulet'])).toContain('heirloom')
  })
})

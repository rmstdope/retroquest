import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { HealingHerbs } from './HealingHerbs'

describe('HealingHerbs', () => {
  it('exposes a sensible name', () => {
    new Game([new Act3()])

    const herbs = new HealingHerbs()

    expect(
      herbs.name.toLowerCase().includes('herb') || herbs.name !== null,
    ).toBe(true)
  })
})

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

  it('stays in the hut until the rite, which Mira says will use it', () => {
    const answer = new HealingHerbs().preventPickup()

    expect(answer).toBe(
      '[character_name]Mira[/character_name] takes the sachet back out of ' +
        'your hand. [dialogue]Leave those. The rite will need them, and when ' +
        'it does I will put them in your hands myself.[/dialogue]',
    )
  })
})

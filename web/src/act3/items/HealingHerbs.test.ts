import { describe, it, expect } from 'vitest'
import { HealingHerbs } from './HealingHerbs'

describe('HealingHerbs', () => {
  it('stays in the hut until the rite, which Mira says will use it', () => {
    const answer = new HealingHerbs().preventPickup()

    expect(answer).toBe(
      '[character_name]Mira[/character_name] takes the sachet back out of ' +
        'your hand. [dialogue]Leave those. The rite will need them, and when ' +
        'it does I will put them in your hands myself.[/dialogue]',
    )
  })
})

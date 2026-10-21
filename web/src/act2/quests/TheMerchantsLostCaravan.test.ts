import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { TheMerchantsLostCaravanQuest } from './TheMerchantsLostCaravan'

describe('TheMerchantsLostCaravanQuest text', () => {
  it('credits either spell in the hint before the rescue', () => {
    const quest = new TheMerchantsLostCaravanQuest()
    expect(quest.update(new Game([new Act2()]).state)).toBe(
      'Search the Enchanted Forest for the missing caravan. Try sensing the ' +
        "land, or speaking with the woodland creatures, at the forest's edge.",
    )
  })

  it('credits the forest magic in the completion text', () => {
    const quest = new TheMerchantsLostCaravanQuest()
    expect(quest.completion).toContain(
      'within the Enchanted Forest. Using your forest magic, you discovered ' +
        'their location, then employed quality rope',
    )
    expect(quest.completion).not.toContain('forest speech')
  })
})

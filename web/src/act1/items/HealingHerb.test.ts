import { describe, expect, it } from 'vitest'
import { HealingHerb } from './HealingHerb'

describe('HealingHerb pickup response', () => {
  it('does not promise unavailable healing from Mira', () => {
    const response = new HealingHerb().preventPickup()

    expect(response).toContain('not for taking')
    expect(response).not.toContain('simply ask')
  })
})

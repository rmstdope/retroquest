import { describe, it, expect } from 'vitest'
import { RoyalGardens } from './RoyalGardens'

describe('RoyalGardens', () => {
  it('has the correct name', () => {
    const room = new RoyalGardens()
    expect(room.name).toBe('Royal Gardens')
  })
})

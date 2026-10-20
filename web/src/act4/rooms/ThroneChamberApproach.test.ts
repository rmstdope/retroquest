import { describe, it, expect } from 'vitest'
import { ThroneChamberApproach } from './ThroneChamberApproach'

describe('ThroneChamberApproach', () => {
  it('has the correct name', () => {
    const room = new ThroneChamberApproach()
    expect(room.name).toBe('Throne Chamber Approach')
  })
})

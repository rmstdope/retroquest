import { describe, it, expect } from 'vitest'
import { TowerOfShadows } from './TowerOfShadows'

describe('TowerOfShadows', () => {
  it('has the correct name', () => {
    const room = new TowerOfShadows()
    expect(room.name).toBe('Tower of Shadows')
  })
})

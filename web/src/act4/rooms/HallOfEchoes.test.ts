import { describe, it, expect } from 'vitest'
import { HallOfEchoes } from './HallOfEchoes'

describe('HallOfEchoes', () => {
  it('has the correct name', () => {
    const room = new HallOfEchoes()
    expect(room.name).toBe('Hall of Echoes')
  })
})

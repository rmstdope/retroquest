import { describe, it, expect } from 'vitest'
import { ChamberOfWhispers } from './ChamberOfWhispers'

describe('ChamberOfWhispers', () => {
  it('has the correct name', () => {
    const room = new ChamberOfWhispers()
    expect(room.name).toBe('Chamber of Whispers')
  })
})

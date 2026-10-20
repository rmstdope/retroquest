import { describe, it, expect } from 'vitest'
import { ThroneChamer } from './ThroneChamer'

describe('ThroneChamer', () => {
  it('has the correct name', () => {
    const room = new ThroneChamer()
    expect(room.name).toBe('Throne Chamber')
  })
})

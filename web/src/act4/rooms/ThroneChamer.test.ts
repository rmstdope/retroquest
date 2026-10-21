import { describe, it, expect } from 'vitest'
import { ThroneChamer } from './ThroneChamer'

describe('ThroneChamer', () => {
  it('has the correct name', () => {
    const room = new ThroneChamer()
    expect(room.name).toBe('Throne Chamber')
  })

  it('has no exits until the vault work gives it a way in', () => {
    expect(new ThroneChamer().exits).toEqual({})
  })
})

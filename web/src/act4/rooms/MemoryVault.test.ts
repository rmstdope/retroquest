import { describe, it, expect } from 'vitest'
import { MemoryVault } from './MemoryVault'

describe('MemoryVault', () => {
  it('has the correct name', () => {
    const room = new MemoryVault()
    expect(room.name).toBe('Memory Vault')
  })
})

import { describe, it, expect } from 'vitest'
import { MemoryVault } from './MemoryVault'

describe('MemoryVault', () => {
  it('has the correct name', () => {
    const room = new MemoryVault()
    expect(room.name).toBe('Memory Vault')
  })

  it('has only a south exit', () => {
    expect(new MemoryVault().exits).toEqual({ south: 'ChamberOfWhispers' })
  })
})

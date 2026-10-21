import { describe, it, expect } from 'vitest'
import { MemoryOrbs } from './MemoryOrbs'

describe('MemoryOrbs', () => {
  it('answers to "orbs" and "memory orbs"', () => {
    expect(new MemoryOrbs().answersTo('orbs')).toBe(true)
    expect(new MemoryOrbs().answersTo('Memory Orbs')).toBe(true)
  })
})

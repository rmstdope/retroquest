import { describe, it, expect } from 'vitest'
import { Memories } from './Memories'

describe('Memories', () => {
  it('answers to "memory" and "lanterns"', () => {
    expect(new Memories().answersTo('lanterns')).toBe(true)
    expect(new Memories().answersTo('memory')).toBe(true)
    expect(new Memories().answersTo('memories')).toBe(true)
  })
})

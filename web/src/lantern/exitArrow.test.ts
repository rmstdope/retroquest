import { describe, it, expect } from 'vitest'
import { exitArrow } from './exitArrow'

describe('exitArrow', () => {
  it('gives an arrow for each compass and vertical direction', () => {
    expect(exitArrow('north')).toBe('↑')
    expect(exitArrow('south')).toBe('↓')
    expect(exitArrow('east')).toBe('→')
    expect(exitArrow('west')).toBe('←')
    expect(exitArrow('up')).toBe('⤒')
    expect(exitArrow('down')).toBe('⤓')
  })

  it('gives a dot for other exits', () => {
    expect(exitArrow('secret_passage')).toBe('•')
  })

  it('gives a dot for an exit named like an object property', () => {
    expect(exitArrow('constructor')).toBe('•')
    expect(exitArrow('toString')).toBe('•')
  })
})
